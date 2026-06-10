# SpotPlane PWA v31

Static Vercel/PWA build.

Vercel settings:
- Install Command: empty
- Build Command: empty
- Output Directory: public

Changes in v31:
- route label replaces FLIGHT when a route is found
- AirHex logo candidates first, fallback logo sources remain
- airline background circle removed
- compass base stays fixed and only the arrow rotates
- new climbing/descending aircraft SVG indicator
- aircraft-photo overlay transparency lightened from 85% to 70%


Version v31.5: restored the reserved airline logo area to the earlier size and expanded airline logo source candidates: AirHex SVG/PNG, Aviasales/Travelpayouts, Kiwi, and Jxck-S fallback.


## v31.6
- Route lookup fixed: Auto / VRS free route lookup now works without API key and prevents docs pages from appearing.
- Settings spacing improved between Buy Me a Coffee and Save.
