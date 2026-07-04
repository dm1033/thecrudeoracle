import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import AccountPanel from "./AccountPanel";

export const metadata: Metadata = pageMeta(
  "Account — Manage Your Membership",
  "Manage your Crude Oracle membership: subscription status, billing and access level.",
  "/account"
);

export default function AccountPage() {
  return (
    <>
      <PageHeader
        eyebrow="Membership"
        title="Account"
        intro="Your membership status and billing. Billing itself is managed securely by Stripe — card details never touch this site."
      />
      <div className="container-site py-10">
        <AccountPanel />
      </div>
    </>
  );
}
