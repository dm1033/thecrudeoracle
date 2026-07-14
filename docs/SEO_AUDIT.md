# SEO_AUDIT.md — The Crude Oracle
Audited: 2026-07-05

## In place ✅
- Unique title + meta description on all 30+ indexable pages; title template `%s | The Crude Oracle`
- Canonical URLs on every page (pageMeta helper); metadataBase set to https://www.thecrudeoracle.com
- Open Graph + Twitter cards site-wide with brand image (1408×768)
- Structured data: Organization (site-wide), Product+Offer (£299.99 GBP on /subscribe), FAQPage on 8 pages
- sitemap.xml (30 routes, priorities/changefreq), robots.txt (disallow /admin /account /payment/), manifest.json
- H1-per-page + structured H2s; internal linking dense (modules cross-link, footer full map)
- en-GB locale; keyword coverage across target terms (crude oil market intelligence, Brent/WTI analysis, OPEC, North Sea, UK energy security, LNG, tanker market)
- Static prerender for all public pages (fast TTFB via Vercel CDN); next/image optimisation on all photos
- 404 page; noindex on payment/admin/account

## Gaps → backlog
| Gap | Priority | Note |
|---|---|---|
| Premium routes indexable while gating is client-side | High (with B-03) | Acceptable for sample content; add noindex to premium routes OR server-gate before real content |
| No Article/NewsArticle schema on briefings/research | Medium | Add with briefing v2 (B-12) |
| No BreadcrumbList schema | Medium | Add to tools/* and portfolio/* |
| No og:image per-page variants | Low | Single brand card is fine to start |
| Email-signup capture absent | Medium | B-14 — top-of-funnel |
| Lighthouse not yet run on production | Medium | Run post-deploy; images are the main weight (mitigated by next/image) |
| Google Search Console not verified/submitted | High (owner action) | Submit sitemap once ready |

## Do-not-do
No keyword stuffing; no indexing of gated content once real premium content ships; no schema claiming reviews/ratings that don't exist.
