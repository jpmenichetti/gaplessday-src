
## CSV Backup and Restore for Todos

### Overview
Add export and import functionality to let users download their todos as CSV and restore from a previously exported CSV file. The restore operation replaces all existing todos after validating the uploaded file.

### Export (Download Backup)
- A download button in the Navbar triggers CSV generation
- Includes all todo fields except images: text, category, tags, notes, urls, completed, completed_at, removed, removed_at, created_at, updated_at
- Arrays (tags, urls) are semicolon-separated within their CSV cell
- File is named `gaplessday-backup-YYYY-MM-DD.csv`

### Restore (Upload Backup)
- An upload button in the Navbar opens a confirmation dialog (AlertDialog)
- The dialog warns that **all existing todos will be deleted** before restoring
- User selects a CSV file; on confirmation, the system:
  1. Validates the file
  2. Deletes all current todos (active + archived) for the user
  3. Inserts the parsed todos from the CSV

### Security Measures for Restore
- **File type validation**: Only `.csv` extension accepted; MIME type checked
- **File size limit**: Max 5MB to prevent abuse
- **Header validation**: The CSV must contain the exact expected column headers
- **Row limit**: Max 10,000 rows to prevent DoS
- **Field sanitization**:
  - `text` and `notes`: trimmed, max 5,000 characters each, HTML tags stripped
  - `category`: must be one of "today", "this_week", "next_week", "others"
  - `completed`, `removed`: must parse to boolean
  - `tags`, `urls`: semicolon-split, each value trimmed, max 50 tags, max 20 URLs
  - URLs validated against a URL pattern
  - Dates validated as ISO 8601 format
- **No script injection**: All text fields are stripped of HTML/script tags before insert
- Malformed rows are skipped with a count reported to the user via toast

### New Files
- **`src/lib/exportCsv.ts`** -- CSV generation and download utility
- **`src/lib/importCsv.ts`** -- CSV parsing, validation, and sanitization utility

### Modified Files
- **`src/components/Navbar.tsx`** -- Add export/import buttons; import `useTodos` for data access; add restore confirmation dialog
- **`src/hooks/useTodos.ts`** -- Add `deleteAllTodos` and `bulkInsertTodos` mutations
- **`src/i18n/translations.ts`** -- Add translation keys for backup/restore labels and confirmation messages in all 4 languages

### Technical Details

**`src/lib/exportCsv.ts`**
```text
- escapeCsvValue(value): handles commas, quotes, newlines
- exportTodosCsv(todos): builds CSV string with header row, triggers download
```

**`src/lib/importCsv.ts`**
```text
- parseCsvFile(file): returns parsed rows as objects
- validateAndSanitize(rows): validates each row, strips HTML, enforces limits
- Returns { validTodos, skippedCount, errors }
```

**`src/hooks/useTodos.ts`** additions
```text
- deleteAllTodos mutation: DELETE FROM todos WHERE user_id = current user
- bulkInsertTodos mutation: INSERT array of sanitized todo objects
```

**`src/components/Navbar.tsx`** additions
```text
- Download icon button: calls exportTodosCsv with all todos
- Upload icon button: opens hidden file input + AlertDialog confirmation
- AlertDialog warns about data replacement, shows file name, proceed/cancel
- On proceed: parse CSV -> validate -> delete all -> bulk insert -> refresh
- Toast notifications for success/failure with skipped row count
```
