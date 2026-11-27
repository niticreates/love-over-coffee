# Visual direction

**Idea: “the warm room.”** An editorial, hospitality-led site that feels like the café on a slow afternoon — warm ivory paper, espresso ink, terracotta as the single accent, sage as a quiet secondary. Large serif display type, small tracked capitals, hairline rules and an **arch** motif (window/doorway) used sparingly for key images. No glassmorphism, no gradients-as-decoration, no illustrations.

References studied for structure, not copied: Dishoom (storytelling + warmth, strong reservation CTA), WatchHouse (restraint, product-first menu), Noma / Eleven Madison Park (generous whitespace, photography carries the page, quiet navigation).

## Palette (design tokens in `src/app/globals.css`)

| Token | Hex | Use | Contrast on ivory |
| --- | --- | --- | --- |
| ivory | #F2EBDD | page background | — |
| paper | #F8F4EC | raised surfaces | — |
| oat | #E7DCCB | hairlines, quiet fills | — |
| espresso | #292720 | primary text | 12.6:1 |
| walnut | #79543D | secondary UI text | 5.6:1 |
| muted | #6B6457 | body secondary | 4.9:1 |
| terracotta | #A65F40 | primary buttons (white text 4.85:1) | 4.1:1 (fills only) |
| terracotta-ink | #8F4F33 | accent text | 5.3:1 |
| sage | #A9B99A | ornament, text on charcoal (6.1:1) | not for text on ivory |
| charcoal | #29343A | dark sections, footer | ivory on it 10.8:1 |

**Status: provisional.** These are the brief's estimates. We could not obtain licensed photographs of the Scheme 113 interiors, so the palette has **not** been extracted from real imagery. Once the owner supplies photos, sample walls, upholstery, wood and signage and adjust the tokens in one place.

## Typography
- Display: **Cormorant Garamond** 400–600 + italic — editorial, high contrast, beautiful at large sizes. Used ≥ 24px only.
- Body/UI: **Manrope** 400–700 — warm geometric sans, very legible on mobile.
- Tried Playfair (too heavy/“wedding”) and DM Serif (lacks an italic with character). Fonts self-hosted via `next/font`.

## Photography
Every image slot renders a real photo when uploaded, otherwise a **clearly labelled tonal placeholder** (“Photo to come”) coloured by category. We deliberately did not use stock food photos. Shot list for the owner: hero interior (landscape, 2400px+), window/seating details, cappuccino + Biscoff coffee, frappes, nachos, garlic bread, penne, sundae/tiramisu, board games in use, people in conversation (with consent).

## Wordmark
A typographic “LOVE *over* COFFEE” stands in until the official logo files are provided (`public/brand/`). Love Over Coffee also trades in other cities (Jaipur, Gurugram); confirm brand-usage rights and supply the official logo.
