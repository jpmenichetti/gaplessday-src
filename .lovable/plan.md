

## Convert Todo Detail to a Resizable Side Panel with Persistent Width

### Overview
Replace the current Dialog with a custom right-side panel that can be resized by dragging its left edge. The panel width is saved to `localStorage` so it persists between sessions.

### Changes

**`src/components/TodoDetailDialog.tsx`**
- Remove Dialog imports; replace with a custom slide-in panel using a fixed-position `div` on the right side
- Add a draggable resize handle on the left edge of the panel
- Track panel width in state, initialized from `localStorage` (default ~480px, min 320px, max 50% of viewport)
- On resize end (mouseup/touchend), save the new width to `localStorage` under a key like `todo-panel-width`
- Add a backdrop overlay that closes the panel on click
- Add a close button (X) in the header
- Add smooth slide-in/out animation via CSS transitions
- All internal content (tags, notes, images, URLs) remains unchanged

**`src/pages/Index.tsx`**
- No changes needed -- the component already receives `open`/`onClose` props that work the same way

### Technical Details

- **Resize mechanism**: `onMouseDown` on a thin left-edge handle starts tracking mouse movement via `mousemove`/`mouseup` on `document`. Width = `window.innerWidth - clientX`, clamped to min/max bounds.
- **Persistence**: `localStorage.getItem("todo-panel-width")` on mount, `localStorage.setItem(...)` on resize end.
- **Animation**: CSS transition on `transform: translateX(...)` toggled by the `open` prop.
- **Accessibility**: The backdrop and close button ensure the panel can be dismissed. Focus management via `autoFocus` on the panel container.
- **Mobile**: On small screens (< 640px), the panel takes full width and the resize handle is hidden.

