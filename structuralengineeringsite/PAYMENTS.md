# NeedACalc: quotation-led payments

**Review status: implementation prepared; NOT approved for production release.**
Reviewed against PR #21 head `f78b9ae06d6b895492466374acdadb182e8003b5` on 15 October 2026. No real customer commissions or payments have been created. No credentials are in this repository.

## Selected payment option

| Option | Fit for this practice | Decision |
| --- | --- | --- |
| Hosted Payment Links | Easy to create manually. Usually reusable; quote-specific amount, revision, acceptance evidence, purchase limits and deactivation require disciplined administration. Public client-reference parameters alone are not proof of acceptance. | Possible manual fallback, not the implemented commission flow. |
| Stripe-hosted Checkout Session | A private, expiring session for one payment obligation. Amount is set by the operator from the accepted quotation. Metadata connects payment to the quotation and acceptance record; signed webhooks confirm payment. No customer card details enter the site. | Implemented. |

This is an **operator-led Checkout integration**, not a self-service quotation or online acceptance system. Acceptance remains written correspondence. There is deliberately no public endpoint that takes a price from the fee estimator or browser. Customer identity is not authenticated by the possession of a payment invitation: anyone with that private URL can pay for the commission. Payer details do not change the agreed client or scope. Review unexpected payer details manually.

## Customer and practice journey

1. Customer submits an enquiry. It is not a commission or payment instruction. FormSubmit success is checked in its JSON response, not just the HTTP status. Attachment field is `attachment`, maximum 5 MB, allowed extensions PDF/JPG/PNG/WebP. A timeout or rejected result preserves the form and offers email/WhatsApp fallback; neither fallback claims delivery. The service response cannot prove the email reached the inbox.
2. Practice reviews drawings and conditions and issues a written, versioned quotation. State scope, exclusions, deliverables, gross GBP total, tax treatment, payment stage, programme, cancellation/refund arrangements and any early-start agreement required for that customer.
3. Practice verifies written acceptance of that exact quotation, scope, revision, fee and terms. Retain the quotation and acceptance evidence privately. An operator explicitly attests that acceptance was checked. Evidence hashes are identifiers; they do not validate the meaning of correspondence or replace professional review.
4. The private operator script creates one Stripe Checkout invitation. It writes the exact request and idempotency key to a private ledger **before** the API call. A filesystem lock prevents simultaneous creation using that ledger. All operators must use the same secure, durable ledger on one administration system; separate uncoordinated copies can create duplicates and are not supported.
5. Send that invitation to the agreed client after reviewing it. The script does not send email. It does not charge anyone merely by running.
6. Customer pays on Stripe. The quoted total is fixed in pence and GBP. Discounts, recovery links, quantity changes and currency conversion are not enabled. Tax is not added at checkout: the quotation and line item state the agreed tax treatment, and the operator supplies the gross total. No Stripe Tax registration or VAT number is assumed.
7. Signature-verified webhook checks current Stripe session, environment, amount, currency and commission metadata. Only `paid` and `complete` mark the session `payment_verified=true`. Duplicate delivery writes the same marker, with no email or design-release side effects. The Stripe Checkout Session is the durable payment ledger; nothing relies on serverless local disk. Stripe API failures return 503 so delivery can retry. Irrelevant sessions on a shared account are ignored.
8. The return page reads server-side status and requires that webhook marker before saying confirmed. Paid-but-unrecorded says confirming; completed-but-unpaid says processing. No client query parameter can mark a payment paid. Cancellation/return is not cancellation of the commission, and uncertain status warns against another payment. Reference is removed from the address bar, responses are not cached, no customer name/email/card data is returned, and the page has no analytics.
9. Practice reconciles Stripe against its private commission register, confirms the programme and issues project-specific engineering documents separately. Payment is never construction approval, a TW permit, Building Control acceptance or automatic design release.

## Deployment: keep NeedACalc separate

The repository root is The Crude Oracle's Next.js application. Its existing Vercel/Netlify configuration is unchanged. A successful **Crude Oracle** preview does not verify this service.

**Vercel NeedACalc project:** root directory `structuralengineeringsite`, framework Other/null, Node 22 or 24, install `npm ci`, build `npm run build`, output directory `dist`. The included `vercel.json` configures this static build; `api/*.mjs` are Node Web Request/Response functions outside the static output. Disable deployment analytics for the payment page and apply an appropriate per-IP rate limit to `/api/payment-status` in the project firewall. Do not attach live secrets to Preview or Development.

**Alternative dedicated Netlify NeedACalc project:** base directory `structuralengineeringsite`; use its nested `netlify.toml`, build `npm run build`, publish `dist`, functions `netlify/functions`. Do not inherit the root Next.js plugin/configuration. Function secrets need Functions scope and a redeploy. `payment-status` includes a per-IP limit. Explicit routes use `/api/stripe-webhook` and `/api/payment-status` on either host.

