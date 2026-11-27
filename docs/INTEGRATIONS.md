# Go-live: integrations and deployment

## 1. Supabase
1. Create a project (region: Mumbai `ap-south-1`).
2. `supabase link --project-ref <ref>` then `supabase db push` (applies `supabase/migrations`), then run `supabase/seed.sql` (regenerate with `node scripts/generate-seed.ts`).
3. Auth → create the owner's user (email + password). Then in SQL:
   `insert into admin_profiles (user_id, display_name, role) values ('<auth user id>', 'Owner', 'owner');`
4. Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_SESSION_SECRET` (`openssl rand -base64 48`).

## 2. Razorpay (needs the café's KYC'd account)
1. Dashboard → API keys → generate **test** keys (`rzp_test_…`). Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
2. Webhooks → URL `https://<domain>/api/webhooks/razorpay`, events `payment.captured`, `payment.failed`, `order.paid`, secret → `RAZORPAY_WEBHOOK_SECRET`.
3. Test with Razorpay test UPI/cards; confirm the order shows **paid** in /admin and a duplicate webhook delivery is ignored.
4. Switch to live keys only after the owner approves prices, GST and refund policy.

## 3. Email (Resend)
Verify the sending domain, set `RESEND_API_KEY` and `EMAIL_FROM`, then in Admin → Settings enable email and add staff addresses.

## 4. WhatsApp (optional)
Meta WhatsApp Business Cloud API: register the number, create and get approval for templates named exactly as in `src/lib/notify.ts` (`order_placed_customer`, `order_status_customer`, `reservation_requested_customer`, `reservation_confirmed_customer`, `reservation_rejected_customer`, `reservation_cancelled_customer`, `reservation_reminder_customer`, `order_placed_admin`, `reservation_requested_admin`). Set `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`. A BSP (Gupshup, Interakt, AiSensy) can be swapped in at `sendWhatsApp()`.

## 5. Vercel
Import the repo, set all env vars (Production + Preview), set `NEXT_PUBLIC_SITE_URL` to the final domain, add `CRON_SECRET` (reservation reminders run daily 10:00 IST via `vercel.json`). Add the custom domain; HTTPS is automatic. Never set `DEMO_SAMPLE_DATA` or `ALLOW_SIMULATED_PAYMENTS` in production.

## Launch checklist
- [ ] Real prices, descriptions, veg marks reviewed (Admin → Menu)
- [ ] Hours confirmed; capacity set
- [ ] Photos uploaded (hero, menu, gallery)
- [ ] GST rate set, ordering enabled
- [ ] Razorpay test payment + webhook verified, then live keys
- [ ] Staff accounts created with correct roles
- [ ] Google Search Console + Business Profile website link

## WhatsApp click-to-chat (no API key needed)

Public WhatsApp buttons are plain `https://wa.me/<number>?text=<encoded message>` links built by `src/lib/whatsapp.ts` from Admin → Booking links. Four prefilled messages exist (general/floating button, reservation, ordering, group). The site always labels WhatsApp as an *enquiry* that staff confirm. This is separate from the WhatsApp Cloud API used for staff notifications.
