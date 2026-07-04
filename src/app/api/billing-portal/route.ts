import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/** Opens the Stripe customer portal for the signed-in member. */
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const supabase = getServerSupabase();

  if (!secretKey || secretKey.includes("replace_me") || !supabase) {
    return NextResponse.redirect(new URL("/account?portal=unavailable", origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  if (!profile?.stripe_customer_id) {
    return NextResponse.redirect(new URL("/account?portal=no-customer", origin));
  }

  const stripe = new Stripe(secretKey);
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${origin}/account`,
  });

  return NextResponse.redirect(session.url);
}
