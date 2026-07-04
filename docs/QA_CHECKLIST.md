# QA Checklist — The Crude Oracle

Run before every significant release and before pointing the domain.

## Commercial
- [x] Subscription price shown as **£299.99/month** everywhere (home hero, pricing card, subscribe page, nav CTA, gates)
- [x] Stripe placeholder present (`STRIPE_SUBSCRIPTION_LINK` in `src/lib/site.ts`); `/subscribe` shows a setup warning until replaced
- [ ] Replace placeholder with live Payment Link and test checkout in Stripe test mode
- [x] `/payment/success` and `/payment/cancelled` routes exist and render

## Security
- [x] No secret keys in frontend code (`grep -r "sk_live\|sk_test\|whsec" src/` → empty)
- [x] `.env*` git-ignored; `.env.example` contains placeholders only
- [x] Security headers set (vercel.json / netlify.toml)
- [x] `/admin`, `/account`, `/payment/*` marked noindex / robots-disallowed

## Pages load (build passes = all routes compile & prerender)
- [x] Home, Dashboard, Premium Dashboard, Daily Briefing, Watchlist, Company Intelligence
- [x] Crude Oil Prices, Gas/LNG, OPEC/Supply Risk, UK Energy Security, North Sea
- [x] Oil Truth, Research Library, Subscribe, Login, Account, Contact, About
- [x] Privacy, Terms, Financial Disclaimer, Data Disclaimer, Subscription Terms
- [x] Payment Success, Payment Cancelled, 404, /admin

## Dashboard & data
- [x] Dashboard renders from `/data/*.json` sample data
- [x] Every market/signal card shows **source, last updated, data-type badge**
- [x] Charts render (Brent/WTI, gas, inventories, rigs, OPEC, heatmap, watchlist performance)
- [x] Positive moves green, negative red, risk amber

## Access tiers
- [x] Public pages open without login
- [x] Premium pages show locked gate with upgrade CTA when logged out
- [x] Free login (any email) unlocks free tier messaging
- [x] Demo code `ORACLE-PREMIUM` unlocks premium pages; sign-out resets

## Compliance
- [x] Financial disclaimer text on every content page + footer
- [x] Data disclaimer visible; data-type labels honest (no fake "live" data)
- [x] No "guaranteed profit/signal" language anywhere
- [x] No buy/sell instructions; watchlist cards carry "Watchlist, not recommendation"
- [x] No Bloomberg/Reuters/Argus/Platts branding, layouts or content copied
- [x] No unlicensed real-time exchange data (indicative/manual/placeholder only)

## Responsive & quality
- [x] Mobile nav (hamburger) works; grids collapse at sm/lg breakpoints
- [x] Charts are responsive containers; tables scroll horizontally on mobile
- [ ] Manual device pass (phone / tablet / desktop) after deploy
- [ ] Lighthouse pass ≥ 90 performance / SEO after deploy

## SEO
- [x] Unique title + meta description per page; OG + Twitter metadata
- [x] One H1 per page, structured H2s
- [x] FAQ schema (home, prices, gas, OPEC, UK, subscribe, Oil Truth, North Sea)
- [x] Organization + Product (subscription offer) schema
- [x] sitemap.xml, robots.txt, manifest.json generated
- [ ] Submit sitemap to Google Search Console after domain live
