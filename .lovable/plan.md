

## Weekly Report with Summary and Copy-to-Clipboard

**GitHub Issue:** [#2 - Create a weekly report with a summary of todos completed](https://github.com/jpmenichetti/gaplessday-src/issues/2)

### Overview

Generate an AI-written weekly summary of completed todos. The summary is stored in the database and displayed in a collapsible UI section. Users can copy the report text to the clipboard with a single click. Reports older than 3 months are automatically cleaned up.

### Architecture

```text
+------------------+       +-------------------------+       +-------------+
| Scheduled cron   | ----> | Edge Function           | ----> | weekly_     |
| (Sunday night)   |       | generate-weekly-report  |       | reports     |
|                  |       | 1. Fetch completed todos|       | table       |
| Manual trigger   | ----> | 2. Call AI to summarize  |       |             |
| (UI button)      |       | 3. Store report          |       |             |
|                  |       | 4. Delete reports > 3mo  |       |             |
+------------------+       +-------------------------+       +-------------+
                                                                    |
                                                              +-----v-----+
                                                              | Frontend   |
                                                              | Reports UI |
                                                              | + Copy btn |
                                                              +------------+
```

### Database Changes

**New table: `weekly_reports`**
- `id` (uuid, PK, default `gen_random_uuid()`)
- `user_id` (uuid, not null)
- `week_start` (date, not null)
- `week_end` (date, not null)
- `summary` (text, not null)
- `todos_count` (integer, not null, default 0)
- `created_at` (timestamptz, default `now()`)
- Unique constraint on `(user_id, week_start)`

RLS policies:
- SELECT: `auth.uid() = user_id`
- No client-side INSERT/UPDATE/DELETE (edge function uses service role)

### Edge Function: `generate-weekly-report`

- Accepts manual trigger (user JWT, generates for that user) or cron mode (service role, iterates all users)
- Queries todos where `completed = true` and `removed_at` (archived date) falls within the target week
- If no completed todos, skips
- Calls Gemini 2.5 Flash via Lovable AI with prompt: "Summarize the following completed tasks into a brief, natural-language weekly accomplishment report. Write in the same language as the majority of tasks."
- Upserts into `weekly_reports`
- Deletes reports where `week_start < now() - interval '3 months'`

Cron: configured in `supabase/config.toml` to run Sunday 23:59 UTC.

### Frontend Changes

**1. `src/hooks/useWeeklyReports.ts`** (new)
- `useQuery` to fetch reports ordered by `week_start desc`
- `useMutation` to manually trigger report generation
- Exposes `reports`, `latestReport`, `generateReport`, `isGenerating`

**2. `src/components/WeeklyReportSection.tsx`** (new)
- Collapsible section placed between the category grid and the archive
- Shows latest report with week range and summary text
- **Copy button** (clipboard icon) next to each report summary. Uses `navigator.clipboard.writeText()` and shows a toast on success
- "Past reports" expandable list with date ranges and summaries, each with its own copy button
- "Generate report" button (sparkle icon) for manual trigger
- If no reports exist, shows a placeholder message

**3. `src/pages/Index.tsx`**
- Import and render `WeeklyReportSection` between the DndContext block and `ArchiveSection`

**4. `src/i18n/translations.ts`**
- Add keys in all 4 languages:
  - `report.title`: "Weekly Report" / "Reporte semanal" / "Rapport hebdomadaire" / "Wochenbericht"
  - `report.weekOf`: "Week of {start} - {end}"
  - `report.generate`: "Generate report"
  - `report.generating`: "Generating..."
  - `report.noReports`: "No reports yet. Complete some tasks and generate your first weekly report!"
  - `report.pastReports`: "Past reports"
  - `report.generated`: "Report generated successfully"
  - `report.noTasks`: "No completed tasks found for this week"
  - `report.copied`: "Report copied to clipboard" / "Reporte copiado" / "Rapport copie" / "Bericht kopiert"
  - `report.copy`: "Copy report" / "Copiar reporte" / "Copier le rapport" / "Bericht kopieren"

### Copy-to-Clipboard Details

- Each report card has a ghost icon button (Copy/Clipboard icon from lucide-react) in the top-right corner
- On click: `navigator.clipboard.writeText(report.summary)` then `toast(t("report.copied"))`
- The button shows a brief check-mark animation (swap icon to `Check` for 2 seconds) to confirm the copy
- Works for both the latest report and each past report in the list

### Technical Notes

- Uses Lovable AI (google/gemini-2.5-flash) for summarization -- no API key needed
- The AI prompt detects task language and writes the summary accordingly
- 3-month cleanup runs inside the same edge function call
- Reports are read-only from the client (no user editing/deleting)
- The copy feature uses the standard Clipboard API with a fallback toast if it fails

