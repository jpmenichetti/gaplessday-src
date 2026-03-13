

# Archive Section: Daily Grouping (Revised)

## What changes

Group archived todos by archive date (`removed_at`) with simple date headers separated by a visual separator — no collapsible sub-sections.

## Implementation

### `src/components/ArchiveSection.tsx`

1. **Group todos into date buckets** using `date-fns` (`startOfDay`, `subDays`, `isToday`, `isYesterday`, `format`):
   - "Today", "Yesterday", named days for 5 prior days (e.g., "Monday"), "Older" for 7+ days ago.
   - Use `removed_at` (fallback to `created_at`) as the grouping date.
   - Skip empty groups.

2. **Render each group** as:
   - A `<Separator />` between groups (not before the first one).
   - A simple text header with the day label + count badge (e.g., `Yesterday · 3`).
   - The existing todo rows underneath, unchanged.

### `src/i18n/translations.ts`

Add keys: `archive.today`, `archive.yesterday`, `archive.older` in both `en` and `es`.

### No backend changes needed.

### Files modified
- `src/components/ArchiveSection.tsx`
- `src/i18n/translations.ts`

