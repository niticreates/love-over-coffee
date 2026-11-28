# Public client demo

A shareable demo of the full site (menu, cart, checkout, reservations, admin) that is
completely separate from the real café. It runs the normal production code with one extra
switch, `DEMO_MODE=true`.

## What DEMO_MODE does

- Shows a permanent "Demo site" banner on every public page and in the dashboard.
- Labels every price "Sample" and keeps all pages out of search engines (robots.txt and `X-Robots-Tag`).
- Asks visitors above each form to use made-up details.
- Simulates payments. Razorpay is never contacted.
- Sends no email or WhatsApp. Attempts are logged as "skipped".
- Deletes all orders, payments, reservations, contact messages, notification logs and customers
  every day at 03:00 IST (`/api/cron/demo-purge`, protected by `CRON_SECRET`).

It **refuses to run** (every page errors, naming the setting but never its value) if the
deployment has any of: the production Supabase project, Razorpay keys, `RESEND_API_KEY`,
WhatsApp keys, no Supabase at all, `DEMO_ADMIN_PASSWORD`, `ALLOW_MEMORY_STORE` or
`ALLOW_SIMULATED_PAYMENTS`. Normal deployments (no `DEMO_MODE`) behave exactly as before.

## One-time setup

### 1. Demo Supabase project (separate from the real one)
1. In Supabase, **New project**, name it `love-over-coffee-demo`, region Mumbai.
2. In its **SQL Editor**, run these files in order, one at a time:
   1. `supabase/migrations/20261127000000_init.sql`
   2. `supabase/migrations/20261127100000_external_platforms.sql`
   3. `supabase/migrations/20261128000000_production_hardening.sql`
   4. `supabase/migrations/20261128100000_privilege_cleanup.sql`
   5. `supabase/seed.sql`
   6. `supabase/demo/demo-seed.sql` (sample prices, 5% sample tax, sample hours and capacity; it refuses to run on the real database)
3. **Authentication → Users → Add user**: create one staff login for the client (an address you control, a strong password). Copy its user id.
4. In the SQL Editor:
   `insert into admin_profiles (user_id, display_name, role) values ('<that user id>', 'Demo manager', 'manager');`
   Use `manager` rather than `owner` so the demo login can't change roles.
5. **Authentication → URL Configuration**: Site URL = the demo Vercel URL (after step 2 below), and add `<demo URL>/auth/reset-password` to Redirect URLs.

### 2. Demo Vercel project
1. Vercel → **Add New → Project** → import `niticreates/love-over-coffee`. Name it `love-over-coffee-demo`.
2. Framework preset Next.js (auto-detected). Leave the build command as is.
3. **Environment Variables** (Production environment of this demo project only):

   | Name | Value |
   |---|---|
   | `DEMO_MODE` | `true` |
   | `NEXT_PUBLIC_SITE_URL` | the demo URL, e.g. `https://love-over-coffee-demo.vercel.app` |
   | `NEXT_PUBLIC_SUPABASE_URL` | demo project URL (Settings → API) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | demo project anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | demo project service-role key (type it into Vercel only) |
   | `ADMIN_SESSION_SECRET` | new random value: `openssl rand -base64 48` |
   | `CRON_SECRET` | new random value: `openssl rand -base64 48` |

   Do **not** add Razorpay, Resend, WhatsApp, `DEMO_ADMIN_PASSWORD`, `ALLOW_*` or `DEMO_SAMPLE_DATA`.
   Never reuse the real project's keys or secrets.
4. **Settings → Git → Production Branch**: the branch you want the demo to show
   (until PR #1 is merged that is `feature/supabase-production-setup`).
5. **Deploy**. The URL appears on the project's overview under **Domains**
   (`love-over-coffee-demo.vercel.app` or similar). Set `NEXT_PUBLIC_SITE_URL` to it if it differs and redeploy.

### 3. Check before sharing
- Open the URL: the "Demo site" banner shows, prices say "Sample", checkout offers "Simulate success".
- Sign in at `/admin` with the demo staff login.
- Optional automated check from a machine with this repo:
  `E2E_DEMO=1 E2E_BASE_URL=<demo URL> E2E_CRON_SECRET=<demo CRON_SECRET> npx playwright test demo`
  (this places one test order and then runs the purge).

## Sharing
Send the client the URL. Share the demo staff login privately (not in the same message as
the link). Rotate that password after the review.
