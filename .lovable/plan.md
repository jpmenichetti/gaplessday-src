

## Add Features Showcase Section to the Login Page

### Overview

Add a scrollable features section below the existing login form on the landing page. The section will use icon-based cards (Lucide icons) arranged in a responsive grid, with a dedicated "Smart Lifecycle" highlight section that explains the automatic transition and overdue rules in detail.

### Layout Structure

```text
+------------------------------------------+
|           [Logo]                         |
|        GaplessDay                        |
|     "Organize your tasks..."             |
|     [Sign in with Google]                |
|     "Your todos are private..."          |
+------------------------------------------+
|                                          |
|        --- Features Section ---          |
|                                          |
|   [LayoutGrid]        [GripVertical]     |
|   4 Smart Categories  Drag & Drop        |
|                                          |
|   [Tag]               [FileText]         |
|   Tags & Filters      Rich Details       |
|                                          |
|   [Download]           [Globe]           |
|   Backup & Restore     Multi-language    |
|                                          |
+------------------------------------------+
|                                          |
|    --- Smart Lifecycle Rules ---         |
|    (highlighted section)                 |
|                                          |
|  [Clock] Overdue Detection               |
|  - Today: turns overdue if incomplete    |
|    after creation day                    |
|  - This Week: turns overdue if           |
|    incomplete after Sunday 23:59 of      |
|    the creation week                     |
|  - Next Week & Others: never overdue     |
|                                          |
|  [ArrowRightLeft] Automatic Transitions  |
|  - Next Week tasks automatically move    |
|    to This Week when their creation      |
|    week ends (Sunday 23:59)              |
|  - Completed tasks auto-archive:         |
|    Today tasks archive next day,         |
|    weekly tasks archive at end of week   |
|                                          |
+------------------------------------------+
```

### Technical Details

**File: `src/components/LoginPage.tsx`**

- Add a new section below the existing login card (`<div className="mx-4 w-full max-w-md ...">`)
- The page will scroll naturally since the content exceeds the viewport
- Change the outer container from `items-center` centering to a vertical scroll layout with top padding

**Feature cards grid (6 cards, 2 columns on desktop, 1 on mobile):**

| Icon | Title | Description |
|------|-------|-------------|
| LayoutGrid | 4 Smart Categories | Organize tasks into Today, This Week, Next Week, and Others |
| GripVertical | Drag & Drop | Move tasks between categories by dragging cards |
| Tag | Tags & Filters | Label tasks with tags and filter to focus on what matters |
| FileText | Rich Details | Add notes, images, and links to any task |
| Download | Backup & Restore | Export and import your data as CSV anytime |
| Globe | Multi-language | Available in English, Spanish, French, and German |

**Smart Lifecycle highlight section (visually distinct, e.g. bordered card or accent background):**

Two sub-sections with clear rule explanations:

1. **Overdue Detection** (Clock icon)
   - "Today" tasks: marked overdue if still incomplete after their creation day
   - "This Week" tasks: marked overdue if still incomplete after Sunday 23:59 of the week they were created
   - "Next Week" and "Others" tasks: never become overdue

2. **Automatic Transitions** (ArrowRightLeft icon)
   - Incomplete "Next Week" tasks automatically move to "This Week" when their creation week ends (after Sunday 23:59)
   - Completed "Today" tasks auto-archive the next day
   - Completed "This Week" / "Next Week" tasks auto-archive at the end of their completion week
   - "Others" tasks require manual removal

**No i18n changes** -- the features section will be in English only for now (marketing content, not user-facing app labels). This keeps the change small and focused.

**No new files** -- everything is added within `LoginPage.tsx`. No routing changes needed.

