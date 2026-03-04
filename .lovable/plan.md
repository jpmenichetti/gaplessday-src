

## Differentiate "Move to" buttons with outline/ghost style

### Change

**`src/components/TodoDetailDialog.tsx`** — Update the Move to buttons styling:
- Remove the filled background (`bgClass`) from the buttons
- Use a border/outline style instead: `border` with the category's color as border color
- Keep the emoji and colored text (`colorClass`) but at reduced visual weight
- Apply `hover:bg-{category}/10` for a subtle hover fill effect
- Change from `{bgClass} {colorClass}` to `border {colorClass} bg-transparent hover:opacity-80`

This makes them clearly secondary/actionable compared to the bold category headers.

