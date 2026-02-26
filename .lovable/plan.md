

## Fix Archive Count to Show Total Items

### Problem

The archive section header displays the count of **loaded** items (`todos.length`), which is always capped at 20 due to pagination. Users see "20" even when they have hundreds of archived items.

### Solution

Add a separate lightweight query to fetch the total count of archived todos, and display that in the header instead.

### Changes

**1. `src/hooks/useTodos.ts`**
- Add a new `useQuery` that runs `SELECT count` on archived todos: `supabase.from("todos").select("*", { count: "exact", head: true }).eq("removed", true)`
- This returns only the count without fetching any rows (very fast)
- Expose `archivedCount` (number) from the hook's return object
- Invalidate this query alongside the existing `archived-todos` invalidations

**2. `src/components/ArchiveSection.tsx`**
- Add a `totalCount` prop (number)
- Replace `{todos.length}` in the header badge with `{totalCount}`

**3. `src/pages/Index.tsx`**
- Pass the new `archivedCount` from `useTodos()` as `totalCount` to `ArchiveSection`

### Technical Notes
- Uses Supabase's `head: true` + `count: "exact"` which performs a `SELECT count(*)` without returning rows -- negligible performance cost
- The count query key (e.g. `["archived-todos-count"]`) will be invalidated alongside existing `archived-todos` invalidations so it stays in sync

