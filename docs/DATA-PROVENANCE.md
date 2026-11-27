# Data provenance — what is real and what needs the owner

Rule: nothing customer-facing is invented. Unknown values are `null`, hidden, or shown as “to be confirmed”.

| Item | Status | Source / note |
| --- | --- | --- |
| Name, address, phone | ✅ from brief | Address matches Swiggy “Love Over Coffee, Scheme 113” listing (Plot No 11, Vijay Nagar 452010) |
| Google rating 4.7 / ~1,039 reviews | ⚠️ not displayed | From brief only; Google discourages self-published review markup, so it's not in schema either |
| Price range ₹200–₹400 | ✅ from brief | Free Press Journal (Feb 2026) says ₹250–₹400 |
| **Menu prices** | ❌ none | No verifiable public prices found (Swiggy menu not rendered). All `null` → “Price on request”, not orderable |
| Menu items (22) | ⚠️ owner to confirm | 20 from brief + Tiramisu Frappe (FPJ) + “Biscoff Cappuccino” (featured list — may duplicate Lotus Biscoff Coffee). “OTC” meaning unknown. Cheese Maggi category guessed |
| Item descriptions | ⚠️ owner to confirm | Neutral descriptions written by us |
| Veg / non-veg marks | ❌ hidden | Not verified; Swiggy FAQ text suggests many veg items but that's SEO copy |
| Opening hours | ❌ hidden | Not verified (Swiggy snapshot showed “Closed / opens 12:00 am”, unreliable) |
| Seating capacity / tables | ❌ unset | Reservations are manual-approval requests until capacity is set |
| Delivery | ❌ off | Pickup only until the café confirms website-managed delivery |
| GST rate | ❌ unset | Owner/accountant to set (online ordering stays off until then) |
| Instagram | ❌ hidden | No verified official handle found |
| WhatsApp number | ❌ hidden | Confirm whether +91 93296 97769 is on WhatsApp Business |
| Map pin | ⚠️ search-based | Set lat/lng from the Google Business Profile so the embed pins the Scheme 113 outlet, not another branch |
| FSSAI 21423850004379 | ⚠️ hidden | Appears on Swiggy for this outlet; owner to confirm before showing |
| Story copy | ⚠️ owner to review | No founding year, founder, sourcing or awards claimed |
| Board games, books, laptop-friendly | ✅ | Brief + Free Press Journal (Feb 2026) |

The dashboard's **“Before going live”** checklist tracks these.

## External booking & ordering links (checked 27 Nov 2026)

Each link was opened and matched to this outlet by address (Plot 11, Scheme/Sector 113, Vijay Nagar, 452010) and/or phone (+91 93296 97769) before being marked **verified**. Unverified, disabled or URL-less platforms never render publicly (enforced in the app and by Supabase RLS).

| Platform | Use | URL | Evidence |
|---|---|---|---|
| District | Reservations | https://www.district.in/dining/indore/love-over-coffee-vijay-nagar | Listing address + phone match |
| Zomato | Ordering | https://www.zomato.com/indore/love-over-coffee-vijay-nagar/order | Address + phone match; listing says "Vegetarian only" (owner to confirm before showing veg marks on our menu) |
| Swiggy | Ordering | https://www.swiggy.com/city/indore/love-over-coffee-vijay-nagar-scheme-113-rest764666 | Address match (Plot No 11, Sector 113) |
| Google Maps | Directions | Search link for "Love Over Coffee Scheme 113 Vijay Nagar Indore" | **Owner to replace** with the Google Business Profile share link to pin the exact listing |

Manage them in Admin → Booking links (`/admin/integrations`). Changing a URL there clears its verified flag until someone re-checks it.

## Photographs (supplied by the client, 27 Nov 2026)

Fifteen photographs were uploaded by the client and are stored in `public/images/`. They are used across the site and in the gallery seed. Google search pages that were also uploaded were **not** used as an image source.

**Dish matches made by appearance (owner to confirm):**
- Cappuccino: the latte-art cup.
- Cold Coffee: the two cold coffees.
- Tex-Mex Nachos: the nachos platter.
- Masala Pull-A-Part Garlic Bread: the pull-apart bread.

All other dishes have no photo and are shown typographically. Menu category headers use a photo of that kind of food, not a specific dish.

**Facts read from the photos and now used in the copy:**
- A party hall (signage visible).
- A wall of books by the counter.
- Outdoor white wicker seating.
- A navy ceiling, blush velvet chairs and green sofas.

**Owner to supply:**
- Official logo and mascot vector files.
- Higher-resolution hero images.
- Any video.
