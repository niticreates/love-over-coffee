# Visual direction — brand-led redesign (Nov 2026)

## Audit of the previous version (why it looked generic)
- **Wrong identity.** Beige, espresso brown, terracotta and sage were guesses made before we had photos. The real café is turquoise, navy, blush and green — none of that was on the site.
- **No brand assets.** A serif "LOVE over COFFEE" wordmark replaced the rounded lowercase signage, and the turquoise cup mascot was absent.
- **Placeholder-led.** Every image slot was a "Photo to come" tile, so sections fell back to the same image-plus-text card rhythm.
- **Template structure.** Full-bleed dark hero with text on top, then evenly repeated sections with identical headings and sharp 2px cards.

## Direction: "the navy ceiling"
Editorial and playful at once. The site takes its colours from the room — the navy ceiling, blush velvet chairs, green sofas, burgundy wall — and its signature from the storefront: turquoise letters and the cup mascot. Soft-serif display type gives warmth and wit; rounded pill controls echo the round "O" in the sign. Each homepage section is a different composition: arch-and-circle collage hero, photo-pills set into a headline, an interactive index with a sticky photo, a navy "after hours" menu, a drifting three-frame room strip, a mosaic gallery with lightbox, and a turquoise closing block with the mascot.

## Palette (sampled from the supplied photos — estimates, not official codes)
| Token | Hex | Source | Use | Contrast |
| --- | --- | --- | --- | --- |
| turquoise | #22B8DE | storefront "O"/"C", mascot (sampled #24BBE0/#20B1D4) | signature fills, primary buttons | ink on it 7.0:1 (never white text) |
| turquoise-deep | #0A6F8C | darker turquoise | links/accent text on ivory | 5.4:1 |
| navy | #0B2A57 | ceiling (sampled #042D5B) | dark sections | ivory on it 13.3:1; turquoise 6.0:1 |
| ink | #0E1F3D | — | primary text | 15.3:1 |
| pink | #D6336C | mascot tongue, neon sign | punctuation, badges | white on it 4.6:1; large text only on ivory |
| blush | #F6CDD6 | velvet chairs | fills, accents on navy | ink on it 11.4:1 |
| berry | #8A2445 | burgundy feature wall | placeholder text | 8.1:1 |
| leaf | #3C6A32 | green sofas, plants | rare accents | 6.0:1 |
| sun | #F2C14E | yellow alcove | tiny highlights only | — |
| wood | #7A5536 | chair legs, counter | secondary text | 6.2:1 |
| ivory / cream / paper | #FBF7EF / #F3ECDF / #FFFFFF | — | backgrounds | — |

Legacy token names (espresso, terracotta, sage…) are aliased to these, so the admin re-themes automatically.

## Typography
- **Fraunces** (display): a soft serif with optical sizes and a "wonky" italic. Playful but grown-up; the italic carries the accents ("*Love*.", "*poured*.").
- **DM Sans** (body/UI): clean, very legible on mobile.
- **Quicksand Bold** (wordmark only): rounded lowercase that echoes the storefront letters.

## Brand assets: still to supply
- **Official logo and mascot vectors.** The wordmark (`components/ui/Wordmark.tsx`) and mascot (`components/ui/Mascot.tsx`) are faithful traces of the signage, not the official files. Swap them for SVGs when the owner provides them.
- **Higher-resolution photos.** The largest supplied image is 1360px wide; 2400px or more is ideal for the hero. There's also no video yet. The hero is built for one: a muted, looping clip with a poster image.

## Motion system
- **Easing and timing.** One easing curve, `cubic-bezier(.22,1,.36,1)`, with durations of 160, 320, 700 and 1000–1400ms for reveals.
- **Hero entrance.** Masked line-by-line headline rise, a clip-path image reveal, and the latte-art circle scaling in.
- **Scroll-linked effects.** Image parallax, the ticker, the seal rotation and the room-strip drift. None of them loop on their own.
- **Hover.** Button fills sweep up, images zoom gently, and the mascot tilts.
- **The one continuous animation.** The mascot blinks every 6 seconds.
- **Reduced motion.** Everything is disabled under `prefers-reduced-motion`.

## Photography rules
- Only the café's own supplied photos are used, organised in `public/images/{exterior,interior,coffee,food}`.
- No Google Maps user photos and no stock images.
- Each image carries an `object-position` in `src/lib/media.ts` so crops keep the food and signage in frame.
- A dish shows a photo only if that photo plausibly is that dish. Everything else is set typographically.
