import { z } from "zod";
import { fail, json, limit, parseBody } from "@/lib/http";
import { computeTotals, PricingError, priceLines } from "@/lib/pricing";
import { getStore } from "@/lib/store";
import { cartLineSchema } from "@/lib/validation";

const schema = z.object({
  items: z.array(cartLineSchema).max(50),
  fulfilment: z.enum(["pickup", "delivery"]),
  coupon_code: z.string().max(24).optional().nullable(),
});

/** Server-side price preview so the cart shows the same totals the server will charge. */
export async function POST(req: Request) {
  const limited = limit(req, "quote", 60, 60_000);
  if (limited) return limited;
  const body = await parseBody(req, schema);
  if (!body.ok) return body.res;
  const store = getStore();
  const [settings, products] = await Promise.all([store.getSettings(), store.listProducts({ includeUnavailable: true })]);
  if (body.data.items.length === 0) return json({ items: [], totals: { subtotal: 0, discount: 0, tax: 0, delivery_fee: 0, total: 0 } });
  try {
    const items = priceLines(body.data.items, new Map(products.map((p) => [p.id, p])));
    const code = body.data.coupon_code?.trim().toUpperCase();
    const coupon = code ? await store.getCoupon(code) : null;
    const totals = computeTotals(items, settings.commerce, body.data.fulfilment, coupon);
    return json({ items, totals, coupon: code ? (coupon && totals.discount > 0 ? { code, valid: true } : { code, valid: false }) : null });
  } catch (e) {
    if (e instanceof PricingError) return fail(409, e.code, e.message);
    throw e;
  }
}
