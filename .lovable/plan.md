

# Rebrand: GaplessDay to OwlDone

## Overview
Rename the app from "GaplessDay" to "OwlDone", replace the logo/favicon, update the color palette to match the new owl branding, and switch the font to Nunito.

## 1. Replace Logo and Favicon
- Copy the standalone owl icon (`ChatGPT_Image_27_feb_2026_17_08_30.png`) to `src/assets/logo.png` (used in Navbar and LoginPage)
- Copy the icon-with-text version (`ChatGPT_Image_27_feb_2026_17_08_11.png`) to `public/favicon.png` (used as favicon); alternatively crop/use the standalone icon for the favicon since it works better at small sizes

## 2. Update App Name in Code
Files to update with "OwlDone" replacing "GaplessDay" / "Gapless":

- **`index.html`** -- title, og:title, twitter:title, description meta tags
- **`src/components/Navbar.tsx`** -- alt text and the `Gapless<span>Day</span>` heading becomes `Owl<span>Done</span>`
- **`src/components/LoginPage.tsx`** -- alt text and the `Gapless<span>Day</span>` heading
- **`src/i18n/translations.ts`** -- onboarding welcome text in all 4 languages ("Welcome to OwlDone!", etc.)
- **`src/hooks/useAuth.tsx`** -- localStorage keys (`gaplessday_was_signed_in` to `owldone_was_signed_in`)
- **`src/lib/exportCsv.ts`** -- CSV filename prefix (`owldone-backup-...`)
- **`src/components/Navbar.tsx`** -- GitHub issues link (update or remove the gaplessday-src reference)

## 3. Update Colors
Based on the owl logo, the palette uses:
- **Navy blue** (primary) -- already close to current; keep or fine-tune to match the owl's body (~`hsl(220, 30%, 35%)`)
- **Warm amber/gold** (accent) -- replace the current green accent with the owl's eye/beak color (~`hsl(35, 70%, 55%)`)

Files to update:
- **`src/index.css`** -- change `--accent` in both light and dark themes from green (`152 55% 42%`) to amber/gold (`35 70% 55%` light, `35 70% 50%` dark). Adjust `--primary` values if needed for a closer navy match.

## 4. Switch Font to Nunito
- **`src/index.css`** -- change the Google Fonts import from `Space Grotesk` + `Inter` to `Nunito` (with weights 400, 500, 600, 700). Update the body/heading CSS rules to use `'Nunito', sans-serif`.
- **`tailwind.config.ts`** -- update `fontFamily.display` and `fontFamily.body` to `["Nunito", "sans-serif"]`.

## Technical Details

### Color changes in `src/index.css`
```text
Light theme:
  --accent: 35 70% 55%        (was 152 55% 42%)
  --accent-foreground: 0 0% 100%  (keep white)

Dark theme:
  --accent: 35 70% 50%        (was 152 55% 42%)
  --accent-foreground: 0 0% 100%  (keep)
```

Also update any sidebar or ring values that reference the green accent to match the new amber.

### Font import change
```text
Before: @import url('...Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600...')
After:  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap')
```

### Files changed (summary)
| File | Change |
|------|--------|
| `src/assets/logo.png` | Replace with standalone owl icon |
| `public/favicon.png` | Replace with standalone owl icon |
| `index.html` | Title + meta tags to "OwlDone" |
| `src/index.css` | Font import + accent color |
| `tailwind.config.ts` | Font family |
| `src/components/Navbar.tsx` | Name + alt text |
| `src/components/LoginPage.tsx` | Name + alt text |
| `src/i18n/translations.ts` | Onboarding welcome strings (4 languages) |
| `src/hooks/useAuth.tsx` | localStorage key |
| `src/lib/exportCsv.ts` | CSV filename prefix |

