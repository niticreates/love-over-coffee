import { SITE_URL } from "@/lib/seo";
import { getSiteData } from "@/lib/site";

export const revalidate = 3600;

/**
 * /llms.txt — a plain-language summary for AI assistants and answer engines (llmstxt.org).
 * Built from the same settings as the site, so it never states anything the site doesn't.
 */
export async function GET() {
  const { settings, categories, products, platforms } = await getSiteData();
  const b = settings.business;
  const cats = categories.filter((c) => products.some((p) => p.category_id === c.id)).map((c) => c.name);
  const hoursVerified = b.hours_verification === "verified" && b.hours;
  const links = platforms.filter((p) => p.is_active && p.is_verified && p.platform_url && p.platform_type !== "location");
  const body = `# ${b.short_name} — café in Vijay Nagar, Indore

> ${b.short_name} is a neighbourhood café at ${b.address_lines.join(", ")}, ${b.city}, ${b.region} ${b.postal_code}, India. It serves coffee, cold coffee, frappes and shakes, mocktails, starters, nachos, garlic bread, pasta and desserts, with dine-in seating, online ordering for pickup and table reservations.

## Key facts
- Name: ${b.name}
- Address: ${b.address_lines.join(", ")}, ${b.city}, ${b.region} ${b.postal_code}, India
- Phone / WhatsApp: ${b.phone_display}
- Area: Vijay Nagar (Scheme 113), Indore
- Opening hours: ${hoursVerified ? "see " + SITE_URL + "/contact" : "not yet confirmed by the café — please call before visiting"}
- Reservations: requested on the website or by WhatsApp; a request is confirmed only when café staff confirm it
- Prices: shown on the menu page once confirmed by the café
- Menu categories: ${cats.join(", ")}

## Pages
- [Home](${SITE_URL}/): overview of the café
- [Menu](${SITE_URL}/menu): full menu by category, with a page for each item
- [Our Story](${SITE_URL}/our-story): the café, its coffee, food and room
- [Book & Order](${SITE_URL}/book-order): reserve a table, order for pickup, or order via delivery partners
- [Reserve a table](${SITE_URL}/reserve): table request form
- [Gallery](${SITE_URL}/gallery): photographs of the café, coffee and food
- [Contact & location](${SITE_URL}/contact): address, directions, phone and FAQs
${links.length ? `\n## Official listings\n${links.map((p) => `- [${p.platform_name}](${p.platform_url})`).join("\n")}\n` : ""}`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