The static build uses a small allowlist: HTML, assets, favicon, robots and sitemap only. It excludes server code, admin scripts, dependencies, tests, documentation and private files. Header policy limits scripts to this origin and enquiry connections to FormSubmit. Both handlers also set their own no-store/security headers. Host access controls must allow Stripe to reach the webhook while retaining preview protection elsewhere.

### Server-only environment variables

| Name | Test setup | Production setup |
| --- | --- | --- |
| `NEEDACALC_PAYMENTS_ENABLED` | `true` after configuration | Set `true` only after release checks; absent means unavailable |
| `STRIPE_MODE` | `test` | `live` |
| `STRIPE_API_KEY` | Separate sandbox **restricted** API key | Production restricted API key, kept in hosting secrets/sensitive environment variables |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for this sandbox endpoint | Different signing secret for this exact live endpoint |
| `NEEDACALC_SITE_URL` | Approved HTTPS test origin, no path/query | Confirmed canonical HTTPS NeedACalc origin |
| `NEEDACALC_ALLOW_LIVE` | Unset | Explicit `true`; live functions also require hosting context Production |

No `NEXT_PUBLIC_` or `VITE_` secret variables. Do not paste keys into chat, code, quotations or public environment files. Use separate operator/runtime restricted keys with least privilege. Runtime needs Checkout Sessions read/write (write updates the payment marker). Operator needs Checkout Sessions creation/read and any Products/Prices permissions required for inline `price_data`; verify the actual RAK permissions in sandbox before live use. No refund or payout permissions are needed by this code. Keep Dashboard passkeys/2FA enabled and restrict access to payment logs and the private commission register.

`stripe@23.0.0` is pinned with a lockfile; its default API version is `2026-09-30.endive`. Configure the webhook for full snapshot events compatible with this version:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

Register `https://YOUR-CONFIRMED-DOMAIN/api/stripe-webhook`. Verify a valid event succeeds, an altered signature fails, and a failed Stripe write is retried. Monitor failures in Stripe Workbench; a 400 commission mismatch requires investigation. Configure refund/dispute monitoring in the Stripe Dashboard: this marker records the original successful payment, not current refundable balance, settlement, a refund ledger or a guarantee against chargeback. Reconcile refunds/disputes manually before delivery or balance collection.

## Create an invitation (authorised practice operator only)

Run from `structuralengineeringsite` using Node 22+ and dependencies installed with `npm ci`. Configure the operator's server-side environment securely. Its key must match `STRIPE_MODE`, and `NEEDACALC_SITE_URL` must be the intended site origin. There is no browser admin interface.

Create a JSON input **outside this entire Git repository and every public web directory**, alongside privately retained evidence. Example field structure (fictional, replace all values):

```json
{
  "reference": "NAC-2026-01234",
  "revision": "P01",
  "stage": "deposit",
  "amountPence": 15000,
  "currency": "gbp",
  "scopeSummary": "Deposit for the elements and deliverables stated in the accepted quotation",
  "taxStatement": "Gross total and tax treatment as expressly stated in quotation P01",
  "email": "client@example.com",
  "acceptedAt": "2026-10-15T10:00:00Z",
  "validUntil": "2026-10-16T10:00:00Z",
  "quoteFile": "accepted-quotation.pdf",
  "acceptanceFile": "written-acceptance.eml",
  "acceptanceConfirmed": true
}
```

Stage must be `fixed_fee`, `deposit` or `balance`. Use the same reference and stage for the same payment obligation. Do not change stage to work around a paid/expired invitation, or issue a fixed-fee request in addition to deposit/balance for the same money. Keep the record and evidence for every variation. Quotation/revision/amount changes are not silently substituted into an existing invitation.

```sh
npm run payment:invite -- /secure/practice/commission.json
```

Test is the default. Live additionally requires `STRIPE_MODE=live`, `NEEDACALC_ALLOW_LIVE=true` and an explicit operator flag:

```sh
npm run payment:invite -- /secure/practice/commission.json --live
```

The script rejects evidence/input within the repository, computes evidence hashes, locks the private record, saves the exact request, creates Checkout and retains the session ID. It outputs a **private** invitation URL for the operator to review and send. No production values should be added to this document.

Invitations last at most 23 hours. Re-running the same commission reuses an open session, and never creates another automatically for a completed, processing or expired session. If the API call timed out, retry using the same record within 23 hours: exact parameters and idempotency key are retained. After that, stop and reconcile in Stripe. For an expired invitation, confirm `expired` and unpaid in Stripe, archive the full old record in the private commission register, and have the responsible operator authorise any replacement. Never delete a record merely to overcome a warning. After an interrupted process, verify it is no longer running before removing a stale `.lock`. Back up the private register securely; losing it requires reconciliation, not starting over.

