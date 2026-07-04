// Server-side Supabase helpers (route handlers only — never imported by
// client components). Null-safe: return null when env vars are absent so the
// site builds and runs in placeholder mode without any configuration.

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function supabaseServerConfigured(): boolean {
  return (
    SUPABASE_URL.startsWith("https://") &&
    !SUPABASE_URL.includes("your-project") &&
    SUPABASE_ANON_KEY.length > 20 &&
    SUPABASE_ANON_KEY !== "replace_me"
  );
}

/** Session-aware client bound to the request's auth cookies. */
export function getServerSupabase(): SupabaseClient | null {
  if (!supabaseServerConfigured()) return null;
  const cookieStore = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a context where cookies are read-only; safe to ignore
          // because middleware/route handlers refresh sessions where needed.
        }
      },
    },
  });
}

/**
 * Admin client using the service-role key — bypasses RLS. Webhook use only.
 * NEVER expose this key to the browser.
 */
export function getAdminSupabase(): SupabaseClient | null {
  if (!supabaseServerConfigured()) return null;
  if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY === "replace_me_server_only") return null;
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
