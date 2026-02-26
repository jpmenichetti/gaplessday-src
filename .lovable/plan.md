

## Add Pagination to the Archive List

**GitHub Issue:** [#3 - Add pagination to the archive list](https://github.com/jpmenichetti/gaplessday-src/issues/3)

### Problem

The archive section currently loads all archived todos in a single query with no limit. As users accumulate archived items, this becomes a performance bottleneck -- both for the database query and for rendering a potentially very long list.

### Solution

Implement cursor-based pagination in the archive section: load a fixed page size (e.g. 20 items), and show a "Load more" button at the bottom to fetch the next page. This uses React Query's `useInfiniteQuery` to handle page state.

### Changes

**1. `src/hooks/useTodos.ts`**
- Replace `archivedQuery` (currently `useQuery`) with `useInfiniteQuery`
- Each page fetches 20 rows from `todos` where `removed = true`, ordered by `removed_at desc`, using Supabase's `.range(from, to)` for offset-based pagination
- Expose `fetchNextPage`, `hasNextPage`, and `isFetchingNextPage` from the hook's return alongside the flattened `archived` array
- Update the `virtualArchived` memo to flatten all pages before applying simulation logic

**2. `src/components/ArchiveSection.tsx`**
- Accept new props: `onLoadMore`, `hasMore`, and `isLoadingMore`
- Render a "Load more" button at the bottom of the list when `hasMore` is true
- The button is disabled while `isLoadingMore` is true and shows a loading indicator

**3. `src/pages/Index.tsx`**
- Pass the new pagination props (`fetchNextPage`, `hasNextPage`, `isFetchingNextPage`) from `useTodos()` down to `ArchiveSection`

**4. `src/i18n/translations.ts`**
- Add `archive.loadMore` translation key in all 4 languages (e.g. "Load more", "Cargar mas", "Charger plus", "Mehr laden")

### Technical Notes

- Uses `useInfiniteQuery` with offset-based pagination via Supabase `.range()` -- simple and fits the existing `removed_at desc` ordering
- Page size of 20 keeps initial load fast while still showing a meaningful amount of history
- The "delete by period" and "delete all" features continue to work against the loaded pages; bulk delete of all archived todos still sends the IDs of what's loaded (users can load more first if needed)
- The simulation memo (`virtualArchived`) will flatten all fetched pages before prepending simulated archives
- No database changes required

