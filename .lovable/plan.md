

## Add Footer Credits Section to Landing Page

### What will be added
A footer section at the bottom of the login/landing page with:
- A credit line indicating the app was built with Lovable (with a Heart/Code icon)
- A credit line for the icon/logo created with ChatGPT
- A link to the GitHub repository

### Implementation Details

**File: `src/components/LoginPage.tsx`**
- Import `Github`, `Heart`, and `MessageSquare` icons from `lucide-react`
- Add a footer `<div>` after the features section (before the closing `</div>`) with:
  - A horizontal divider
  - "Built with Lovable" line with a Heart icon
  - "Icon created with ChatGPT" line with a MessageSquare icon
  - A GitHub link to `https://github.com/jpmenichetti/owldone-src` with the Github icon
- Styled with muted text, centered layout, and proper spacing

No i18n translations will be added for this section since these are attribution credits that remain in English.

