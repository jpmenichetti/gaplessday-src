

## Fix: Search results not visible in Archive section

### Problem
When searching for a keyword that matches an archived todo, the backend correctly returns the results, but the Archive collapsible section stays **closed by default**. The user has no indication that matching items exist in the archive.

### Solution
Auto-expand the Archive section when there is an active search query and archived results are available. Collapse it back when the search is cleared (unless the user manually opened it).

### Changes

**`src/components/ArchiveSection.tsx`**
- Accept a new prop `autoOpen?: boolean` (true when there's an active search with results)
- Use `useEffect` to auto-open the collapsible when `autoOpen` becomes true
- Track whether the user manually toggled the section to avoid fighting with user intent

**`src/pages/Index.tsx`**
- Pass `autoOpen={!!debouncedSearchText && archived.length > 0}` to `ArchiveSection`

This is a minimal two-file change. No backend modifications needed — the search RPC functions already work correctly.

