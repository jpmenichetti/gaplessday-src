

# Internationalization (i18n)

## Overview
Add multi-language support (English, Spanish, French, German) with a language selector in the navbar. The selected language is persisted in the `user_preferences` database table so it carries across sessions and devices.

## User Experience
- A language selector dropdown appears in the navbar (between the avatar and logout button)
- Shows a globe icon with the current language code (EN, ES, FR, DE)
- Changing the language instantly updates all UI text
- The selection is saved to the database automatically
- Before login, the app defaults to English

## What Gets Translated
All hardcoded UI strings across these components:
- **LoginPage**: tagline, button text, footer text
- **Navbar**: brand name stays as-is (it's a proper noun)
- **FilterBar**: "Overdue", "Tags", "Select tags to filter", "Clear filters"
- **CategorySection**: category labels ("Today", "This Week", etc.), info text, "No tasks yet"
- **AddTodo**: placeholder text ("Add to Today...")
- **TodoCard**: "overdue" badge
- **TodoDetailDialog**: section labels ("Tags", "Notes", "Images", "Links"), placeholders
- **ArchiveSection**: "Archive", date labels ("Created", "Archived")
- **OnboardingDialog**: all step titles and descriptions, button labels

## Technical Details

### Database Change
Add a `language` column to the existing `user_preferences` table:

```sql
ALTER TABLE public.user_preferences
  ADD COLUMN language text NOT NULL DEFAULT 'en';
```

The types file will auto-update to reflect this.

### New Files

1. **`src/i18n/translations.ts`** -- Translation dictionary object with keys for all four languages (en, es, fr, de). Flat key structure like `"filter.overdue"`, `"category.today"`, etc.

2. **`src/i18n/I18nContext.tsx`** -- React context provider exposing:
   - `t(key)` function to get translated string
   - `language` current language code
   - `setLanguage(lang)` to change and persist

3. **`src/components/LanguageSelector.tsx`** -- Dropdown component using the existing Select UI component, showing globe icon + language code.

### Modified Files

1. **`src/hooks/useOnboarding.ts`** -- Expand to also fetch/save the `language` field from `user_preferences` (or create a new `useUserPreferences` hook that both onboarding and i18n consume).

2. **`src/App.tsx`** -- Wrap the app with `I18nProvider`.

3. **`src/components/Navbar.tsx`** -- Add `LanguageSelector` component.

4. **`src/components/LoginPage.tsx`** -- Replace hardcoded strings with `t()` calls.

5. **`src/components/FilterBar.tsx`** -- Replace hardcoded strings with `t()` calls.

6. **`src/components/CategorySection.tsx`** -- Replace hardcoded strings with `t()` calls. The `CATEGORY_INFO` and `CATEGORY_CONFIG` labels become dynamic.

7. **`src/hooks/useTodos.ts`** -- Make `CATEGORY_CONFIG.label` either a translation key or move label resolution to components.

8. **`src/components/AddTodo.tsx`** -- Replace placeholder with `t()` call.

9. **`src/components/TodoCard.tsx`** -- Replace "overdue" badge text.

10. **`src/components/TodoDetailDialog.tsx`** -- Replace section labels and placeholders.

11. **`src/components/ArchiveSection.tsx`** -- Replace "Archive", "Created", "Archived" text.

12. **`src/components/OnboardingDialog.tsx`** -- Replace all step content with translated versions.

13. **`src/pages/Index.tsx`** -- Minor adjustments if needed.

### Architecture

```text
App
 +-- I18nProvider (context with t(), language, setLanguage)
      +-- All components use useI18n() hook to get t()
```

The `I18nProvider` will:
- Load the language from `user_preferences` on mount (defaults to 'en')
- Provide `t(key)` that looks up the current language in the translations object
- On `setLanguage()`, update context state immediately and persist to database via upsert

### Translation Key Structure (sample)

```text
login.tagline, login.button, login.footer
nav.signout
filter.overdue, filter.tags, filter.selectTags, filter.clear
category.today, category.thisWeek, category.nextWeek, category.others
category.info.today, category.info.thisWeek, ...
category.noTasks
addTodo.placeholder (with {category} interpolation)
todo.overdue
detail.tags, detail.notes, detail.images, detail.links
detail.addTag, detail.addNotes, detail.uploadImage
archive.title, archive.created, archive.archived
onboarding.step1.title, onboarding.step1.description, ...
onboarding.back, onboarding.next, onboarding.getStarted
lang.en, lang.es, lang.fr, lang.de
```

