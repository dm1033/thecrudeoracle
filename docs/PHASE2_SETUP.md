# Phase 2 Setup — Real Logins + Automatic Premium Access

The code for real authentication is already deployed. It stays dormant (the
demo login keeps working) until you add the environment variables below. Once
they're set, the site switches automatically to:

- **Magic-link login** — members enter their email, click the link they
  receive, no passwords.
- **Automatic premium activation** — when someone pays via the Stripe Payment
  Link, the Stripe webhook marks their email as premium. They log in with the
  same email and the premium pages unlock. Cancellations downgrade
  automatically.
- **Stripe customer portal** — the Account page gets a working "Manage
  billing" button.

Total setup time: ~15 minutes. Do the steps in order.

---

## Step 1 — Create the Supabase project (5 min)

1. Go to [supabase.com](https://supabase.com) → sign up (free tier is fine) →
   **New project**. Name: `thecrudeoracle`. Region: London (`eu-west-2`).
2. When it finishes provisioning, open **SQL Editor** and run this exactly:

```sql
-- Member profiles keyed by email (Stripe pays before an account exists,
-- so email — not auth user id — is the join key).
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  tier text not null default 'free' check (tier in ('free', 'premium')),
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Members can read only their own profile row.
create policy "read own profile"
  on public.profiles for select
  using (lower(auth.jwt() ->> 'email') = email);

-- Create a profile row automatically when someone signs in for the first time.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (email)
  values (lower(new.email))
  on conflict (email) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

3. **Auth settings**: Authentication → URL Configuration →
   - Site URL: `https://www.thecrudeoracle.com`
   - Redirect URLs: add `https://www.thecrudeoracle.com/auth/callback`

4. Collect your keys from **Project Settings → API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (secret — server only)

## Step 2 — Stripe keys + webhook (5 min)

In the Stripe dashboard **for the account that owns the Payment Link**:

1. **Developers → API keys** → copy the **Secret key** → `STRIPE_SECRET_KEY`.
2. **Developers → Webhooks → Add endpoint**:
   - Endpoint URL: `https://www.thecrudeoracle.com/api/stripe-webhook`
   - Events: `checkout.session.completed`,
     `customer.subscription.updated`, `customer.subscription.deleted`
3. After creating it, reveal the **Signing secret** (`whsec_…`) →
   `STRIPE_WEBHOOK_SECRET`.
4. **Settings → Billing → Customer portal** → click **Activate** (enables the
   "Manage billing" button).

## Step 3 — Add the env vars in Vercel (3 min)

Vercel → `thecrudeoracle` project → **Settings → Environment Variables** →
add each of these for **Production** (and Preview if you like):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | from Step 1.4 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from Step 1.4 |
| `SUPABASE_SERVICE_ROLE_KEY` | from Step 1.4 (secret) |
| `STRIPE_SECRET_KEY` | from Step 2.1 (secret) |
| `STRIPE_WEBHOOK_SECRET` | from Step 2.3 (secret) |

Then **Deployments → ⋯ on the latest → Redeploy** (env vars need a fresh
build because the `NEXT_PUBLIC_*` ones are baked in at build time).

## Step 4 — Test the flow (2 min)

1. Open `/login` — it should now show "Email me a sign-in link" instead of the
   demo form.
2. Sign in with your own email → check inbox → click the link → you should
   land on `/account` as tier FREE.
3. In Supabase → Table Editor → `profiles`, set your row's `tier` to
   `premium` → refresh `/premium-dashboard` — it unlocks.
4. Real-money test (optional): pay the £299.99 link with your card using the
   same email, confirm the webhook flips the tier automatically
   (Stripe → Webhooks → endpoint → recent deliveries should show 200),
   then refund yourself from the Stripe dashboard.

## How it works (reference)

| Piece | File |
|---|---|
| Browser Supabase client | `src/lib/supabase.ts` |
| Server/admin clients | `src/lib/supabase-server.ts` |
| Verified tier endpoint | `src/app/api/me/route.ts` |
| Magic-link landing | `src/app/auth/callback/route.ts` |
| Stripe → tier sync | `src/app/api/stripe-webhook/route.ts` |
| Customer portal | `src/app/api/billing-portal/route.ts` |
| Client access hook (dual mode) | `src/lib/access.ts` |

Notes and current limitations:

- Without the env vars, everything falls back to the demo login
  (`ORACLE-PREMIUM` code) — nothing breaks.
- Premium page **content** is still rendered into the static HTML and hidden
  client-side; the tier check itself is server-verified. Sample data makes
  this acceptable today. When you start publishing genuinely paid content,
  ask for the server-side gating pass (middleware + server-rendered premium
  routes) so locked content never leaves the server.
- Emails come from Supabase's built-in sender (fine to start). For branded
  emails, configure custom SMTP in Supabase → Authentication → Emails.
