

## Add category move buttons to the detail panel

### Changes

**`src/components/TodoDetailDialog.tsx`**

Add a "Move to" section after the header (category badge + title), visible only when `!readOnly`. Render one button per category excluding the current one, stacked vertically in a column layout.

Each button:
- Shows the category emoji + translated label
- Uses `CATEGORY_CONFIG[cat].bgClass` and `colorClass` for styling
- Full width (`w-full`) so it adapts to panel resizing and mobile
- On click: `onUpdate(todo.id, { category: targetCategory, created_at: new Date().toISOString() })`

Structure:
```tsx
{!readOnly && (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {t("detail.moveTo") /* fallback: "Move to" */}
    </label>
    <div className="flex flex-col gap-1.5">
      {(["today","this_week","next_week","others"] as TodoCategory[])
        .filter(cat => cat !== todo.category)
        .map(cat => (
          <button key={cat} onClick={...} className="w-full text-left px-3 py-2 rounded-md text-sm font-medium {bgClass} {colorClass} hover:opacity-80 transition-opacity flex items-center gap-2">
            <span>{emoji}</span>
            <span>{translated label}</span>
          </button>
        ))}
    </div>
  </div>
)}
```

Place this inside the `<div className="space-y-5">` block, as the first child (before Tags).

**`src/i18n/translations.ts`**

Add `"detail.moveTo"` key with translations (e.g., EN: "Move to", ES: "Mover a", etc.).

