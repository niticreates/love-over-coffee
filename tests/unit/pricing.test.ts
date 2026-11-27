import { describe, expect, it } from "vitest";
import { computeTotals, couponDiscount, PricingError, priceLines } from "@/lib/pricing";
import type { CommerceSettings, Product } from "@/lib/types";

const base: Product = { id: "p1", slug: "p1", category_id: "c", name: "Cappuccino", description: null, price: 20000, is_veg: true, is_available: true, is_featured: false, image_url: null, image_alt: null, sort_order: 0, verification: "verified",
  customizations: [{ id: "milk", name: "Milk", required: true, max_select: 1, options: [{ id: "reg", label: "Regular", price_delta: 0 }, { id: "oat", label: "Oat", price_delta: 5000 }] }] };
const cat = new Map([["p1", base], ["p2", { ...base, id: "p2", price: null, customizations: [] }], ["p3", { ...base, id: "p3", is_available: false, customizations: [] }]]);
const commerce: CommerceSettings = { ordering_enabled: true, delivery_enabled: true, tax_bps: 500, tax_inclusive: false, delivery_fee: 4000, free_delivery_above: 100000, min_order_value: 0, currency: "INR" };

describe("priceLines", () => {
  it("prices options server-side", () => {
    const [l] = priceLines([{ product_id: "p1", quantity: 2, selections: [{ customization_id: "milk", option_ids: ["oat"] }] }], cat);
    expect(l.unit_price).toBe(25000);
    expect(l.line_total).toBe(50000);
  });
  it("rejects unpriced, unavailable, unknown, missing-required and bad quantities", () => {
    const bad = (lines: Parameters<typeof priceLines>[0]) => { try { priceLines(lines, cat); return null; } catch (e) { return (e as PricingError).code; } };
    expect(bad([{ product_id: "p2", quantity: 1 }])).toBe("unpriced");
    expect(bad([{ product_id: "p3", quantity: 1 }])).toBe("unavailable");
    expect(bad([{ product_id: "zz", quantity: 1 }])).toBe("unknown_product");
    expect(bad([{ product_id: "p1", quantity: 1 }])).toBe("missing_option");
    expect(bad([{ product_id: "p1", quantity: 0, selections: [{ customization_id: "milk", option_ids: ["reg"] }] }])).toBe("bad_quantity");
    expect(bad([{ product_id: "p1", quantity: 1, selections: [{ customization_id: "milk", option_ids: ["fake"] }] }])).toBe("bad_option");
    expect(bad([])).toBe("empty_cart");
  });
});

describe("computeTotals", () => {
  const items = priceLines([{ product_id: "p1", quantity: 2, selections: [{ customization_id: "milk", option_ids: ["reg"] }] }], cat);
  it("adds exclusive tax and delivery", () => {
    expect(computeTotals(items, commerce, "delivery")).toEqual({ subtotal: 40000, discount: 0, tax: 2000, delivery_fee: 4000, total: 46000 });
  });
  it("pickup has no delivery fee", () => {
    expect(computeTotals(items, commerce, "pickup").total).toBe(42000);
  });
  it("inclusive tax keeps total unchanged", () => {
    const t = computeTotals(items, { ...commerce, tax_inclusive: true }, "pickup");
    expect(t.total).toBe(40000);
    expect(t.tax).toBe(1905);
  });
  it("applies capped percentage coupons", () => {
    const c = { code: "X", kind: "percent" as const, value: 5000, min_subtotal: 0, max_discount: 5000, is_active: true, starts_at: null, ends_at: null };
    expect(couponDiscount(40000, c)).toBe(5000);
    expect(couponDiscount(40000, { ...c, is_active: false })).toBe(0);
    expect(couponDiscount(40000, { ...c, ends_at: "2000-01-01T00:00:00Z" })).toBe(0);
    expect(couponDiscount(1000, { ...c, kind: "flat", value: 99999, max_discount: null })).toBe(1000);
  });
});
