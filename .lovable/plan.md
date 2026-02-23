

## Allow Editing Todo Title from Details Panel

### What Changes

The todo title currently displayed as static text (`<p>` tag) in the detail panel header will become an inline-editable field. Clicking on it turns it into an input; pressing Enter or blurring saves the change via the existing `onUpdate` callback.

### UI Behavior

- In **read-only mode** (archived todos): title stays as plain text, no editing
- In **edit mode**: the title text is rendered as an input that looks like plain text until focused
- Saving triggers on **Enter** key or **blur**
- Empty titles are rejected (reverts to previous value)
- Uses the same debounce-free `onUpdate` pattern already used for tags/urls (immediate save)

### Technical Changes

**`src/components/TodoDetailDialog.tsx`**
- Add `localTitle` state initialized from `todo.text`, synced when `todo.id` changes (same pattern as `localNotes`)
- Replace the static `<p>` element showing `todo.text` (around line 207) with:
  - If `readOnly`: keep as plain `<p>`
  - If editable: render an `<input>` styled to look like the current text (same font size/weight, transparent background, no visible border until focused)
- On blur/Enter: if trimmed value is non-empty and different from `todo.text`, call `onUpdate(todo.id, { text: localTitle.trim() })`; if empty, revert to `todo.text`

No new files, no backend changes, no i18n changes needed (the field is user content, not a label).

