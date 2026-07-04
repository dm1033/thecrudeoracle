"use client";

// ---------------------------------------------------------------------------
// ACCESS CONTROL — dual mode
// ---------------------------------------------------------------------------
// "supabase" mode (production): when Supabase env vars are configured, the
//   tier is server-verified via /api/me (session cookie + profiles table),
//   and premium is granted automatically by the Stripe webhook
//   (/api/stripe-webhook). See docs/PHASE2_SETUP.md.
// "placeholder" mode (demo): without configuration, tiers live in
//   localStorage so the three content levels can still be exercised.
//   Client-side gating is NOT a security boundary.
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase";

export type AccessLevel = "public" | "free" | "premium";
export type AccessMode = "placeholder" | "supabase";

const STORAGE_KEY = "tco_access_level";
const EMAIL_KEY = "tco_account_email";

// Demo unlock code for previewing the premium tier in placeholder mode.
export const DEMO_PREMIUM_CODE = "ORACLE-PREMIUM";

function getLocalLevel(): AccessLevel {
  if (typeof window === "undefined") return "public";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "premium" || v === "free" ? v : "public";
}

function getLocalEmail(): string | null {
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

/** Signs out of whichever mode is active (Supabase session and/or demo storage). */
export async function signOutEverywhere() {
  const supabase = getBrowserSupabase();
  if (supabase) {
    await supabase.auth.signOut();
  }
  setAccess("public");
}

export interface AccessState {
  level: AccessLevel;
  email: string | null;
  mode: AccessMode;
  ready: boolean;
}

export function useAccess(): AccessState {
  const [state, setState] = useState<AccessState>({
    level: "public",
    email: null,
    mode: "placeholder",
    ready: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (data.mode === "supabase") {
          setState({
            level: data.level === "premium" ? "premium" : data.level === "free" ? "free" : "public",
            email: data.email ?? null,
            mode: "supabase",
            ready: true,
          });
          return;
        }
      } catch {
        // API unreachable — fall through to placeholder mode.
      }
      if (!cancelled) {
        setState({ level: getLocalLevel(), email: getLocalEmail(), mode: "placeholder", ready: true });
      }
    }

    sync();
    const onChange = () => sync();
    window.addEventListener("tco-access-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      cancelled = true;
      window.removeEventListener("tco-access-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return state;
}
