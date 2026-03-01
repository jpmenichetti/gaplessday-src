

## Move Client-Side Database Queries to Backend Functions

### Overview
This refactor moves all direct database calls from browser code into backend functions, creating a proper API layer. After this change, the browser's Network tab will only show function names and JSON payloads -- no table names, column names, or query structure will be visible.

### Architecture

```text
Browser Hooks              Backend Functions            Database
-----------------          --------------------         --------
useTodos.ts        --->    todos-api/index.ts    --->   todos, todo_images tables
useFilters.ts      --->    user-api/index.ts     --->   user_filters, user_preferences,
useOnboarding.ts   --->                                 user_roles tables
useAdminCheck.ts   --->
useWeeklyReports.ts --->
Admin.tsx          --->    admin-api/index.ts     --->   admin_stats_*, user_roles tables
(image operations) --->    images-api/index.ts    --->   todo_images table + storage bucket
```

### What Changes

**4 new backend functions:**

1. **`supabase/functions/todos-api/index.ts`** -- All todo CRUD via `{ action: "..." }` routing
   - `list`: Fetch active todos with images joined
   - `list_archived`: Paginated archive (with optional search via existing RPCs)
   - `count_archived`: Archive count (with optional search)
   - `add`, `update`, `toggle_complete`, `remove`, `restore`
   - `delete_permanent`, `delete_all`, `bulk_insert`, `archive_completed`
   - `auto_transitions`: Archive expired + move next_week to this_week
   - All queries scoped by authenticated user ID from JWT

2. **`supabase/functions/user-api/index.ts`** -- User preferences and roles
   - `get_filters`, `upsert_filters`
   - `get_onboarding`, `complete_onboarding`
   - `check_admin`
   - `get_weekly_reports`

3. **`supabase/functions/images-api/index.ts`** -- Storage proxy
   - `upload`: Receive base64 file data, validate, store, create DB record
   - `delete`: Remove from storage + DB
   - `get_url`: Return signed URL

4. **`supabase/functions/admin-api/index.ts`** -- Admin stats
   - `get_summary`: Fetch stats summary
   - `get_daily`: Fetch daily stats
   - Reuses existing `compute-stats` for refresh, or merges its logic here

**Config update:**
- `supabase/config.toml`: Add `verify_jwt = false` entries for all 4 new functions (JWT validated in code via `getClaims()`)

**5 hook/page refactors (same public API, different internals):**

5. **`src/hooks/useTodos.ts`** -- Replace all `supabase.from("todos")` calls with `supabase.functions.invoke("todos-api", { body: { action, ... } })`. No changes to the hook's return type or mutation signatures.

6. **`src/hooks/useFilters.ts`** -- Replace `supabase.from("user_filters")` with `supabase.functions.invoke("user-api", ...)`.

7. **`src/hooks/useOnboarding.ts`** -- Replace direct table query with `user-api` call.

8. **`src/hooks/useAdminCheck.ts`** -- Replace direct role query with `user-api/check_admin`.

9. **`src/pages/Admin.tsx`** -- Replace direct stats queries with `admin-api` calls.

10. **`src/hooks/useWeeklyReports.ts`** -- Replace `supabase.from("weekly_reports")` with `user-api/get_weekly_reports`.

### What Stays the Same
- All component code (no UI changes)
- Time simulation logic (client-side `useMemo`)
- CSV export/import parsing (client-side, but insert goes through `todos-api`)
- Auth login/logout (managed by auth SDK)
- Existing `generate-weekly-report` and `compute-stats` functions (unchanged)

### Security Model
- Each function validates the JWT via `getClaims()` to extract `userId`
- Uses service role client internally, but scopes every query with `user_id = userId`
- Admin endpoints additionally check the `user_roles` table
- Image upload validates magic bytes and file size server-side (same checks moved from client)

### Trade-offs

| Aspect | Before | After |
|--------|--------|-------|
| Schema visibility | Table/column names in Network tab | Only function names + JSON |
| Latency | 1 hop (browser to DB) | 2 hops (browser to function to DB) |
| Code complexity | Simple hooks | More backend code, simpler hooks |
| Flexibility | RLS only | Can add rate limiting, logging, validation |
| Image upload | Direct to storage | Proxied as base64 (~33% overhead) |

### Technical Notes
- Edge functions use `createClient` with service role key, scoped by `userId` from JWT
- Standard CORS headers on all functions
- Image upload sends file as base64 in JSON body; function decodes and stores
- Batch operations (delete, insert) maintain 500-per-batch pattern server-side
- Error responses use consistent `{ error: string }` format with HTTP status codes
- Existing RPC functions (`search_archived_todos`, `count_archived_todos`) called from within `todos-api`

