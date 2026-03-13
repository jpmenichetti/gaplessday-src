

## Issue: Sticky toast notification after AI report generation

**Problem**: After generating a weekly AI report, the toast notification doesn't auto-dismiss. The user reported it "sticks" on screen.

**Root cause**: The Sonner `<Toaster>` component has no explicit `duration` prop set. By default Sonner toasts auto-dismiss after ~4 seconds, but there are two likely causes for the sticky behavior:

1. **The `toast()` call on line 67 of `WeeklyReportSection.tsx`** uses `toast(t("report.generated"))` — a plain string call. This should auto-dismiss, but if the report generation takes long and triggers multiple state changes, React re-renders could interfere.

2. **More likely**: The `toast.error()` calls or Sonner's default behavior with the `next-themes` provider could cause issues on certain browsers/PWA contexts where the toast doesn't register a dismiss timer properly.

## Proposed Solutions

### Solution A: Add explicit duration to all report toasts (Recommended — simplest fix)
In `WeeklyReportSection.tsx`, add a `duration` option to every toast call:
```typescript
toast(t("report.generated"), { duration: 4000 });
toast(t("report.noTasks"), { duration: 4000 });
toast.error("Rate limited...", { duration: 5000 });
toast.error("Failed to generate report", { duration: 5000 });
```

### Solution B: Set a global default duration on the Toaster component
In `src/components/ui/sonner.tsx`, add `duration={4000}` to the `<Sonner>` component so all toasts across the app auto-dismiss consistently.

### Solution C: Dismiss toast manually after a timeout
Use `toast()` return value to programmatically dismiss:
```typescript
const toastId = toast(t("report.generated"));
setTimeout(() => toast.dismiss(toastId), 4000);
```

**Recommendation**: Combine **Solution A** (explicit duration on report toasts) with **Solution B** (global default on Toaster) for a belt-and-suspenders approach. This ensures the fix applies globally and specifically to the reported flow.

