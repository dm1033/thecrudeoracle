"use client";

import Link from "next/link";
import { useAccess, signOutEverywhere } from "@/lib/access";

export default function AccountPanel() {
  const { level, email, mode, ready } = useAccess();

  if (!ready) {
    return <div className="card mx-auto max-w-lg animate-pulse py-16 text-center text-sm text-steel-500">Loading…</div>;
  }

  if (level === "public") {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <h2 className="text-lg font-semibold text-white">You are not signed in</h2>
        <p className="mt-2 text-sm text-steel-400">
          The Crude Oracle is now 100% free — a login is optional and no longer unlocks anything extra.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/login" className="btn-secondary">
            Log in
          </Link>
          <Link href="/subscribe" className="btn-primary">
            See What&apos;s Free (Everything)
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="card p-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-steel-500">Membership</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-steel-500">Email</dt>
            <dd className="break-all text-white">{email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-steel-500">Tier</dt>
            <dd>
              <span
                className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${
                  level === "premium" ? "bg-gold-500/15 text-gold-400" : "bg-steel-500/15 text-steel-300"
                }`}
              >
                {level}
              </span>
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-steel-500">Plan</dt>
            <dd className="text-white">
              "Free — full access (site-wide, no paid tier)"
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-steel-500">Sign-in method</dt>
            <dd className="text-steel-300">
              {mode === "supabase" ? "Secure magic link (server-verified)" : "Demo placeholder"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="card p-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-steel-500">Billing</h2>
        <p className="mt-3 text-sm text-steel-400">
          The paid subscription has been retired — The Crude Oracle is 100% free, so there is no
          billing to manage.
        </p>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={() => signOutEverywhere()}
          className="text-sm text-steel-500 underline hover:text-loss"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
