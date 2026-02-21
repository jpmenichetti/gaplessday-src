
# Filter Bar for Todos

## Overview
Add a filter bar above the category grid that lets you filter by overdue status and specific tags. Filters persist across sessions using the database.

## What You'll See
- A horizontal filter bar between the navbar and the category grid
- An "Overdue" toggle button to show only overdue todos
- A tag dropdown/popover showing all available tags as selectable chips
- A "Clear filters" button that appears when any filter is active
- Active filters shown as dismissible badges

## Technical Details

### 1. New Component: `FilterBar.tsx`
Create `src/components/FilterBar.tsx` with:
- A row of filter controls using existing UI components (Button, Badge, Popover)
- "Overdue" toggle button (highlighted when active)
- Tag filter: a Popover with all unique tags displayed as clickable chips (multi-select)
- "Clear filters" button visible only when filters are active
- Active tag filters shown as small dismissible badges

### 2. Persist Filters in Database
Add a `user_filters` table to store filter state per user:
- `id` (uuid, PK)
- `user_id` (uuid, not null, unique)
- `show_overdue` (boolean, default false)
- `selected_tags` (text[], default '{}')
- RLS policies: users can only read/write their own row

### 3. Custom Hook: `useFilters.ts`
Create `src/hooks/useFilters.ts`:
- Fetches the user's saved filters from `user_filters` on load
- Provides `showOverdue`, `selectedTags`, `toggleOverdue`, `toggleTag`, `clearFilters`
- Upserts filter changes to the database (debounced or on change)
- Uses React Query for caching

### 4. Update `Index.tsx`
- Import and render `FilterBar` above the category grid
- Pass filter state from `useFilters` to `FilterBar`
- Filter the `todos` array before passing to `CategorySection`:
  - If `showOverdue` is true, only show todos where `isOverdue(todo)` returns true
  - If `selectedTags` is non-empty, only show todos that have at least one matching tag
  - Both filters combine (AND logic)

### 5. Migration SQL
```sql
CREATE TABLE public.user_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  show_overdue boolean NOT NULL DEFAULT false,
  selected_tags text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own filters" ON public.user_filters
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own filters" ON public.user_filters
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own filters" ON public.user_filters
  FOR UPDATE USING (auth.uid() = user_id);
```
