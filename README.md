# PlanePulse PWA v1.3 API fix

Static Vercel PWA. No npm/build required.

Upload only these files/folders to GitHub root:
- api/
- public/
- index.html
- icon.svg
- manifest.webmanifest
- sw.js
- vercel.json
- README.md

Do NOT upload:
- package.json
- package-lock.json
- node_modules/
- src/
- dist/
- server.js

Vercel settings:
- Framework: Other / Static
- Install Command: empty
- Build Command: empty
- Output Directory: empty

Changes:
- Fixes ADS-B response field: supports both `ac` and `aircraft`
- API functions converted to CommonJS to avoid ESM warning
- Keeps GPS, weather/wind, aircraft photo background and 50% overlay
