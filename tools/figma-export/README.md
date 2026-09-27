# Website → Figma export

Scripts used to rebuild the site pages as editable Figma layers
(file: https://www.figma.com/design/t0GRI3vGY8D5GTzPqB13yd/Route-Landing).

1. `extract.js` — opens each page in headless Chromium (Playwright) at 1440px,
   forces scroll-reveal content visible, turns `::before/::after` into real
   elements, then runs `extract_in_page.js` to serialize boxes, text runs,
   SVG icons and images to `out/<page>.json` (images/background rasters go to `out/img/`).
2. `chunk.js` — splits each page tree into chunks under the 50k-char limit of
   the Figma `use_figma` tool (header/footer are cloned from the Leadership page).
3. `builder.js` — the Figma Plugin API script that turns a chunk into frames,
   text (Noto Sans Arabic for Arabic runs, IBM Plex Sans / Urbanist for Latin),
   vectors and image placeholders.
4. `imgmap.json` — image key → Figma node IDs of the placeholders to fill.

Run: `NODE_PATH=$(npm root -g) node tools/figma-export/extract.js`
