
## Updated Todo Management App Plan

### Everything from the previous plan, plus these additions:

---

### Enhanced Todo Items

Each todo now supports **rich content** beyond the initial text:

#### Tags
- Users can add one or more **tags** (short labels) to any todo
- Tags are shown as small colorful chips/badges on the todo card
- Users can type a tag and press Enter to add it, with an "x" to remove
- Tags are freeform text (no predefined list)

#### Multimedia Detail Card
After a todo is created, users can expand it or click into it to reveal a **detail card** with:

1. **Additional Notes** — A rich text area for extra context, descriptions, or thoughts
2. **Images** — Users can upload images (stored in Supabase Storage) that display as thumbnails in the card; clicking opens a larger view
3. **URLs / Links** — Users can add one or more URLs; displayed as clickable links with the URL text shown

The detail card opens as an expandable panel or a modal/dialog when the user clicks on a todo.

---

### Updated Data Model

Each todo will store:
- Text, category, creation date, completion/removal status (as before)
- **Tags**: array of strings
- **Notes**: additional text field
- **Images**: references to uploaded files in Supabase Storage
- **URLs**: array of link strings

---

### UI Flow
1. User creates a todo with just text (quick entry, as before)
2. The todo appears in its category with an "expand" or "details" icon
3. Clicking it opens the detail card where users can:
   - Add/remove tags
   - Write additional notes
   - Upload images
   - Add/remove URLs
4. Tags are always visible on the collapsed todo card as small badges
5. A small icon indicates if a todo has attachments (images/links/notes)

---

### Archive
- Archived todos retain all their detail card data (tags, notes, images, URLs) and remain viewable in read-only mode

---

### Design
- Colorful category accents (as before)
- Tags rendered as small rounded badges in varied colors
- Image thumbnails in a grid layout within the detail card
- URLs shown as clickable pill-shaped links
- Clean, card-based layout that doesn't feel cluttered despite the extra content
