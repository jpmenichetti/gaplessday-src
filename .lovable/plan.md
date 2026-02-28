

## Add Text Search Filter with Debounce (Title, Notes, URLs)

### Overview
Add a debounced text search input to the FilterBar that filters todos by title (`text`), description (`notes`), and links (`urls`). Active todos are filtered client-side; archived todos are filtered server-side via a database function so **all** matching archived items are returned regardless of pagination.

### Changes

**1. Database: Create RPC functions for server-side archive search**

Create two Postgres functions:

- `search_archived_todos(search_term text, page_size int, page_offset int)` -- Returns archived todos where `text`, `notes`, or `urls::text` match the search term (case-insensitive `ILIKE`), filtered by `auth.uid()`, ordered by `removed_at DESC`.
- `count_archived_todos(search_term text)` -- Returns the count of matching archived todos for the same criteria.

**2. `src/i18n/translations.ts`** -- Add `filter.search` placeholder:
- EN: "Search todos..." / ES: "Buscar tareas..." / FR: "Rechercher des taches..." / DE: "Aufgaben suchen..."

**3. `src/hooks/useFilters.ts`** -- Add local search state with debounce:
- Add `searchText` (immediate input value) and `debouncedSearchText` (debounced by ~300ms) using a simple `useEffect` + `setTimeout` pattern
- Expose `searchText`, `debouncedSearchText`, and `setSearchText`
- Include `searchText.length > 0` in `hasActiveFilters`
- Reset `searchText` in `clearFilters`

**4. `src/components/FilterBar.tsx`** -- Add search input:
- Accept `searchText` and `onSearchChange` props
- Render an `Input` with a `Search` icon at the start of the filter bar
- Use the `filter.search` translation as placeholder text

**5. `src/hooks/useTodos.ts`** -- Accept `searchText` parameter for server-side archive filtering:
- Add optional `searchText` parameter
- When `searchText` is non-empty, the archived query calls `search_archived_todos` RPC; the count query calls `count_archived_todos` RPC
- When empty, use the existing table queries (no change)
- Include `searchText` in archive query keys so React Query refetches when the debounced value changes

**6. `src/pages/Index.tsx`** -- Wire everything together:
- Pass `debouncedSearchText` from `useFilters` into `useTodos(debouncedSearchText)`
- Apply client-side text filter to `filteredTodos` using `debouncedSearchText`: case-insensitive match on `todo.text`, `todo.notes`, and `(todo.urls || []).join(" ")`
- Pass `searchText` and `setSearchText` to `FilterBar`

### Technical Notes
- Debounce is 300ms, implemented with `useState` + `useEffect` + `setTimeout` (no extra dependency needed)
- `searchText` is the immediate value shown in the input; `debouncedSearchText` is what triggers queries/filtering
- The RPC functions use `ILIKE` with `%` wildcards for case-insensitive partial matching
- `urls::text` casts the text array to a single string for pattern matching in Postgres
- RPC functions enforce `user_id = auth.uid()` for security
- Search state is ephemeral (not persisted to the `user_filters` table)

