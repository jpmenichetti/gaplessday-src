

# Onboarding Experience

## Overview
When a user signs in for the first time, they'll see a multi-step onboarding dialog that walks them through the app's key features. The onboarding state is persisted in the database so it only shows once.

## What the user will see
A welcoming modal dialog with a stepper/carousel containing these steps:

1. **Welcome** -- Brief intro to GaplessDay: "Organize your tasks into time-based groups that automatically keep you on track."
2. **Creating Tasks** -- Type in the input field within any category and press the "+" button.
3. **Task Details** -- Click a task card to open its detail panel where you can add tags, notes, images, and links.
4. **Drag and Drop** -- Drag tasks between the four groups (Today, This Week, Next Week, Others) to reprioritize.
5. **Filters** -- Use the Overdue and Tags filter buttons at the top to focus on what matters.
6. **Automatic Transitions** -- Tasks move between groups automatically based on time rules. Each group header has an info icon explaining its rules.

Each step will have a short title, description, and a relevant icon/emoji. Navigation via "Next" / "Back" / "Get Started" buttons, plus a progress indicator (dots).

## Technical Details

### Database
- Add a new `user_preferences` table with columns:
  - `id` (uuid, PK, default gen_random_uuid())
  - `user_id` (uuid, unique, not null)
  - `onboarding_completed` (boolean, default false)
  - `created_at` / `updated_at` (timestamptz)
- RLS: users can only read/update their own row
- Insert a row automatically on first query if none exists

### New Files
- `src/components/OnboardingDialog.tsx` -- The multi-step dialog component with all onboarding content
- `src/hooks/useOnboarding.ts` -- Hook to check/update onboarding status via the `user_preferences` table

### Modified Files
- `src/pages/Index.tsx` -- Import and render `OnboardingDialog` after login, passing the onboarding state

### Component Design
- Uses the existing `Dialog` component from the UI library
- Step content stored as a simple array of objects (title, description, icon)
- Progress dots at the bottom, Back/Next/Finish buttons
- On "Get Started" click, marks `onboarding_completed = true` in the database
- Clean, minimal design consistent with the existing app theme

