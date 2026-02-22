

# Admin Dashboard with Pre-computed Statistics

## Overview
Add a role-based admin dashboard at `/admin` that displays pre-computed usage statistics. Admin access is controlled via a `user_roles` table that you populate directly in the database. Statistics are computed by a scheduled edge function and stored in dedicated tables.

## Database Changes

### 1. User Roles Table
A `user_roles` table following security best practices, plus a `has_role` security-definer function to avoid RLS recursion:

- `user_roles` table: `id`, `user_id` (FK to auth.users), `role` (enum: admin, moderator, user)
- RLS: authenticated users can read their own roles only
- `has_role(uuid, app_role)` function for use in policies

### 2. Statistics Tables

**`admin_stats_summary`** -- single-row table updated periodically:
- `id` (always 1), `total_users`, `total_todos`, `todos_today_count`, `todos_this_week_count`, `todos_next_week_count`, `todos_others_count`, `computed_at`

**`admin_stats_daily`** -- one row per day:
- `id`, `stat_date` (date, unique), `unique_users`, `todos_created`, `todos_completed`, `computed_at`

Both tables have RLS policies: SELECT only for users with the `admin` role (via `has_role` function).

### 3. Stats Computation Function (DB function)
A `compute_admin_stats()` PostgreSQL function (security definer) that:
- Counts total users from `auth.users`
- Counts total todos and todos per category from `todos`
- Aggregates daily unique users (from `todos.user_id` + `created_at`), daily todos created, and daily todos completed
- Upserts results into the two stats tables

### 4. Scheduled Execution
A `pg_cron` job that calls `compute_admin_stats()` every hour (or on-demand via an edge function the admin can trigger with a "Refresh" button).

## Edge Function

**`compute-stats`** -- An edge function that:
- Validates the caller is an admin (checks `user_roles`)
- Calls `compute_admin_stats()` via RPC
- Returns success/failure
- Used for the manual "Refresh Stats" button on the dashboard

## Frontend Changes

### 1. New Route: `/admin`
Add to `App.tsx` routing.

### 2. Admin Guard Hook: `useAdminCheck`
- Queries `user_roles` for the current user
- Returns `{ isAdmin, isLoading }`
- Redirects non-admins to `/`

### 3. New Page: `src/pages/Admin.tsx`
- Protected by `useAdminCheck`
- Displays summary cards (total users, total todos, todos per group)
- Displays two time-series charts using Recharts (already installed):
  - Unique users per day
  - Todos created vs completed per day
- "Refresh Stats" button that invokes the edge function
- Navigation back to main app

### 4. Navbar Update
- Show an "Admin" link in the navbar if the user has the admin role

## Technical Flow

```text
[pg_cron hourly] --> compute_admin_stats() --> admin_stats_summary + admin_stats_daily
[Admin clicks Refresh] --> compute-stats edge fn --> compute_admin_stats() --> tables
[Admin page loads] --> SELECT from admin_stats_summary + admin_stats_daily --> Recharts
```

## Security
- `user_roles` table with RLS (users can only read their own roles)
- Stats tables readable only by admins via `has_role()` function
- Edge function validates admin role server-side before computing
- No client-side role checks for access control -- all enforced by RLS

## File Summary

| Action | File |
|--------|------|
| Migration | `user_roles` table, `app_role` enum, `has_role()` function |
| Migration | `admin_stats_summary` + `admin_stats_daily` tables with admin-only RLS |
| Migration | `compute_admin_stats()` DB function |
| SQL insert | `pg_cron` schedule |
| Create | `supabase/functions/compute-stats/index.ts` |
| Create | `src/hooks/useAdminCheck.ts` |
| Create | `src/pages/Admin.tsx` |
| Modify | `src/App.tsx` -- add `/admin` route |
| Modify | `src/components/Navbar.tsx` -- admin link |

