# PlanePulse PWA 1.1

Static Vercel version. No npm, no build step.

New features:
- Device GPS / Fixed Location in Settings
- Aircraft photo background lookup by aircraft registration
- 50% dark overlay over photo background
- Airplane icon remains visible even when photo background is shown

Upload these files to the root of the GitHub repo:
- index.html
- api/
- manifest.webmanifest
- icon.svg
- sw.js
- vercel.json
- README.md

Vercel settings:
- Install Command: empty
- Build Command: empty
- Output Directory: empty

If old UI remains on iPad, delete the Home Screen icon, clear Safari cache for the site, and add it again.
