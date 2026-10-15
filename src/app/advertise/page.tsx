import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMeta(
  "Advertise",
  "Sponsorship enquiries for The Crude Oracle. Sponsored placements are labelled, and sponsors do not see or influence content before publication.",
  "/advertise"
);

const MAILTO = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent("Sponsorship enquiry")}`;

export default function AdvertisePage() {
  return (
    <>
      <PageHeader
        eyebrow="Sponsorship"
        title="Advertise"
        intro="A short invitation for organisations that want a clearly labelled presence on The Crude Oracle."
      />
      <div className="container-site py-10">
        <div className="prose-dark max-w-3xl">
          <p>
            Sponsorship enquiries are welcome at{" "}
            <a href={MAILTO}>{SITE.contactEmail}</a>. Say who you are, what you want to sponsor,
            and the period you have in mind. There is no rate card on this page.
          </p>

          <h2>What a sponsor does not get</h2>
          <p>
            Sponsors do not see copy, data or charts before publication, and they do not
            influence what the desk writes. That rule is the{" "}
            <Link href="/editorial-policy">editorial policy</Link>.
          </p>

          <h2>What a labelled placement is</h2>
          <p>
            A sponsorship, if accepted, is marked as sponsored on the page where it appears.
            It is not an endorsement, and it is not investment advice. The site does not
            publish audience, traffic or circulation figures here.
          </p>

          <p>
            <a href={MAILTO}>Email a sponsorship enquiry</a>
          </p>
        </div>
      </div>
    </>
  );
}
