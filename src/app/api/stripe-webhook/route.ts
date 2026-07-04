import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// Stripe → membership sync.
// checkout.session.completed        → profile tier = premium (created if new)
// customer.subscription.updated     → premium while active/trialing/past_due
// customer.subscription.deleted     → tier = free
//
// Configure the endpoint in Stripe Dashboard → Developers → Webhooks:
//   https://www.thecrudeoracle.com/api/stripe-webhook
// and set STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET in the hosting env.

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret || secretKey.includes("replace_me")) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const admin = getAdminSupabase();
  if (!admin) {
    return NextResponse.json({ error: "Supabase admin not configured" }, { status: 503 });
  }

  const stripe = new Stripe(secretKey);
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature ?? "", webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = (session.customer_details?.email ?? session.customer_email ?? "")
          .trim()
          .toLowerCase();
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
        if (email) {
          await admin
            .from("profiles")
            .upsert(
              { email, tier: "premium", stripe_customer_id: customerId },
              { onConflict: "email" }
            );
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const premium = ["active", "trialing", "past_due"].includes(sub.status);
        await admin
          .from("profiles")
          .update({ tier: premium ? "premium" : "free" })
          .eq("stripe_customer_id", customerId);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        await admin.from("profiles").update({ tier: "free" }).eq("stripe_customer_id", customerId);
        break;
      }
      default:
        break;
    }
  } catch {
    // Return 500 so Stripe retries the delivery.
    return NextResponse.json({ error: "Handler failure" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
