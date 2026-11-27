# Architecture

```
Browser ──► Next.js (Vercel)
             ├─ Public pages (static + ISR 60s, revalidated on every admin write)
             ├─ Route handlers /api/*  ── zod validation, rate limits, same-origin checks
             │    ├─ /api/quote, /api/checkout ─► server-side pricing ─► Razorpay Orders API
             │    ├─ /api/payments/verify      ─► HMAC check + payment re-fetch ─► record_payment()
             │    ├─ /api/webhooks/razorpay    ─► signature + event-id dedupe ─► record_payment()
             │    ├─ /api/reservations         ─► rules + create_reservation() (advisory lock)
             │    └─ /api/admin/*              ─► signed session + role check
             └─ Store interface (src/lib/store)
                  ├─ supabase.ts  (service role, server only; RLS on every table)
                  └─ memory.ts    (preview/dev/CI)
Supabase: Postgres · Auth (staff logins) · Storage bucket `media`
```

## Why this stack
The brief's preferred stack fits: one Next.js app serves the marketing site, APIs and dashboard; Supabase gives Postgres + auth + storage without running servers. One deviation: **staff sessions** are an HMAC-signed httpOnly cookie issued after Supabase Auth verifies the password, and re-checked against `admin_profiles` on every request. This keeps auth logic in one place, works identically in preview mode, and means deactivating a staff member takes effect immediately.

## Ordering
1. Cart lives in `localStorage` (display prices only).
2. `/api/checkout` re-prices every line from the database (unpriced, unavailable or unknown items are rejected), applies coupon/tax/delivery from settings, and creates the order with an **idempotency key** (same cart + details → same order; double clicks can't duplicate).
3. A Razorpay order is created server-side for the exact total; the browser only gets the public key id.
4. Payment is marked **paid** only by the server: either `/verify` (signature + fetch payment and compare order id/amount/status) or the webhook. `record_payment()` locks the order row, rejects amount mismatches and inserts with a unique `provider_payment_id`, so duplicate callbacks are no-ops.
5. Order status starts at `pending` (“Sent to café”). The customer is only told it's accepted when staff move it to `confirmed`. Transitions are enforced (`allowedNextStatuses`); unpaid orders can only be cancelled.

**No POS integration is assumed.** The dashboard is the kitchen workflow. A POS/delivery integration would subscribe to the same `paid` event (webhook handler) — the store interface is the seam.

## Reservations
Requests, not guaranteed bookings. Slots come from configured opening hours; if hours aren't set, guests propose a time and staff confirm. If seating capacity (`max_covers_per_slot`) is set, overlapping bookings (`seating_minutes` window) are summed and full slots blocked — enforced twice: in app logic for a friendly message, and in `create_reservation()` under a per-date advisory lock so concurrent requests can't overbook. A partial unique index blocks duplicate active bookings (same phone/date/time); an exclusion constraint blocks double-booking an allocated table. Guests can cancel or request changes via their private link.

## Security
- Secrets only in server env; `server-only` imports guard against client bundling.
- RLS on every table. Anon can read menu/gallery/public settings only; orders, reservations, customers, payments are never readable by anon. Customer pages use 32-byte random tokens.
- Roles: `owner` (everything), `manager` (menu, gallery, content, capacity), `staff` (orders, reservations, availability). Enforced in API routes and mirrored in RLS.
- zod validation + sanitisation on every input; React escaping; JSON-LD escaped.
- CSRF: admin writes require same-origin `Origin`; cookies are `SameSite=Lax`, `httpOnly`, `Secure` in production.
- Rate limits on checkout, verify, reservations, contact, login (in-memory per instance — **swap for Upstash Redis on Vercel** for a global limit).
- Upload validation by MIME + magic bytes, 8 MB cap.
- Headers: CSP (Razorpay + Google Maps allow-listed), HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy. Note: `script-src 'unsafe-inline'` is needed for statically rendered pages; moving to nonces would force dynamic rendering.

## Known limits / next steps
- Rate limiting is per instance (see above).
- No customer accounts (guest checkout); order lookup is by private link.
- Refunds are initiated in the Razorpay dashboard; the order is then marked cancelled.
- Lighthouse not yet run against a deployed URL — do it after real photos are in, since images dominate LCP.
