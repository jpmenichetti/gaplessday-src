

## Avatar Dropdown Menu

### Overview

Replace the standalone Export, Import, Sign Out buttons and Avatar with a single clickable Avatar that opens a dropdown menu containing all those actions plus a new "Report Issue" link.

### What changes

**File: `src/components/Navbar.tsx`**

1. Import `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator` from `@/components/ui/dropdown-menu` and add `Bug` icon from `lucide-react`.

2. Remove the standalone Export, Import, and Sign Out buttons from the navbar (lines 113-135).

3. Replace the current Avatar + Sign Out button with a `DropdownMenu` where:
   - **Trigger**: The Avatar (clickable, with cursor-pointer styling)
   - **Menu items**:
     - Export (with Download icon) -- calls `handleExport`
     - Import (with Upload icon) -- triggers `fileInputRef.current?.click()`
     - Separator
     - Report Issue (with Bug icon) -- links to `https://github.com/jpmenichetti/lovable-tasks/issues/new/choose` in a new tab
     - Separator
     - Sign Out (with LogOut icon) -- calls `signOut`

4. The hidden file input and AlertDialog remain unchanged.

### Result

The navbar will be cleaner with fewer icons. On mobile, only the logo, admin shield (if admin), DevTimeTravel (if admin), LanguageSelector, and Avatar will show. All other actions are accessed via the avatar dropdown.

