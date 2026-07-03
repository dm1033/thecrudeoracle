import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import LoginForm from "./LoginForm";

export const metadata: Metadata = pageMeta(
  "Login — Member Access",
  "Log in to The Crude Oracle to access your dashboard, daily briefings and research.",
  "/login"
);

export default function LoginPage() {
  return (
    <>
      <PageHeader
        eyebrow="Member Access"
        title="Login"
        intro="Access your membership. Authentication here is a working placeholder — see the deployment guide for wiring Supabase or Firebase auth with Stripe-verified entitlements."
      />
      <div className="container-site py-10">
        <LoginForm />
      </div>
    </>
  );
}
