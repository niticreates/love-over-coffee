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
- Deletes all orders, payments, reservations, contact messages, notification logs, customers and
  webhook events once a day, **between 2:30 and 3:30 AM IST** (`/api/cron/demo-purge`, protected by
  `CRON_SECRET`). The menu, categories, gallery, booking links and settings are kept. On Vercel's
  Hobby plan a cron job runs at some point within its scheduled hour; a failed run is not retried,
  so entries then wait for the next night (running it twice is harmless).

It **refuses to run** if the deployment has any of the settings below: the build fails, the server
refuses to start, and staff login and password reset stop before contacting Supabase. The error names
each setting but never its value.

- the production Supabase project URL, or a legacy (JWT) Supabase key that belongs to the production
  project or to a different project than the URL;
- `ADMIN_SESSION_SECRET` or `CRON_SECRET` missing, shorter than 32 characters, or equal to each other;
- Razorpay keys, `RESEND_API_KEY` or WhatsApp keys;
- no Supabase at all, `DEMO_ADMIN_PASSWORD`, `ALLOW_MEMORY_STORE` or `ALLOW_SIMULATED_PAYMENTS`.

New-style opaque Supabase keys (`sb_publishable_…`, `sb_secret_…`) don't say which project they
belong to, so a mismatch can't be detected locally. Supabase is expected to reject a key used
against another project, but that hasn't been tested here. Enter only the demo project's keys.

Normal deployments (no `DEMO_MODE`) behave exactly as before.

## One-time setup

### 1. Demo Supabase project (separate from the real one)
1. In Supabase, **New project**, name it `love-over-coffee-demo`, region Mumbai.
2. In its **SQL Editor**, run these files in order, one at a time:
   1. `supabase/migrations/20261127000000_init.sql`
   2. `supabase/migrations/20261127100000_external_platforms.sql`
   3. `supabase/migrations/20261128000000_production_hardening.sql`
   4. `supabase/migrations/20261128100000_privilege_cleanup.sql`
   5. `supabase/seed.sql`
   6. `supabase/demo/demo-seed.sql` (sample prices, 5% sample tax, sample hours and capacity). It
      refuses to run if `admin_profiles` already has any rows, which protects the real database.
      That is why the demo manager is created only in the next step.
3. **Authentication → Sign In / Providers → Email**: keep Email enabled and turn
   **Allow new users to sign up** OFF, so nobody can create accounts with the public key.
4. **Authentication → Users → Add user**: create one staff login for the client (an address you control, a strong password). Copy its user id.
5. In the SQL Editor:
   `insert into admin_profiles (user_id, display_name, role) values ('<that user id>', 'Demo manager', 'manager');`
   Use `manager` rather than `owner`: a manager can't change roles, create staff, or edit business,
   payment, tax or notification settings (enforced by the app and by database policies).
6. **Authentication → URL Configuration**: Site URL = the demo Vercel URL (after step 2 below), and add `<demo URL>/auth/reset-password` to Redirect URLs.
7. **Password-reset email (verify, not guaranteed):** Supabase's built-in email service may only
   deliver to certain recipients (for example, members of your Supabase organisation) and has low
   rate limits. Check Supabase's current Auth email documentation, then send a test reset to the
   demo manager's address. If it doesn't arrive, use an address that is allowed, or set up custom
   SMTP for the demo project.

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
   | `ADMIN_SESSION_SECRET` | new random value, 32+ characters: `openssl rand -base64 48` |
   | `CRON_SECRET` | a different new random value, 32+ characters: `openssl rand -base64 48` |

   Do **not** add Razorpay, Resend, WhatsApp, `DEMO_ADMIN_PASSWORD`, `ALLOW_*` or `DEMO_SAMPLE_DATA`.
   Never reuse the real project's keys or secrets.
4. **Settings → Build and Deployment → Node.js Version**: choose **22.x** (the version this
   project is tested on) and save.
5. **Settings → Git → Production Branch**: the branch you want the demo to show
   (until PR #1 is merged that is `feature/supabase-production-setup`).
6. **Deploy**. The URL appears on the project's overview under **Domains**
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
