

## Make OwlDone installable as a PWA

### What this does
Adds a service worker and enhances the manifest so users can "install" the app from their browser as a desktop/mobile app. Browser usage remains unchanged.

### Changes

1. **Install `vite-plugin-pwa`** — Vite plugin that auto-generates a service worker and injects the manifest.

2. **Update `vite.config.ts`** — Add the PWA plugin with:
   - App name, theme color, background color from existing manifest
   - Icon definitions (192×192 and 512×512 using existing `favicon.png`)
   - Runtime caching strategy for API calls
   - `registerType: 'autoUpdate'` for seamless updates

3. **Register the service worker in `src/main.tsx`** — Import the virtual `registerSW` module from the plugin.

4. **Remove `public/manifest.json`** — The plugin generates the manifest automatically; keeping the static file would conflict.

### Files modified
- `package.json` (add `vite-plugin-pwa`)
- `vite.config.ts`
- `src/main.tsx`
- Delete `public/manifest.json`

