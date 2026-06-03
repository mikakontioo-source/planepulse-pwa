# PlanePulse PWA v1.2

Static Vercel version. No npm, no build step.

Upload only these to GitHub root:

- api/
- public/
- index.html
- manifest.webmanifest
- icon.svg
- sw.js
- vercel.json
- README.md

Do not upload:

- package.json
- package-lock.json
- node_modules
- src
- dist
- server.js

Vercel settings:

- Framework Preset: Other / No Framework
- Install Command: empty
- Build Command: empty
- Output Directory: empty

Changes:

- Settings opens as a fixed overlay above the app
- Wind speed added next to temperature
- Device GPS / Fixed location setting
- Aircraft photo background with 50% dark overlay
- Airplane icon remains visible even when a photo is found
