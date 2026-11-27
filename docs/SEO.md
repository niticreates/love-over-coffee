# SEO, local SEO and answer-engine readiness

## What the site does
- **Clean URLs:** `/`, `/menu`, `/menu/<dish>`, `/our-story` (old `/story` redirects permanently), `/gallery`, `/book-order`, `/reserve`, `/contact`.
- **Per page:** unique title and description, canonical URL, Open Graph and Twitter cards. The share image is `public/images/og/love-over-coffee-vijay-nagar.jpg` (1200×630, the café's own photos).
- **Structured data (JSON-LD):**
  - `CafeOrCoffeeShop` with name, address, phone, photos and menu link. `sameAs` lists only verified Zomato, Swiggy and District listings.
  - `WebSite`, a `BreadcrumbList` on every inner page, `Menu` with sections and items on `/menu`, and `MenuItem` on each dish page.
  - `FAQPage` on `/contact` and `/book-order`. The answers are visible on the page.
  - Prices, opening hours and map coordinates are published only once the café has confirmed them.
- **Crawling:** `sitemap.xml` covers every public page and every dish. `robots.txt` keeps admin, checkout and token pages out of the index, and explicitly allows answer-engine crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended and others).
- **LLM SEO:** `/llms.txt` gives a plain-language fact sheet built from the live settings, so it never says more than the site does.

## Needed from the owner before launch (these drive local ranking most)
1. **Google Business Profile:** claim or verify it and send the listing link. Use the exact same name, address and phone as the site.
2. **Opening hours, prices and map pin:** once confirmed, enter them in admin. They then appear in schema automatically.
3. **Instagram handle:** add it in admin settings so it is added to `sameAs`.
4. **Production domain:** set `NEXT_PUBLIC_SITE_URL` (for example `https://loveovercoffee.in`) before building. Canonicals, the sitemap and `llms.txt` use it.
5. **After launch:** submit the sitemap in Google Search Console and Bing Webmaster Tools, and ask happy guests for Google reviews.
