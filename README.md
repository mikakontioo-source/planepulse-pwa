# PlanePulse PWA - Vercel public output version

This version is intentionally static: no npm, no build step.

GitHub root should contain only:
- api/
- public/
- vercel.json
- README.md

Vercel settings:
- Framework Preset: Other / No Framework
- Install Command: empty
- Build Command: empty
- Output Directory: public

Do not upload package.json, package-lock.json, node_modules, src, dist or server.js.
