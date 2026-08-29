# Phase 2 Setup — Real Logins

> **Update:** The paid subscription has been retired — The Crude Oracle is
> now 100% free. The Stripe payment integration this guide originally
> described (Payment Link, webhook, customer portal, automatic premium
> activation) has been removed from the codebase (`/api/stripe-webhook`,
> `/api/billing-portal`, the `stripe` package). The steps below are kept only
> for the still-relevant Supabase magic-link login setup; Step 2 (Stripe) and
> the Stripe-specific parts of Steps 3/4 no longer apply.

The code for real authentication is already deployed. It stays dormant (the
demo login keeps working) until you add the environment variables below. Once
they're set, the site switches automatically to:

- **Magic-link login** — members enter their email, click the link they
  receive, no passwords.

Total setup time: ~10 minutes. Do the steps in order.

---

## Step 1 — Create the Supabase project (5 min)

1. Go to [supabase.com](https://supabase.com) → sign up (free tier is fine) →
   **New project**. Name: `thecrudeoracle`. Region: London (`eu-west-2`).
2. When it finishes provisioning, open **SQL Editor** and run this exactly:

```sql
-- Member profiles keyed by email. `tier` and `stripe_customer_id` are
-- legacy columns from the retired paid subscription — nothing writes
-- `stripe_customer_id` any more and nothing grants 'premium' automatically,
-- but the columns are left in place so existing rows aren't dropped.
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

## Step 2 — Add the env vars in Vercel (3 min)

Vercel → `thecrudeoracle` project → **Settings → Environment Variables** →
add each of these for **Production** (and Preview if you like):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | from Step 1.4 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from Step 1.4 |
| `SUPABASE_SERVICE_ROLE_KEY` | from Step 1.4 (secret) |

Then **Deployments → ⋯ on the latest → Redeploy** (env vars need a fresh
build because the `NEXT_PUBLIC_*` ones are baked in at build time).

## Step 3 — Test the flow (2 min)

1. Open `/login` — it should now show "Email me a sign-in link" instead of the
   demo form.
2. Sign in with your own email → check inbox → click the link → you should
   land on `/account` as tier FREE (everyone gets full access regardless of
   tier — the tier field is legacy and no longer gates anything).

## How it works (reference)

| Piece | File |
|---|---|
| Browser Supabase client | `src/lib/supabase.ts` |
| Server/admin clients | `src/lib/supabase-server.ts` |
| Verified identity endpoint | `src/app/api/me/route.ts` |
| Magic-link landing | `src/app/auth/callback/route.ts` |
| Client access hook (dual mode) | `src/lib/access.ts` |

Notes and current limitations:

- Without the env vars, everything falls back to the demo login
  (`ORACLE-PREMIUM` code) — nothing breaks.
- Every page is free for everyone; `PremiumGate` no longer gates content, so
  there is no server-side gating concern to solve here.
- Emails come from Supabase's built-in sender (fine to start). For branded
  emails, configure custom SMTP in Supabase → Authentication → Emails.
