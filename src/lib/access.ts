"use client";

// ---------------------------------------------------------------------------
// ACCESS CONTROL PLACEHOLDER
// ---------------------------------------------------------------------------
// This is a demonstration-only access layer using localStorage so the three
// content tiers (public / free / premium) can be exercised end-to-end before
// real authentication is wired in.
//
// PRODUCTION UPGRADE PATH (see docs/ROADMAP.md):
//   1. Add Supabase Auth (or Firebase Auth) for identity.
//   2. On Stripe webhook `checkout.session.completed` /
//      `customer.subscription.updated`, set the user's tier in the database.
//   3. Replace useAccess() with a server-verified session lookup and protect
//      premium routes in middleware.
// Client-side gating is NOT a security boundary — do not ship real premium
// content behind this placeholder alone.
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";

export type AccessLevel = "public" | "free" | "premium";

const STORAGE_KEY = "tco_access_level";
const EMAIL_KEY = "tco_account_email";

// Demo unlock code for previewing the premium tier before Stripe is live.
export const DEMO_PREMIUM_CODE = "ORACLE-PREMIUM";

export function getAccessLevel(): AccessLevel {
  if (typeof window === "undefined") return "public";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "premium" || v === "free" ? v : "public";
}

export function getAccountEmail(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(EMAIL_KEY);
}

export function setAccess(level: AccessLevel, email?: string) {
  if (typeof window === "undefined") return;
  if (level === "public") {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(EMAIL_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, level);
    if (email) window.localStorage.setItem(EMAIL_KEY, email);
  }
  window.dispatchEvent(new Event("tco-access-changed"));
}

export function useAccess(): { level: AccessLevel; email: string | null; ready: boolean } {
  const [level, setLevel] = useState<AccessLevel>("public");
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setLevel(getAccessLevel());
      setEmail(getAccountEmail());
      setReady(true);
    };
    sync();
    window.addEventListener("tco-access-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("tco-access-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { level, email, ready };
}
