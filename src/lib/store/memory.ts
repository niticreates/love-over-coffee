// In-memory preview store. Used when Supabase isn't configured (local dev, CI, design previews).
// Data resets on server restart. All mutations are synchronous inside a single JS turn,
// which gives the same atomicity the SQL functions provide in Supabase mode.
import { categories, defaultSettings, demoCustomizations, demoSamplePrices, externalPlatforms, galleryImages, products } from "@/data/seed";
import type { Category, ContactMessage, Coupon, ExternalPlatform, GalleryImage, NotificationLog, Order, Product, Reservation, WebsiteSettings } from "../types";
import { uuid } from "../ids";
import { StoreError, type Store } from "./types";

interface DB {
  settings: WebsiteSettings;
  categories: Category[];
  products: Product[];
  coupons: Coupon[];
  orders: Order[];
  payments: { provider_payment_id: string; order_id: string }[];
  webhookEvents: Set<string>;
  reservations: Reservation[];
  gallery: GalleryImage[];
  platforms: ExternalPlatform[];
  notifications: NotificationLog[];
  contacts: ContactMessage[];
}

const clone = <T>(v: T): T => structuredClone(v);

function freshDB(sample: boolean): DB {
  const settings = clone(defaultSettings);
  let prods = clone(products);
  if (sample) {
    prods = prods.map((p) => ({
      ...p,
      price: demoSamplePrices[p.slug] ?? null,
      customizations: p.category_id.includes("coffee") || p.category_id.includes("frappe") ? clone(demoCustomizations) : [],
    }));
    settings.commerce = { ...settings.commerce, ordering_enabled: true, tax_bps: 500, delivery_enabled: true, delivery_fee: 4000, free_delivery_above: 80000 };
    settings.business.hours = [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: "11:00", close: "23:00" }));
    settings.reservations.max_covers_per_slot = 24;
    settings.content.announcement = "Preview mode — sample prices, hours and capacity. Nothing is charged.";
  }
  return {
    settings,
    categories: clone(categories),
    products: prods,
    coupons: sample
      ? [{ code: "WELCOME10", kind: "percent", value: 1000, min_subtotal: 30000, max_discount: 10000, is_active: true, starts_at: null, ends_at: null }]
      : [],
    orders: [],
    payments: [],
    webhookEvents: new Set(),
    reservations: [],
    gallery: clone(galleryImages),
    platforms: clone(externalPlatforms),
    notifications: [],
    contacts: [],
  };
}

const g = globalThis as unknown as { __locMemoryDB?: DB };

export function resetMemoryStore(sample = process.env.DEMO_SAMPLE_DATA === "true") {
  g.__locMemoryDB = freshDB(sample);
}

function db(): DB {
  if (!g.__locMemoryDB) resetMemoryStore();
  return g.__locMemoryDB!;
}

const now = () => new Date().toISOString();

