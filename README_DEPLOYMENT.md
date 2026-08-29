# Deployment Guide — The Crude Oracle

Deploy-ready for **Vercel** (recommended for Next.js) or **Netlify**.
Target domain: **www.thecrudeoracle.com**.

---

## 1. Deploy to Vercel (recommended)

1. Push this repository to GitHub.
2. In [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
   Vercel auto-detects Next.js; no build settings needed (`vercel.json` adds security headers).
3. Click **Deploy**. You get a `*.vercel.app` preview URL immediately.

### Custom domain
1. Project → **Settings → Domains** → add `thecrudeoracle.com` and `www.thecrudeoracle.com`.
2. At your DNS provider: `A` record for apex → `76.76.21.21`, `CNAME` for `www` → `cname.vercel-dns.com` (Vercel shows the exact records).
3. Set `www.thecrudeoracle.com` as primary; Vercel provisions HTTPS automatically.

## 2. Deploy to Netlify (alternative)

1. Netlify → **Add new site → Import an existing project** → pick the repo.
2. `netlify.toml` already sets `npm run build` + the Next.js runtime plugin.
3. Add your domain under **Domain management**; HTTPS is automatic.

---

## 3. Payments — RETIRED

The Crude Oracle's paid subscription has been retired; the site is now 100%
free. The Stripe payment integration that used to live here (Payment Link,
Checkout, the `/api/stripe-webhook` and `/api/billing-portal` routes, the
`stripe` npm dependency, and all `STRIPE_*` environment variables) has been
removed from the codebase entirely — there is nothing to configure and no
payment-related attack surface left running. This section is kept only so the
deployment history is not silently erased; do not re-add these steps unless a
paid tier is reintroduced, and if it is, re-review the removed routes in git
history rather than restoring them verbatim.

---

## 4. Authentication placeholder → production

Current state: `src/lib/access.ts` stores the tier in `localStorage`
(public / free / premium; demo premium code `ORACLE-PREMIUM`). This is a UX
placeholder, **not** a security boundary.

Production path (see `docs/ROADMAP.md`):
1. Create a Supabase project; enable email (magic link) auth.
2. `profiles` table with a `tier` column (`free` | `premium`) — the site is
   fully free, so this column is now purely informational and nothing grants
   `premium` automatically (the Stripe webhook that used to do this has been
   removed).
3. Replace `useAccess()` with a Supabase session hook if server-side identity
   checks are needed anywhere beyond `/api/me`.

---

## 5. Contact form

`/contact` currently opens the visitor's email client (mailto) as a functional
fallback. Before launch, wire it to Formspree, Netlify Forms, Resend or an API
route, and set the real inbox in `src/lib/site.ts` → `contactEmail`.

---

## 6. Post-deploy checklist

- [ ] Domain + HTTPS working on `www.thecrudeoracle.com`
- [ ] `https://www.thecrudeoracle.com/sitemap.xml` and `/robots.txt` reachable
- [ ] Submit sitemap in Google Search Console
- [ ] Run `docs/QA_CHECKLIST.md` in full
