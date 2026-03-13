

## Issue #7: Drag & Drop looks buggy

**Problem**: When dragging a todo card between categories, the visual behavior is glitchy. The card stays in its original position and translates via CSS transform, leaving a ghost behind and causing layout shifts.

**Root cause**: The `useDraggable` hook's `setNodeRef` is attached only to the small grip icon handle, not the full card. However, the `transform` style is applied to the entire card container. This mismatch means:
1. The original card remains in the DOM flow (taking up space) while being translated away visually
2. The `DragOverlay` renders a second copy of the card, so the user sees both the original (partially visible) and the overlay
3. No `position: relative` or proper z-indexing on the dragged card

**Proposed fix** (3 changes in 2 files):

### 1. TodoCard.tsx -- Hide the original card while dragging
When `isDragging` is true, the original card should be invisible (not just semi-transparent) since the `DragOverlay` already renders a visible copy:

```tsx
// Change opacity-50 to invisible
isDragging && "opacity-0 pointer-events-none",
```

This prevents the "double card" visual glitch. The `DragOverlay` in `Index.tsx` already provides the floating card visual.

### 2. TodoCard.tsx -- Add relative positioning for z-index to work
Add `relative` to the card's className so `z-50` during drag has an effect:

```tsx
"group relative flex items-start gap-3 rounded-lg border p-3 ..."
```

### 3. Index.tsx -- Improve DragOverlay drop animation
Add `dropAnimation` config to the `DragOverlay` to make the drop feel smoother instead of snapping:

```tsx
import { ..., defaultDropAnimationSideEffects } from "@dnd-kit/core";

const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0" } } }),
};

<DragOverlay dropAnimation={dropAnimation}>
```

### Summary of changes
- **`src/components/TodoCard.tsx`**: Change `isDragging` class from `opacity-50` to `opacity-0 pointer-events-none`; add `relative` to the card
- **`src/pages/Index.tsx`**: Import `defaultDropAnimationSideEffects`, add smooth drop animation config to `DragOverlay`

