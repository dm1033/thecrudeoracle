import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMeta(
  "Privacy Policy",
  "How The Crude Oracle collects, uses and protects personal data, including subscription and payment data processed by Stripe.",
  "/privacy-policy"
);

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy Policy" />
      <div className="container-site py-10">
        <div className="prose-dark max-w-3xl">
          <h2>1. Who we are</h2>
          <p>
            {SITE.name} ({SITE.domain}) publishes oil and gas market intelligence. This policy
            explains how we handle personal data when you visit the Site, contact us or subscribe.
            Contact for privacy matters: {SITE.contactEmail}.
          </p>

          <h2>2. Data we collect</h2>
          <ul>
            <li>
              <strong>Account data:</strong> email address and membership tier when you register or
              subscribe.
            </li>
            <li>
              <strong>Payment data:</strong> processed entirely by Stripe, our payment processor.
              We never see or store full card details. Stripe shares with us your subscription
              status, plan and billing email.
            </li>
            <li>
              <strong>Contact data:</strong> information you send via the contact form or email.
            </li>
            <li>
              <strong>Technical data:</strong> standard server logs (IP address, user agent,
              pages requested) used for security and performance.
            </li>
          </ul>

          <h2>3. How we use it</h2>
          <ul>
            <li>to provide and manage your membership and deliver member content;</li>
            <li>to process payments and manage billing via Stripe;</li>
            <li>to respond to enquiries;</li>
            <li>to secure, maintain and improve the Site;</li>
            <li>to meet legal and accounting obligations.</li>
          </ul>
          <p>
            Legal bases under UK GDPR: performance of a contract (membership), legitimate
            interests (security, service improvement) and legal obligation (tax/accounting
            records).
          </p>

          <h2>4. Sharing</h2>
          <p>
            We share data only with service providers needed to run the Site — payment processing
            (Stripe), hosting/deployment (e.g. Vercel or Netlify) and email — each acting under
            their own compliance frameworks. We do not sell personal data.
          </p>

          <h2>5. Retention</h2>
          <p>
            Account data is kept while your membership is active and for a reasonable period
            after, then deleted or anonymised. Billing records are retained as required by law.
          </p>

          <h2>6. Your rights</h2>
          <p>
            Under UK GDPR you may request access, correction, deletion, restriction, portability
            or object to processing. Contact {SITE.contactEmail}. You may also complain to the ICO
            (ico.org.uk).
          </p>

          <h2>7. Cookies and local storage</h2>
          <p>
            The Site uses minimal browser storage: a local access-tier value to remember your
            login state on this device. No third-party advertising or tracking cookies are set by
            the Site itself. Payment pages hosted by Stripe apply Stripe&apos;s own cookie policy.
          </p>

          <h2>8. International transfers</h2>
          <p>
            Service providers may process data outside the UK; where they do, transfers rely on
            adequacy decisions or standard contractual clauses.
          </p>

          <h2>9. Changes</h2>
          <p>We will post any changes to this policy on this page with an updated date.</p>

          <p className="text-sm text-steel-500">Last updated: 3 July 2026</p>
        </div>
      </div>
    </>
  );
}
