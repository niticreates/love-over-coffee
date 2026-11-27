// Pure, deterministic pricing. The server ALWAYS recomputes totals from DB prices;
// the client copy is only for display.
import type { CommerceSettings, Coupon, FulfilmentMethod, OrderItem, PriceBreakdown, Product } from "./types";

export interface CartLineInput {
  product_id: string;
  quantity: number;
  selections?: { customization_id: string; option_ids: string[] }[];
}

export class PricingError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export function priceLines(lines: CartLineInput[], catalogue: Map<string, Product>): OrderItem[] {
  if (lines.length === 0) throw new PricingError("empty_cart", "Your cart is empty.");
  return lines.map((line) => {
    const p = catalogue.get(line.product_id);
    if (!p) throw new PricingError("unknown_product", "An item in your cart is no longer on the menu.");
    if (!p.is_available) throw new PricingError("unavailable", `${p.name} is not available right now.`);
    if (p.price == null) throw new PricingError("unpriced", `${p.name} can't be ordered online yet.`);
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 20)
      throw new PricingError("bad_quantity", "Quantities must be between 1 and 20.");

    const selections: OrderItem["selections"] = [];
    for (const cz of p.customizations) {
      const chosen = line.selections?.find((s) => s.customization_id === cz.id)?.option_ids ?? [];
      if (cz.required && chosen.length === 0) throw new PricingError("missing_option", `Choose ${cz.name} for ${p.name}.`);
      if (chosen.length > cz.max_select) throw new PricingError("too_many_options", `Too many ${cz.name} choices.`);
      for (const oid of chosen) {
        const opt = cz.options.find((o) => o.id === oid);
        if (!opt) throw new PricingError("bad_option", `Invalid ${cz.name} choice.`);
        selections.push({ customization: cz.name, option: opt.label, price_delta: opt.price_delta });
      }
    }
    // Reject selections for customizations that don't exist on the product.
    for (const s of line.selections ?? []) {
      if (s.option_ids.length && !p.customizations.some((c) => c.id === s.customization_id))
        throw new PricingError("bad_option", "Invalid customization.");
    }
    const unit = p.price + selections.reduce((a, s) => a + s.price_delta, 0);
    return {
      product_id: p.id,
      name: p.name,
      unit_price: unit,
      quantity: line.quantity,
      selections,
      line_total: unit * line.quantity,
    };
  });
}

export function couponDiscount(subtotal: number, coupon: Coupon | null, now = new Date()): number {
  if (!coupon || !coupon.is_active) return 0;
  if (coupon.starts_at && new Date(coupon.starts_at) > now) return 0;
  if (coupon.ends_at && new Date(coupon.ends_at) < now) return 0;
  if (subtotal < coupon.min_subtotal) return 0;
  let d = coupon.kind === "percent" ? Math.round((subtotal * coupon.value) / 10000) : coupon.value;
  if (coupon.max_discount != null) d = Math.min(d, coupon.max_discount);
  return Math.max(0, Math.min(d, subtotal));
}

export function computeTotals(
  items: OrderItem[],
  settings: CommerceSettings,
  fulfilment: FulfilmentMethod,
  coupon: Coupon | null = null,
): PriceBreakdown {
  const subtotal = items.reduce((a, i) => a + i.line_total, 0);
  const discount = couponDiscount(subtotal, coupon);
  const taxable = subtotal - discount;
  const bps = settings.tax_bps ?? 0;
  // Inclusive: prices already contain tax; we report the tax component, total unchanged.
  const tax = settings.tax_inclusive
    ? Math.round(taxable - taxable / (1 + bps / 10000))
    : Math.round((taxable * bps) / 10000);
  let delivery_fee = 0;
  if (fulfilment === "delivery") {
    delivery_fee =
      settings.free_delivery_above != null && taxable >= settings.free_delivery_above ? 0 : settings.delivery_fee;
  }
  const total = taxable + (settings.tax_inclusive ? 0 : tax) + delivery_fee;
  return { subtotal, discount, tax, delivery_fee, total };
}
