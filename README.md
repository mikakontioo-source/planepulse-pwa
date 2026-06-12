# SpotPlane PWA v34

Static Vercel/PWA package.

## Deploy
Upload only these to GitHub/Vercel:
- api/
- public/
- vercel.json
- README.md

Vercel settings:
- Output Directory: public
- Build Command: empty
- Install Command: empty

## Changes
- Center climb/descend aircraft icon is 20% smaller and remains white.
- Mini radar aircraft markers use the provided plainplane.svg shape.
- Mini radar spreads nearby aircraft slightly more.
- Route text now displays city names when airport codes are known, e.g. Helsinki → Barcelona, and falls back to HEL → BCN / Flight.
