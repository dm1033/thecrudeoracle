"use client";

// Browser-side Supabase helper. Null-safe: when the NEXT_PUBLIC_SUPABASE_*
// env vars are not set (or still hold .env.example placeholders), the site
// falls back to the localStorage demo access layer in src/lib/access.ts.

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigured: boolean =
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("your-project") &&
  SUPABASE_ANON_KEY.length > 20 &&
  SUPABASE_ANON_KEY !== "replace_me";

let browserClient: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  if (!browserClient) {
    browserClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return browserClient;
}
