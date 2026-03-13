

# Fix: ChevronRight arrow not opening task details

## Problem

In `src/components/TodoCard.tsx` line 98, the wrapper `<div>` around the action buttons (trash + chevron) calls `e.stopPropagation()` to prevent the trash button from triggering the card's `onOpen`. However, this also blocks clicks on the ChevronRight arrow from reaching the parent's `onClick`.

## Fix

Move `stopPropagation` to only the trash button instead of the wrapper div, or wrap the ChevronRight in its own clickable element that calls `onOpen(todo)`.

**Preferred approach**: Make the ChevronRight a `<Button>` that explicitly calls `onOpen(todo)`:

```tsx
<div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
  {!readOnly && (
    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" 
      onClick={(e) => { e.stopPropagation(); onRemove(todo.id); }}>
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  )}
  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"
    onClick={(e) => { e.stopPropagation(); onOpen(todo); }}>
    <ChevronRight className="h-4 w-4" />
  </Button>
</div>
```

## Files modified
- `src/components/TodoCard.tsx` — remove `stopPropagation` from wrapper div, add explicit handlers to each button

