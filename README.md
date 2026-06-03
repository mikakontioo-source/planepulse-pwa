PlanePulse PWA v18

Static Vercel version: upload only these files/folders to GitHub:
- api/
- public/
- fonts/ (optional, empty by default)
- index.html
- manifest.webmanifest
- icon.svg
- sw.js
- vercel.json
- README.md

Do NOT upload package.json, package-lock.json, node_modules, src, dist or server.js.

Airport font:
This package is prepared for Airport Typeface, but the actual font file is not included.
Buy/license Airport from Revolver Type, then place the webfont as:
  fonts/Airport.woff2
The app will then use it automatically. Without it, it falls back to system fonts.
