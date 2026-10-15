# NeedACalc: domestic design landing page and launch handoff

Prepared 15 October 2026. The page follows the requested order: hero; project pain points; eight services; why choose David; four-step process; about; trust and clearly labelled illustrative report content; FAQ; enquiry/contact; professional footer. It retains the TWC graphite, off-white and refined gold family with responsive sans-serif typography, a code-native architectural illustration and persistent quote routes. No generated project photographs, invented testimonials, verified project claims or competitor price benchmarks are used.

## Domain decision

Preferred name: **NeedACalc.co.uk**. This is a recommendation, not an availability or ownership claim. Alternatives to check at registration time: DomesticCalcs.co.uk, PermitCalc.co.uk, ClearStructural.co.uk, FasterStructural.co.uk, MillerStructural.co.uk and MillerCEng.co.uk. No domain has been bought, reserved or connected.

The lead question remains “Need a calculation for building permission?” with “Faster. Clearer. Better value.” The copy explains Building Control and planning permission are separate. This replaces an unsupported universal claim to be faster and cheaper than every competitor. Only CEng is displayed as the engineering registration suffix; do not add an institutional membership abbreviation or badge without confirming the exact authorised designation.

## Private design preview

A private Sites publication is used for design review. It is a static preview of this page and its supporting documents, not a Netlify production launch. Private preview is excluded from search indexing. The Stripe API functions are retained in this GitHub source for the later Netlify deployment; they do not run in the static Sites publication. Live payment configuration remains gated and unverified as detailed in PAYMENTS.md.

## Netlify deployment when the domain is chosen

Use a **dedicated NeedACalc project**, linked to this GitHub repository and the reviewed NeedACalc branch/commit. Do not replace The Crude Oracle site.

- Base directory: `structuralengineeringsite`
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`
- Configuration: the nested `structuralengineeringsite/netlify.toml`, without the root Next.js runtime plugin
- Node: 22 or 24

The explicit build allowlist publishes HTML, SVG/CSS/JS assets and supporting policies; no server code, operator ledger, secrets or private evidence is exposed as static content. Netlify packages functions separately. Test the dedicated Netlify preview before assigning the domain. Validate successful HTTPS, headers, mobile layout, document links, enquiry submission and attachment delivery from the deployed origin.

After the chosen domain is owned, add apex and www in the dedicated project's domain settings, choose one canonical host, follow the returned DNS instructions, and verify TLS. Then update canonical/OG URLs, sitemap and robots for that exact domain and production origin. Domain-specific metadata is deliberately not hard-coded to an unchosen name. Apply any permanent redirects from the alternate host. No registrar or DNS changes have been made.

## Release checks retained

1. Confirm professional registration wording, legal entity details, current PI cover, scope of services and commission terms. The site does not promise Building Control approval, site verification or a universal compliance outcome.
2. Replace the visibly labelled testimonial/case-study space only with approved genuine content. The architectural scene and report examples are illustrations, not engineering designs or completed client projects.
3. Verify FormSubmit inbox activation, attachment receipt, reply routing, privacy disclosure and fallback from the Netlify origin. DOM tests use mocked transport and send no enquiry. The client-side form requires JavaScript and provides email fallback; it does not claim an inbox receipt from an HTTP status alone.
4. Complete the Stripe sandbox and production checklist in PAYMENTS.md before enabling payment invitations. Payment is only after written scope acceptance, and never constitutes construction approval.
5. Browser rendering and mobile visual QA remain unverified here: the managed browser-control skill is not available in this environment. No browser pass is claimed. Functional DOM, syntax, build, local-link and publication checks are used within that limitation.

References used for the regulatory distinctions: https://www.gov.uk/building-regulations-approval and https://www.gov.uk/party-walls-building-works. Requirements are confirmed for the project's jurisdiction; the Party Wall etc. Act 1996 references England and Wales.
