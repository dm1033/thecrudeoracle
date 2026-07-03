"use client";

import Link from "next/link";
import { useAccess } from "@/lib/access";
import { SITE } from "@/lib/site";

/**
 * Wraps premium content. Non-premium visitors see a locked panel with a clear
 * upgrade route instead of the children. Placeholder gating only — see
 * src/lib/access.ts for the production upgrade path.
 */
export default function PremiumGate({
  children,
  title = "Premium subscriber content",
  preview,
}: {
  children: React.ReactNode;
  title?: string;
  preview?: React.ReactNode;
}) {
  const { level, ready } = useAccess();

  if (!ready) {
    return <div className="card animate-pulse py-16 text-center text-sm text-steel-500">Checking access…</div>;
  }

  if (level === "premium") {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-gold-600/40 bg-ink-900">
      {preview && (
        <div aria-hidden className="pointer-events-none select-none p-6 opacity-40 blur-[3px]">
          {preview}
        </div>
      )}
      <div className={preview ? "absolute inset-0 flex items-center justify-center bg-ink-950/70" : ""}>
        <div className="mx-auto max-w-lg p-8 text-center">
          <div aria-hidden className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold-600/50 text-gold-500">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm text-steel-400">
            This intelligence is reserved for The Crude Oracle Premium members. Subscribe for the
            full dashboard, daily briefings, watchlists, company intelligence and the research
            archive.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/subscribe" className="btn-primary">
              Subscribe — {SITE.price}
              {SITE.priceSuffix}
            </Link>
            <Link href="/login" className="btn-secondary">
              Member login
            </Link>
          </div>
          {level === "free" && (
            <p className="mt-4 text-xs text-steel-500">
              You are signed in on the free tier. Upgrade to unlock premium intelligence.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
