"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setAccess, useAccess, signOutEverywhere, DEMO_PREMIUM_CODE } from "@/lib/access";
import { getBrowserSupabase, supabaseConfigured } from "@/lib/supabase";

const inputClass =
  "mt-1 w-full rounded-md border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-white placeholder-steel-500 focus:border-gold-500 focus:outline-none";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-steel-500";

/** Production login: Supabase magic link, emailed to the member. */
function MagicLinkForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="card p-6 text-center">
        <h2 className="text-lg font-semibold text-white">Check your email</h2>
        <p className="mt-2 text-sm text-steel-400">
          We&apos;ve sent a secure sign-in link to <strong className="text-white">{email}</strong>.
          Click it on this device to access your membership.
        </p>
        <p className="mt-3 text-xs text-steel-500">
          Use the same email you paid with at checkout — premium access is linked to it
          automatically.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-6">
      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="The email you subscribed with"
        />
      </div>
      {error && (
        <p className="rounded border border-loss/40 bg-loss/10 p-3 text-xs text-loss">{error}</p>
      )}
      <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
        {busy ? "Sending…" : "Email me a sign-in link"}
      </button>
      <p className="text-center text-xs text-steel-500">
        No password needed. Premium members: use your checkout email and access activates
        automatically.
      </p>
      <p className="text-center text-xs text-steel-500">
        Not a member yet?{" "}
        <Link href="/subscribe" className="text-gold-400 underline">
          Subscribe — £299.99/month
        </Link>
      </p>
    </form>
  );
}

/** Placeholder login used until Supabase env vars are configured. */
function DemoForm() {
  const router = useRouter();
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
    <>
      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="code" className={labelClass}>
            Premium access code <span className="normal-case text-steel-500">(optional)</span>
          </label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={`${inputClass} font-mono`}
            placeholder="Provided after subscribing"
          />
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
        Demo placeholder login (browser storage only). Real magic-link authentication activates
        automatically once the Supabase environment variables are configured — see
        docs/PHASE2_SETUP.md.
      </p>
    </>
  );
}

export default function LoginForm() {
  const { level, email: currentEmail, mode, ready } = useAccess();

  return (
    <div className="mx-auto max-w-md">
      {ready && level !== "public" && (
        <div className="mb-6 rounded-lg border border-gain/40 bg-gain/10 p-4 text-sm text-steel-300">
          You are signed in as <strong>{currentEmail}</strong> on the{" "}
          <strong className="uppercase">{level}</strong> tier.{" "}
          <Link href="/account" className="text-gold-400 underline">
            Go to account →
          </Link>{" "}
          <button
            type="button"
            onClick={() => signOutEverywhere()}
            className="ml-2 text-steel-500 underline hover:text-loss"
          >
            Sign out
          </button>
        </div>
      )}
      {supabaseConfigured ? <MagicLinkForm /> : <DemoForm />}
      {mode === "supabase" && (
        <p className="mt-4 text-center text-[11px] text-steel-500">
          Secure magic-link authentication · Sessions verified server-side.
        </p>
      )}
    </div>
  );
}
