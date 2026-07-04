"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setAccess, useAccess, DEMO_PREMIUM_CODE } from "@/lib/access";

export default function LoginForm() {
  const router = useRouter();
  const { level, email: currentEmail, ready } = useAccess();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setMessage("Please enter a valid email address.");
      return;
    }
    if (code.trim().toUpperCase() === DEMO_PREMIUM_CODE) {
      setAccess("premium", email);
      router.push("/premium-dashboard");
    } else {
      setAccess("free", email);
      setMessage(
        "Signed in on the FREE tier — limited dashboard and sample content unlocked. Enter your premium access code (or subscribe) for full access."
      );
    }
  }

  return (
    <div className="mx-auto max-w-md">
      {ready && level !== "public" && (
        <div className="mb-6 rounded-lg border border-gain/40 bg-gain/10 p-4 text-sm text-steel-300">
          You are signed in as <strong>{currentEmail}</strong> on the{" "}
          <strong className="uppercase">{level}</strong> tier.{" "}
          <Link href="/account" className="text-gold-400 underline">
            Go to account →
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <div>
          <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wide text-steel-500">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-white placeholder-steel-500 focus:border-gold-500 focus:outline-none"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="code" className="block text-xs font-semibold uppercase tracking-wide text-steel-500">
            Premium access code <span className="normal-case text-steel-500">(optional)</span>
          </label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-1 w-full rounded-md border border-ink-600 bg-ink-900 px-3 py-2 font-mono text-sm text-white placeholder-steel-500 focus:border-gold-500 focus:outline-none"
            placeholder="Provided after subscribing"
          />
          <p className="mt-1 text-[11px] text-steel-500">
            Demo preview code: <code className="font-mono text-gold-400">{DEMO_PREMIUM_CODE}</code>{" "}
            (placeholder until Stripe + auth are live).
          </p>
        </div>

        {message && (
          <p className="rounded border border-risk/40 bg-risk/10 p-3 text-xs text-risk">{message}</p>
        )}

        <button type="submit" className="btn-primary w-full">
          Log in
        </button>

        <p className="text-center text-xs text-steel-500">
          Not a member yet?{" "}
          <Link href="/subscribe" className="text-gold-400 underline">
            Subscribe — £299.99/month
          </Link>
        </p>
      </form>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-steel-500">
        This login is a demonstration placeholder using browser storage only. Production
        authentication (Supabase/Firebase) with Stripe-verified subscriptions is documented in
        README_DEPLOYMENT.md.
      </p>
    </div>
  );
}
