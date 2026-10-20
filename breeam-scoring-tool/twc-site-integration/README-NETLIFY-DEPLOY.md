# Deploying the Live "BREEAM Scorer" Tab on `https://www.temporaryworksconsulting.com/`

This folder contains the complete drop-in files to add the **BREEAM Scorer** live tab and tool directory card to `https://www.temporaryworksconsulting.com/` (hosted on Netlify), alongside the standalone BREEAM Construction Project Scoring Tool application.

## Live Hosted Production URLs (Already Active)

- **Live BREEAM Construction Project Scoring Tool**: [https://twc-breeam-scoring-tool.vercel.app/](https://twc-breeam-scoring-tool.vercel.app/)
- **Subpath Mirror (`/breeam-scoring-tool/`)**: [https://twc-breeam-scoring-tool.vercel.app/breeam-scoring-tool/](https://twc-breeam-scoring-tool.vercel.app/breeam-scoring-tool/)
- **Commercial Office (Excellent) Preset Direct Link**: [https://twc-breeam-scoring-tool.vercel.app/?preset=commercial-office](https://twc-breeam-scoring-tool.vercel.app/?preset=commercial-office)
- **Live Preview of Updated `temporaryworksconsulting.com` Homepage with "BREEAM Scorer" Tab**: [https://twc-breeam-scoring-tool.vercel.app/twc-site-integration/](https://twc-breeam-scoring-tool.vercel.app/twc-site-integration/)

---

## Option A: Zero-Copy Netlify Proxy Rule (Fastest — 1 Line in `_redirects`)

If you want `https://www.temporaryworksconsulting.com/breeam-scoring-tool/` to serve the live Vercel deployment immediately without copying the tool subfolder, add this single proxy rule to the top of `_redirects` in your `twc-netlify-clean-pages` repository:

```text
/breeam-scoring-tool/*  https://twc-breeam-scoring-tool.vercel.app/breeam-scoring-tool/:splat  200
```

Then replace these 3 files + 1 SVG icon in your `twc-netlify-clean-pages` repo from this folder:
1. `index.html` — adds `<a href="/breeam-scoring-tool/">BREEAM Scorer</a>` to `<nav class="hub-primary">` and `<nav class="twc-header-utilities">`, adds **BREEAM Project Scoring Tool** to the `Digital tools` mega-menu, and adds the **BREEAM Project Scoring Tool** card at the top of `#hub-catalogue`.
2. `tools.html` — adds `<a href="/breeam-scoring-tool/">BREEAM Scorer</a>` to the header navigation bar, `Digital tools` mega-menu, and the **Run the site** tool group (`#group-run`).
3. `seatsprep.html` — adds `<a href="/breeam-scoring-tool/">BREEAM Scorer</a>` to the header navigation bar and adds a direct **Open Live BREEAM Project Scoring Tool** CTA button on `/SEATSprep`.
4. `assets/images/tools/breeam-scorer.svg` — matching 800×300 dark/gold/teal architectural SVG card thumbnail.

---

## Option B: Full Static Folder Drop into `twc-netlify-clean-pages`

Copy the entire built folder `/workspace/breeam-scoring-tool/dist/twc-site-integration/` directly into the root of your `twc-netlify-clean-pages` repository:
- `index.html`
- `tools.html`
- `seatsprep.html`
- `assets/images/tools/breeam-scorer.svg`
- `breeam-scoring-tool/` (contains `index.html`, `favicon.svg`, `assets/app.js`, `assets/breeam-engine.js`, `assets/styles.css`, `assets/breeam-hero.svg`, `assets/images/tools/breeam-scorer.svg`)
