
# Dev Mode: Time Travel for Testing Lifecycle Transitions

## Overview
Add a developer/debug panel that lets you simulate time passing so you can instantly test overdue detection, auto-archiving, and category transitions without waiting for real days or weeks.

## How It Works
A small "Dev Tools" button appears in the navbar (only in development/preview). Clicking it opens a popover where you can set a simulated date. All lifecycle logic (overdue checks, auto-archive) will use this simulated date instead of `new Date()`.

## User Experience
- A small clock/wrench icon button appears next to the language selector in the navbar
- Clicking it opens a popover with:
  - A date picker to set the "simulated now" date
  - A "Reset to real time" button
  - Quick shortcuts: "+1 day", "+1 week"
- When a simulated date is active, a small colored badge indicates time travel is on
- All overdue styling and auto-archive logic immediately reacts to the simulated date

## Technical Details

### New Files

1. **`src/hooks/useSimulatedTime.tsx`** -- A React context that provides a `getNow()` function. By default it returns `new Date()`. When a simulated date is set, it returns that instead. Exposes `simulatedDate`, `setSimulatedDate(date | null)`, and `getNow()`.

2. **`src/components/DevTimeTravel.tsx`** -- The popover UI component with:
   - Date input field
   - "+1 Day" and "+1 Week" shortcut buttons
   - "Reset" button to go back to real time
   - Visual indicator when time travel is active

### Modified Files

1. **`src/App.tsx`** -- Wrap with `SimulatedTimeProvider` (inside `I18nProvider`).

2. **`src/components/Navbar.tsx`** -- Add `DevTimeTravel` component next to the language selector.

3. **`src/hooks/useTodos.ts`** -- Replace `new Date()` in the auto-archive `useEffect` with `getNow()` from the simulated time context. Also remove the `autoArchiveRan` ref guard so it re-runs when the simulated date changes.

4. **`src/hooks/useTodos.ts` (`isOverdue` function)** -- This is a standalone export, not inside a hook, so it will accept an optional `now` parameter instead of using `new Date()`. The calling component will pass `getNow()`.

5. **`src/pages/Index.tsx`** -- Pass `getNow()` to `isOverdue()` calls in the filtered todos logic.

### Architecture

The simulated time context stores the override date in React state (no database persistence needed -- this is a dev-only tool). When the simulated date changes:
- `useTodos` auto-archive effect re-evaluates with the new "now"
- `isOverdue` recalculates with the new "now"  
- UI updates instantly showing what would happen at that future date

### Testing Workflow Example
1. Create a "Today" task and complete it
2. Open Dev Tools, click "+1 Day"
3. The completed task auto-archives immediately
4. Click "Reset" to return to real time
