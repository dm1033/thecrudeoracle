"use client";

import Link from "next/link";
import { useAccess, signOutEverywhere } from "@/lib/access";
import { SITE } from "@/lib/site";

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
          Log in to view your membership, or subscribe to join The Crude Oracle Premium.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/login" className="btn-secondary">
            Log in
          </Link>
          <Link href="/subscribe" className="btn-primary">
            Subscribe — {SITE.price}
            {SITE.priceSuffix}
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
              {level === "premium" ? `The Crude Oracle Premium — ${SITE.price}${SITE.priceSuffix}` : "Free registered"}
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

      {level === "free" && (
        <div className="card border-gold-600/40 p-6 text-center">
          <h3 className="text-sm font-semibold text-white">Upgrade to Premium</h3>
          <p className="mt-2 text-sm text-steel-400">
            Unlock the full dashboard, daily briefings, watchlists, company intelligence and the
            research archive. {mode === "supabase" && "Use this same email at checkout and premium access activates automatically."}
          </p>
          <Link href="/subscribe" className="btn-primary mt-4 w-full">
            Subscribe — {SITE.price}
            {SITE.priceSuffix}
          </Link>
        </div>
      )}

      <div className="card p-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-steel-500">Billing</h2>
        {mode === "supabase" ? (
          <>
            <p className="mt-3 text-sm text-steel-400">
              Manage your payment method, invoices and cancellation in the secure Stripe customer
              portal.
            </p>
            <a href="/api/billing-portal" className="btn-secondary mt-4 w-full">
              Manage billing (Stripe portal)
            </a>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm text-steel-400">
              Billing is managed by Stripe. The customer portal button activates once Supabase and
              Stripe environment variables are configured (docs/PHASE2_SETUP.md).
            </p>
            <button type="button" disabled className="btn-secondary mt-4 w-full cursor-not-allowed opacity-50">
              Manage billing (activates with live auth)
            </button>
          </>
        )}
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
