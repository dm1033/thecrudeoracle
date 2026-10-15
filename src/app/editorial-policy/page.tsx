import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMeta(
  "Editorial Policy",
  "The Crude Oracle editorial policy: sponsors never see or influence content before publication, sponsored content is labelled, conflicts are disclosed, and nothing on the site is investment advice.",
  "/editorial-policy"
);

export default function EditorialPolicyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Editorial Policy"
        intro="How The Crude Oracle keeps editorial decisions separate from commercial relationships."
      />
      <div className="container-site py-10">
        <div className="prose-dark max-w-3xl">
          <h2>1. Editorial independence</h2>
          <p>
            {SITE.name} decides what to publish. Sponsors, advertisers and other commercial
            partners never see content before publication. They do not choose topics, wording,
            data, charts or timing, and they do not review drafts.
          </p>

          <h2>2. Sponsored content is labelled</h2>
          <p>
            Any sponsored article, paid placement or commercial partnership is clearly labelled
            as sponsored before a reader reaches the substance. Pages without that label are
            editorial. A sponsorship is not an endorsement of a company, commodity or security.
          </p>

          <h2>3. Not investment advice</h2>
          <p>
            Nothing on this site is financial advice, investment advice, tax advice or a
            recommendation to buy, sell or hold any security, commodity, derivative, fund or
            financial product. Sponsorship does not change that. The full notice is the{" "}
            <Link href="/financial-disclaimer">financial disclaimer</Link>. Trading and investing
            involve risk, including loss of capital.
          </p>

          <h2>4. Conflicts</h2>
          <p>
            A material conflict — including a commercial relationship with a company, product or
            market the site covers — is disclosed on the relevant page or in an update to this
            policy. Sample tickers and placeholder instruments are not published as if they were
            real marks.
          </p>

          <h2>5. Contact</h2>
          <p>
            Questions about this policy, a correction, or a possible conflict:{" "}
            <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>. Sponsorship
            enquiries go to the same address via the <Link href="/advertise">advertise</Link> page.
          </p>
        </div>
      </div>
    </>
  );
}
