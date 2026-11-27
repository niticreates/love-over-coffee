# Love Over Coffee — Vijay Nagar

Website, online ordering, table reservations and staff dashboard for **Love Over Coffee, Plot No. 11, Scheme No. 113, Vijay Nagar, Indore**.

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Motion · Supabase (Postgres, Auth, Storage) · Razorpay · Resend · WhatsApp Cloud API · Vercel.

## Run it

```bash
npm install
cp .env.example .env.local      # leave Supabase/Razorpay blank for preview mode
echo "DEMO_SAMPLE_DATA=true" >> .env.local     # sample prices/hours/capacity, clearly labelled
echo "DEMO_ADMIN_PASSWORD=choose-one" >> .env.local
npm run dev                      # http://localhost:3000 · dashboard at /admin
```

Without Supabase the app runs on an **in-memory preview store** (resets on restart) and payments are **simulated** (a test dialog replaces Razorpay; disabled automatically in production and whenever real keys exist).

## Tests

| Command | What it covers |
| --- | --- |
| `npm test` | Unit: pricing, coupons, tax, slot generation, booking rules, Razorpay HMAC, admin sessions, validation |
| `./scripts/test-sql.sh` | Applies migrations to a local Postgres and checks idempotent orders, duplicate-payment guard, amount mismatch, overbooking, table double-booking, RLS |
| `npm run test:e2e` | Playwright: every page at 360–1920px, menu search/filter, cart → checkout → failed + successful payment → admin fulfilment, reservation → duplicate guard → approval, contact, auth, webhook/CSRF/header checks |
| `npm run typecheck` / `npm run lint` | |

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system design, data flow, security model
- [docs/BRAND.md](docs/BRAND.md) — visual direction, palette, typography, tokens
- [docs/DATA-PROVENANCE.md](docs/DATA-PROVENANCE.md) — what is verified vs. **owner-to-confirm**
- [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md) — Supabase, Razorpay, email, WhatsApp, Vercel go-live steps
