# Supabase production setup

How this site goes from the in-memory preview to a real Supabase database. Commands are for
Windows PowerShell, run from `D:\LEARNING\TECH\WEBSITES\love_over_coffee\site`.

## What the database holds

| Area | Tables |
| --- | --- |
| Staff | `admin_profiles` (one row per Supabase Auth user; role `owner`, `manager` or `staff`) |
| Settings | `website_settings` (keys `business`, `commerce`, `content`, `notifications`; opening hours live in `business.hours`), `reservation_settings` (single row) |
| Menu | `categories`, `products`, `product_images`, `product_customizations`, `customization_options` |
| Orders | `customers`, `coupons`, `orders`, `order_items`, `payments`, `webhook_events`, `order_status_history` |
| Reservations | `reservations`, `cafe_tables`, `reservation_status_history` |
| Content | `gallery_images`, `external_platforms`, `contact_messages`, `notification_logs` |

Money is integer paise. Every table has RLS on. The site's server uses the service-role key;
browsers never get it.

Migrations, in order:

1. `20261127000000_init.sql`: schema, transactional functions (`create_order`, `record_payment`, `create_reservation`), RLS, `media` bucket.
2. `20261127100000_external_platforms.sql`: booking and delivery links.
3. `20261128000000_production_hardening.sql`: column-level limits on what a staff login can change, status history with who changed it, atomic `save_product`, menu read limited to visible categories, bucket size and type limits, no anonymous file listing.

## 1. Create the project (dashboard)

1. https://supabase.com/dashboard, then **New project**.
2. Name `love-over-coffee`, region **South Asia (Mumbai)**, a strong database password (keep it in your password manager).
3. Wait for **Healthy**. The Project Reference ID is the part of the URL after `/project/`.

## 2. Apply the migrations

Either Claude applies them through the connected Supabase account (after you approve the plan),
or you run the CLI yourself:

```powershell
npx supabase@latest --version
npx supabase@latest login
npx supabase@latest link --project-ref <PROJECT_REF>     # asks for the database password
npx supabase@latest db push --dry-run                    # shows what will run; check it
npx supabase@latest db push
```

Never run `supabase db reset` against the hosted project: it deletes all data.

Then load the menu, gallery and settings seed once. It only inserts missing rows
(`on conflict do nothing`), so running it again never overwrites your edits:

open **SQL Editor → New query**, paste the contents of `supabase/seed.sql` and click **Run**
(or Claude runs it through the connected account).

## 3. Auth settings (dashboard)

- **Authentication → Sign In / Providers → Email**: keep Email enabled. Turn **Allow new users to sign up** OFF. Staff accounts are created only by the owner, never by public sign-up.
- **Authentication → URL Configuration**: Site URL = your live domain (e.g. `https://www.loveovercoffee.in`). Add `http://localhost:3000` to Redirect URLs for local work. Sign-in happens on the server with email and password, so no other redirect URLs are needed.

## 4. Create the owner login

1. **Authentication → Users → Add user → Create new user**: your email, a strong password, tick **Auto Confirm User**.
2. Copy the new user's **UID**.
3. In **SQL Editor** (replace the UID and name):

```sql
insert into public.admin_profiles (user_id, display_name, role)
values ('<UID>', 'Your name', 'owner')
on conflict (user_id) do update set role = 'owner', is_active = true;
```

Add more staff the same way with role `manager` or `staff`. Set `is_active = false` to remove access immediately.

## 5. Local environment

Create `.env.local` (it is git-ignored) from `.env.example`. Keys come from **Project Settings → API Keys** (and **Data API** for the URL).

```powershell
Copy-Item .env.example .env.local
# Generate a session secret and print it, then paste it into ADMIN_SESSION_SECRET in .env.local
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
notepad .env.local
```

Fill in:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable/anon key), `SUPABASE_SERVICE_ROLE_KEY` (secret key, server only)
- `ADMIN_SESSION_SECRET` (the value generated above)
- Leave `DEMO_ADMIN_PASSWORD` empty. With Supabase configured, sign-in uses Supabase Auth.
- `DEMO_SAMPLE_DATA=false`, `ALLOW_SIMULATED_PAYMENTS=false`, `ALLOW_MEMORY_STORE=false`

Restart `npm run dev`. The "Preview mode" banner in the dashboard disappears when the database is connected.

## 6. Production safety switches

- A production server (`next build` / `next start` / Vercel) **refuses to start without Supabase** unless `ALLOW_MEMORY_STORE=true` is set on purpose for a local preview. A missing variable shows an error; it never pretends orders were saved.
- Checkout **refuses to create an order** when Razorpay keys are missing in production (unless `ALLOW_SIMULATED_PAYMENTS=true`), instead of creating an order that can't be paid.
- Online ordering also stays off until the owner turns it on in **Admin → Settings**.

## 7. Razorpay (later, test keys first)

- Use `rzp_test_` keys until test orders pass end to end. Only then switch to live keys.
- Webhook: **Razorpay Dashboard → Webhooks → Add**: URL `https://<your-domain>/api/webhooks/razorpay`, events `payment.captured`, `payment.failed`, `order.paid`, a secret you generate → `RAZORPAY_WEBHOOK_SECRET`.
- Orders are marked paid only by the server: signature check plus a re-fetch of the payment, or the signed webhook. Duplicate callbacks are ignored by a unique payment id.

## 8. Vercel

Environment variables (Production): `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_SESSION_SECRET`,
`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`,
`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `CRON_SECRET`. Do **not** set `DEMO_*`,
`ALLOW_SIMULATED_PAYMENTS` or `ALLOW_MEMORY_STORE` in Production.

Build command `npm run build`, framework preset Next.js, Node 20+. After the domain is live,
update the Supabase Site URL and the Razorpay webhook URL to it.
