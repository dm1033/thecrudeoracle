import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMeta(
  "Privacy Policy",
  "How The Crude Oracle collects, uses and protects personal data: newsletter sign-ups, enquiries, sponsorship payments processed by Stripe and anonymous analytics.",
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
            {SITE.name} ({SITE.domain}) publishes oil and gas market information. This policy
            explains how we handle personal data when you visit the Site, contact us, sign up for the
            newsletter or buy a sponsorship. Contact for privacy matters: {SITE.contactEmail}.
          </p>

          <h2>2. Data we collect</h2>
          <ul>
            <li>
              <strong>Newsletter data:</strong> the email address you give when you sign up. The newsletter
              is run on beehiiv, which stores the address and sends the emails.
            </li>
            <li>
              <strong>Sponsorship payment data:</strong> when a business books a sponsorship, the payment is
              processed entirely by Stripe. We never see or store full card details. Stripe shares with us
              the payer&apos;s name, email, billing details, the amount and the slot booked.
            </li>
            <li>
              <strong>Contact data:</strong> information you send via the contact form or email, including
              sponsor names, links and artwork.
            </li>
            <li>
              <strong>Account data:</strong> if you sign in on the Account page, your email address.
            </li>
            <li>
              <strong>Usage data:</strong> anonymous page-view counts from Vercel Web Analytics, which does
              not use cookies, and standard server logs (IP address, user agent, pages requested) used for
              security and performance.
            </li>
          </ul>

          <h2>3. How we use it</h2>
          <ul>
            <li>to send the newsletter you signed up for;</li>
            <li>to take sponsorship payments and run the placements bought;</li>
            <li>to respond to enquiries;</li>
            <li>to secure, maintain and improve the Site;</li>
            <li>to meet legal and accounting obligations.</li>
          </ul>
          <p>
            Legal bases under UK GDPR: consent (newsletter), performance of a contract (sponsorship),
            legitimate interests (security, service improvement) and legal obligation (tax and accounting
            records).
          </p>

          <h2>4. Sharing</h2>
          <p>
            We share data only with service providers needed to run the Site: beehiiv (newsletter), Stripe
            (sponsorship payments), Vercel (hosting and analytics) and our email provider, each acting under
            their own compliance frameworks. We do not sell personal data.
          </p>

          <h2>5. Retention</h2>
          <p>
            Newsletter addresses are kept until you unsubscribe. Enquiries are kept for as long as needed to
            deal with them. Payment and billing records are retained as required by law.
          </p>

          <h2>6. Your rights</h2>
          <p>
            Under UK GDPR you may request access, correction, deletion, restriction, portability
            or object to processing. Contact {SITE.contactEmail}. You may also complain to the ICO
            (ico.org.uk).
          </p>

          <h2>7. Cookies and local storage</h2>
          <p>
            The Site uses minimal browser storage: the Account page remembers your sign-in status on this
            device. No advertising or tracking cookies are set by the Site itself. The beehiiv sign-up page
            and Stripe payment pages are hosted by those companies and apply their own cookie policies.
          </p>

          <h2>8. International transfers</h2>
          <p>
            Service providers may process data outside the UK; where they do, transfers rely on
            adequacy decisions or standard contractual clauses.
          </p>

          <h2>9. Changes</h2>
          <p>We will post any changes to this policy on this page with an updated date.</p>

          <p className="text-sm text-steel-500">Last updated: 18 November 2026</p>
        </div>
      </div>
    </>
  );
}
