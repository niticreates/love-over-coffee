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
