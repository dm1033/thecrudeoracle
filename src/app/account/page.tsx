import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import AccountPanel from "./AccountPanel";

export const metadata: Metadata = pageMeta(
  "Account — Free Membership Status",
  "Your Crude Oracle account status. The site is 100% free — there is no billing or subscription to manage.",
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
