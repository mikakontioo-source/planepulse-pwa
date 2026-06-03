# PlanePulse PWA v1.5 final UI

Static Vercel PWA. No npm/build required.

Upload only these files/folders to GitHub root:
- api/
- index.html
- icon.svg
- manifest.webmanifest
- sw.js
- vercel.json
- README.md

Do NOT upload package.json, package-lock.json, node_modules, src, dist or server.js.

Vercel settings:
- Framework: Other / Static
- Install Command: empty
- Build Command: empty
- Output Directory: empty

Changes:
- Aircraft type and registration on one line, e.g. E190 • OH-LKP
- Airline logo/mark remains on the left
- Compass remains on the right
- Compass indicator is arrow style, not triangle
- Restores PP browser/PWA icon
- Keeps GPS, wind, aircraft photo background and 50% dark overlay
