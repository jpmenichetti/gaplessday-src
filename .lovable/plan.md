

## Archive All Completed Todos -- Single Button

### Overview

Add a single "Archive completed" button to the main view that archives all completed (checked) todos at once, across all categories. This gives users a quick way to clean up without waiting for automatic lifecycle transitions.

### Changes

**1. `src/hooks/useTodos.ts`**
- Add a new `archiveCompleted` mutation that finds all non-archived, completed todos and sets `removed: true` and `removed_at: now()` on them in a single batch update
- Expose it from the hook's return object

**2. `src/pages/Index.tsx`**
- Destructure the new `archiveCompleted` from `useTodos()`
- Add a button (with `Archive` icon from lucide-react) between the FilterBar and the category grid
- The button is only visible when there is at least one completed todo in the active list
- On click, it calls `archiveCompleted.mutate()` and shows a toast confirming how many were archived
- Disabled while the mutation is pending

**3. `src/i18n/translations.ts`**
- Add translation keys in all 4 languages:
  - `todo.archiveCompleted`: button label (e.g., "Archive completed", "Archivar completadas", "Archiver terminees", "Erledigte archivieren")
  - `todo.archivedCount`: toast message (e.g., "{count} task(s) archived")

### Design Details

- The button sits in a subtle bar below the filters, aligned right, styled as a `ghost` or `outline` variant with the `Archive` icon
- It only appears when there are completed todos, keeping the UI clean otherwise
- Uses the existing `autoArchiveMutation` pattern (batch update of `removed`/`removed_at`) so no new database changes are needed

### Technical Notes

- No database or RLS changes required -- reuses the existing `removed`/`removed_at` columns and the user's UPDATE policy
- The mutation filters completed todos client-side from the already-fetched `todos` array, then sends the batch update to the database