export const memoryStore: Store = {
  mode: "memory",

  async getSettings() {
    return clone(db().settings);
  },
  async updateSettings(patch) {
    const d = db();
    d.settings = { ...d.settings, ...clone(patch) };
    return clone(d.settings);
  },

  async listCategories(opts) {
    return clone(db().categories.filter((c) => opts?.includeInactive || c.is_active).sort((a, b) => a.sort_order - b.sort_order));
  },
  async upsertCategory(c) {
    const d = db();
    const i = d.categories.findIndex((x) => x.id === c.id);
    if (i >= 0) d.categories[i] = clone(c);
    else d.categories.push(clone(c));
    return clone(c);
  },
  async deleteCategory(id) {
    const d = db();
    if (d.products.some((p) => p.category_id === id)) throw new StoreError("conflict", "Move or delete this category's products first.");
    d.categories = d.categories.filter((c) => c.id !== id);
  },

  async listProducts(opts) {
    return clone(db().products.filter((p) => opts?.includeUnavailable || p.is_available).sort((a, b) => a.sort_order - b.sort_order));
  },
  async getProductBySlug(slug) {
    return clone(db().products.find((p) => p.slug === slug) ?? null);
  },
  async upsertProduct(p) {
    const d = db();
    if (d.products.some((x) => x.slug === p.slug && x.id !== p.id)) throw new StoreError("conflict", "Another product already uses that URL slug.");
    const i = d.products.findIndex((x) => x.id === p.id);
    if (i >= 0) d.products[i] = clone(p);
    else d.products.push(clone(p));
    return clone(p);
  },
  async deleteProduct(id) {
    db().products = db().products.filter((p) => p.id !== id);
  },

  async getCoupon(code) {
    return clone(db().coupons.find((c) => c.code.toUpperCase() === code.toUpperCase()) ?? null);
  },
  async listCoupons() {
    return clone(db().coupons);
  },
  async upsertCoupon(c) {
    const d = db();
    const i = d.coupons.findIndex((x) => x.code === c.code);
    if (i >= 0) d.coupons[i] = clone(c);
    else d.coupons.push(clone(c));
    return clone(c);
  },

  async createOrder(o) {
    const d = db();
    const existing = d.orders.find((x) => x.idempotency_key === o.idempotency_key);
    if (existing) return { order: clone(existing), existed: true };
    const order: Order = { ...clone(o), id: uuid(), created_at: now(), updated_at: now() };
    d.orders.unshift(order);
    return { order: clone(order), existed: false };
  },
  async getOrder(id) {
    return clone(db().orders.find((o) => o.id === id) ?? null);
  },
  async getOrderByToken(t) {
    return clone(db().orders.find((o) => o.public_token === t) ?? null);
  },
  async getOrderByRazorpayOrderId(id) {
    return clone(db().orders.find((o) => o.razorpay_order_id === id) ?? null);
  },
  async listOrders(f = {}) {
    let list = db().orders;
    if (f.status) list = list.filter((o) => o.status === f.status);
    if (f.from) list = list.filter((o) => o.created_at >= f.from!);
    if (f.to) list = list.filter((o) => o.created_at <= f.to!);
    if (f.q) {
      const q = f.q.toLowerCase();
      list = list.filter((o) => o.reference.toLowerCase().includes(q) || o.customer_name.toLowerCase().includes(q) || o.customer_phone.includes(q));
    }
    return clone(list.slice(0, f.limit ?? 200));
  },
  async updateOrder(id, patch, _actor) {
    const o = db().orders.find((x) => x.id === id);
    if (!o) throw new StoreError("not_found", "Order not found");
    Object.assign(o, patch, { updated_at: now() });
    return clone(o);
  },
  async recordPayment(p) {
    const d = db();
    const o = d.orders.find((x) => x.id === p.order_id);
    if (!o) throw new StoreError("not_found", "Order not found");
    if (d.payments.some((x) => x.provider_payment_id === p.provider_payment_id) || o.payment_status === "paid") {
      return { recorded: false, order: clone(o) };
    }
    d.payments.push({ provider_payment_id: p.provider_payment_id, order_id: p.order_id });
    Object.assign(o, { payment_status: "paid", razorpay_payment_id: p.provider_payment_id, updated_at: now() });
    return { recorded: true, order: clone(o) };
  },
  async markPaymentFailed(orderId) {
    const o = db().orders.find((x) => x.id === orderId);
    if (o && o.payment_status !== "paid") Object.assign(o, { payment_status: "failed", updated_at: now() });
  },
  async claimWebhookEvent(provider, eventId) {
    const k = `${provider}:${eventId}`;
    const set = db().webhookEvents;
    if (set.has(k)) return false;
    set.add(k);
    return true;
  },

  async createReservation(r, check) {
    const d = db();
    const active = d.reservations.filter((x) => x.date === r.date && (x.status === "requested" || x.status === "confirmed"));
    const dup = active.find((x) => x.phone === r.phone && x.time === r.time);
    if (dup) return { ok: true, reservation: clone(dup), existed: true };
    const verdict = check(clone(active));
    if (!verdict.ok) return verdict;
    const res: Reservation = { ...clone(r), id: uuid(), status: "requested", table_id: null, staff_note: null, created_at: now(), updated_at: now() };
    d.reservations.unshift(res);
    return { ok: true, reservation: clone(res), existed: false };
  },
  async listReservations(f = {}) {
    let list = db().reservations;
    if (f.status) list = list.filter((r) => r.status === f.status);
    if (f.date) list = list.filter((r) => r.date === f.date);
    if (f.from) list = list.filter((r) => r.date >= f.from!);
    if (f.to) list = list.filter((r) => r.date <= f.to!);
    return clone([...list].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, f.limit ?? 300));
  },
  async getReservationByToken(t) {
    return clone(db().reservations.find((r) => r.public_token === t) ?? null);
  },
  async getReservation(id) {
    return clone(db().reservations.find((r) => r.id === id) ?? null);
  },
  async updateReservation(id, patch, _actor) {
    const r = db().reservations.find((x) => x.id === id);
    if (!r) throw new StoreError("not_found", "Reservation not found");
    Object.assign(r, patch, { updated_at: now() });
    return clone(r);
  },

  async listPlatforms(opts) {
    return clone(
      db().platforms
        .filter((p) => !opts?.publicOnly || (p.is_active && p.is_verified && p.platform_url))
        .sort((a, b) => a.display_order - b.display_order),
    );
  },
  async upsertPlatform(p) {
    const d = db();
    const i = d.platforms.findIndex((x) => x.id === p.id);
    const row: ExternalPlatform = { ...clone(p), created_at: i >= 0 ? d.platforms[i].created_at : now(), updated_at: now() };
    if (i >= 0) d.platforms[i] = row;
    else d.platforms.push(row);
    return clone(row);
  },
  async deletePlatform(id) {
    db().platforms = db().platforms.filter((p) => p.id !== id);
  },
  async reorderPlatforms(ids) {
    const d = db();
    ids.forEach((id, i) => {
      const p = d.platforms.find((x) => x.id === id);
      if (p) p.display_order = i;
    });
  },

  async listGallery() {
    return clone([...db().gallery].sort((a, b) => a.sort_order - b.sort_order));
  },
  async upsertGalleryImage(img) {
    const d = db();
    const i = d.gallery.findIndex((x) => x.id === img.id);
    if (i >= 0) d.gallery[i] = clone(img);
    else d.gallery.push(clone(img));
    return clone(img);
  },
  async deleteGalleryImage(id) {
    db().gallery = db().gallery.filter((x) => x.id !== id);
  },
  async reorderGallery(ids) {
    const d = db();
    ids.forEach((id, i) => {
      const img = d.gallery.find((x) => x.id === id);
      if (img) img.sort_order = i;
    });
  },

  async uploadImage(_path, file) {
    if (file.size > 2_000_000) throw new StoreError("conflict", "Preview mode stores images in memory; keep uploads under 2 MB.");
    const buf = Buffer.from(await file.arrayBuffer());
    return `data:${file.type};base64,${buf.toString("base64")}`;
  },

  async logNotification(n) {
    db().notifications.unshift({ ...n, id: uuid(), created_at: now() });
  },
  async listNotificationLogs(limit = 50) {
    return clone(db().notifications.slice(0, limit));
  },

  async createContactMessage(m) {
    const msg = { ...m, id: uuid(), created_at: now() };
    db().contacts.unshift(msg);
    return clone(msg);
  },
  async listContactMessages(limit = 50) {
    return clone(db().contacts.slice(0, limit));
  },

  async healthCheck() {
    return true;
  },
};