## Receipts and account details to confirm

The Checkout PaymentIntent explicitly sets the agreed receipt email and a description containing quotation, revision and stage. Confirm receipt rendering with a sandbox transaction. Enable successful-payment and refund emails in Stripe Customer emails, check legal business name, trading name, support address/email, privacy URL, statement descriptor and branding. Test receipts require manual sending from the Dashboard; receipt email delivery has not been verified here. Standard payment receipts are used. Post-payment invoice creation is not enabled: VAT/tax invoices remain the practice's responsibility until tax status and correct invoice details are confirmed.

The connected account shown during this review was **Temporary Works Consulting Ltd**, live mode. The website says **Temporary Works Consulting & Design Ltd**. This name difference is not proof of a mismatch, but the legal entity, account ownership, trading name and charges/payouts capability must be confirmed before release. Only live mode was exposed. A Stripe connection-settings link was provided to add sandbox access. No test key, webhook signing secret or test account was available to the implementation, and no Stripe test payment was made.

Netlify account inspection returned `UNAUTHORIZED`/reauthentication required. GitHub recorded successful historical previews for Vercel NeedACalc, Vercel Crude Oracle and Netlify Crude Oracle. None confirms the current production domain, payment endpoints, server secrets or inbox activation.

## Verification and release gate

A staged-addition credential check is supplied: from the repository root, optionally enable it with `git config core.hooksPath structuralengineeringsite/.githooks`. Run `npm run check:secrets` from the NeedACalc directory before pushing. It reports possible key patterns without printing their values; it is an additional check, not a secret vault.

Local verification commands:

```sh
npm ci
npm test
npm run build
# From repository root:
npm run test:run
```

Tests exercise enquiry service rejection with HTTP 200, acceptance/missing fields, fee guide and demonstration status, quote/acceptance evidence checks, gross amount, retry request stability, completed/pending handling, signature checks, environment separation, amount mismatch, durable recording failure and return-page messages. Stripe responses in local tests are fixtures; signature generation/verification uses the real SDK. These are not sandbox end-to-end tests. The enquiry regression tests fail against the original PR handler and pass against the correction.

At the review point, the repository's existing suite passed **175 tests**, **1 skipped**. The separate NeedACalc suite passed **20 tests** and its static build completed successfully. Chromium visual testing was attempted, but the browser download failed with truncated/invalid ZIP responses; no rendered desktop/mobile or hosted Checkout browser pass is claimed.

Before production release, complete and record:

1. Connect a separate Stripe sandbox and configure test keys/secrets securely on the chosen NeedACalc host. Confirm host/project root and Node version, canonical test origin, function packaging, no static source/secret leakage, correct HTTPS headers and no payment-page analytics. Do not enable live mode on a preview.
2. Activate/confirm the FormSubmit inbox if needed. From the deployed domain, send an authorised labelled test enquiry with a small attachment; verify inbox delivery, attachment and reply routing, plus failure fallback. AJAX does not supply a customer autoresponse. Local tests did not send real mail.
3. Use fictional test quotation/acceptance evidence and verify private-register locking/reuse. Test successful card, decline, 3DS authentication, cancel/back, refresh, expired session, duplicate submission, paid without visiting return page, webhook retry and out-of-order delivery. If delayed methods are enabled, test pending, eventual success and failure; do not create a replacement charge while pending.
4. Confirm the correct gross amount, GBP, scope summary, quote revision, stage, metadata and receipt reference in Stripe. Test webhook with the real raw body/signing secret and access controls. Confirm a fake success query/unsigned request cannot record payment. Verify return page on desktop/mobile and receipt manually in sandbox.
5. Confirm the legal entity, account capabilities, tax/VAT position, receipt branding, support details, commission terms and canonical production domain. Professionally review the revised example/fee messaging and any other public credential/insurance/comparison claims; these pre-existing marketing claims were not independently verified by this payment work.
6. Configure production-only restricted keys and webhook secret, register live endpoint, redeploy, verify live mode is blocked on preview and enabled only in Production. Authorise release after the above evidence is complete. Use a controlled authorised live verification after release; do not treat a green preview or local tests as proof that real payments work.

## Primary references

- https://docs.stripe.com/payments/checkout
- https://docs.stripe.com/payment-links
- https://docs.stripe.com/api/checkout/sessions/create
- https://docs.stripe.com/checkout/fulfillment
- https://docs.stripe.com/webhooks
- https://docs.stripe.com/receipts
- https://docs.stripe.com/keys-best-practices
- https://vercel.com/docs/functions/runtimes/node-js
- https://docs.netlify.com/build/functions/overview/
- https://formsubmit.co/documentation
