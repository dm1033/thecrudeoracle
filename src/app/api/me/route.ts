import { NextResponse } from "next/server";
import { getServerSupabase, supabaseServerConfigured } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/**
 * Returns the caller's verified access level.
 * mode "placeholder": Supabase not configured — client falls back to the
 * localStorage demo tiers. mode "supabase": level is server-verified from the
 * session cookie and the profiles table.
 */
export async function GET() {
  if (!supabaseServerConfigured()) {
    return NextResponse.json({ mode: "placeholder" });
  }

  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ mode: "placeholder" });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ mode: "supabase", level: "public", email: null });
  }

  const email = user.email.toLowerCase();
  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("email", email)
    .maybeSingle();

  return NextResponse.json({
    mode: "supabase",
    level: profile?.tier === "premium" ? "premium" : "free",
    email,
  });
}
