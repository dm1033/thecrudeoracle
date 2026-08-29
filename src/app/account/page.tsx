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
        intro="Your membership status. The Crude Oracle is 100% free, so there is no billing to manage."
      />
      <div className="container-site py-10">
        <AccountPanel />
      </div>
    </>
  );
}
