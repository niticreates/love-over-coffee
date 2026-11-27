// Supabase/PostgreSQL store. Runs only on the server with the service-role key; RLS still
// protects every table from direct anon access. Writes that need atomicity go through
// the security-definer SQL functions in supabase/migrations.
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { defaultSettings } from "@/data/seed";
import { env } from "../config";
import type { Category, ContactMessage, Coupon, ExternalPlatform, NotificationLog, GalleryImage, Order, OrderItem, Product, Reservation, WebsiteSettings } from "../types";
import { StoreError, type Store } from "./types";

let client: SupabaseClient | null = null;
function sb(): SupabaseClient {
  if (!client) client = createClient(env.supabaseUrl, env.supabaseServiceKey, { auth: { persistSession: false } });
  return client;
}

function must<T>(res: { data: T; error: { message: string; code?: string } | null }): T {
  if (res.error) {
    if (res.error.code === "23505") throw new StoreError("conflict", "That value is already in use.");
    if (res.error.code === "23503") throw new StoreError("conflict", "This record is still referenced elsewhere.");
    throw new StoreError("unavailable", res.error.message);
  }
  return res.data;
}

const PRODUCT_SELECT = "*, product_images(url, alt, is_primary), product_customizations(*, customization_options(*))";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toProduct(r: any): Product {
  const img = (r.product_images ?? []).find((i: { is_primary: boolean }) => i.is_primary) ?? r.product_images?.[0];
  return {
    id: r.id, slug: r.slug, category_id: r.category_id, name: r.name, description: r.description, price: r.price,
    is_veg: r.is_veg, is_available: r.is_available, is_featured: r.is_featured, sort_order: r.sort_order,
    image_url: img?.url ?? null, image_alt: img?.alt ?? null, verification: r.verification, source_note: r.source_note ?? undefined,
    customizations: (r.product_customizations ?? [])
      .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((c: any) => ({
        id: c.id, name: c.name, required: c.required, max_select: c.max_select,
        options: (c.customization_options ?? [])
          .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
          .map((o: { id: string; label: string; price_delta: number }) => ({ id: o.id, label: o.label, price_delta: o.price_delta })),
      })),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toOrder(r: any): Order {
  const items: OrderItem[] = (r.order_items ?? []).map((i: OrderItem) => ({
    product_id: i.product_id, name: i.name, unit_price: i.unit_price, quantity: i.quantity, selections: i.selections, line_total: i.line_total,
  }));
  const { order_items: _omit, customer_id: _c, ...rest } = r;
  return { ...rest, items } as Order;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toReservation(r: any): Reservation {
  return { ...r, time: String(r.time).slice(0, 5) } as Reservation;
}

const ORDER_SELECT = "*, order_items(*)";

export const supabaseStore: Store = {
  mode: "supabase",

  async getSettings() {
    const [rows, rs] = await Promise.all([
      sb().from("website_settings").select("key, value"),
      sb().from("reservation_settings").select("*").eq("id", true).single(),
    ]);
    const map = Object.fromEntries((must(rows) ?? []).map((r: { key: string; value: unknown }) => [r.key, r.value]));
    const r = must(rs) as Record<string, unknown>;
    return {
      business: { ...defaultSettings.business, ...(map.business ?? {}) },
      commerce: { ...defaultSettings.commerce, ...(map.commerce ?? {}) },
      content: { ...defaultSettings.content, ...(map.content ?? {}) },
      notifications: { ...defaultSettings.notifications, ...(map.notifications ?? {}) },
      reservations: {
        enabled: r.enabled as boolean, slot_minutes: r.slot_minutes as number, seating_minutes: r.seating_minutes as number,
        max_guests_per_booking: r.max_guests_per_booking as number, max_covers_per_slot: r.max_covers_per_slot as number | null,
        min_lead_minutes: r.min_lead_minutes as number, max_days_ahead: r.max_days_ahead as number,
        last_booking_before_close_minutes: r.last_booking_before_close_minutes as number,
      },
    } satisfies WebsiteSettings;
  },
  async updateSettings(patch) {
    const { reservations, ...rest } = patch;
    const rows = Object.entries(rest).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() }));
    if (rows.length) must(await sb().from("website_settings").upsert(rows));
    if (reservations) must(await sb().from("reservation_settings").update({ ...reservations, updated_at: new Date().toISOString() }).eq("id", true));
    return this.getSettings();
  },

  async listCategories(opts) {
    let q = sb().from("categories").select("id, slug, name, sort_order, is_active").order("sort_order");
    if (!opts?.includeInactive) q = q.eq("is_active", true);
    return must(await q) as Category[];
  },
  async upsertCategory(c) {
    must(await sb().from("categories").upsert(c));
    return c;
  },
  async deleteCategory(id) {
    must(await sb().from("categories").delete().eq("id", id));
  },

  async listProducts(opts) {
    let q = sb().from("products").select(PRODUCT_SELECT).order("sort_order");
    if (!opts?.includeUnavailable) q = q.eq("is_available", true);
    return (must(await q) ?? []).map(toProduct);
  },
  async getProductBySlug(slug) {
    const r = must(await sb().from("products").select(PRODUCT_SELECT).eq("slug", slug).maybeSingle());
    return r ? toProduct(r) : null;
  },
  async upsertProduct(p) {
    const { customizations, image_url, image_alt, ...row } = p;
    must(await sb().from("products").upsert(row));
    // Replace customizations (small sets; simplest correct approach).
    must(await sb().from("product_customizations").delete().eq("product_id", p.id));
    for (const [i, c] of customizations.entries()) {
      must(await sb().from("product_customizations").insert({ id: c.id, product_id: p.id, name: c.name, required: c.required, max_select: c.max_select, sort_order: i }));
      if (c.options.length)
        must(await sb().from("customization_options").insert(c.options.map((o, j) => ({ ...o, customization_id: c.id, sort_order: j }))));
    }
    must(await sb().from("product_images").delete().eq("product_id", p.id));
    if (image_url) must(await sb().from("product_images").insert({ product_id: p.id, url: image_url, alt: image_alt ?? p.name, is_primary: true }));
    return p;
  },
  async deleteProduct(id) {
    must(await sb().from("products").delete().eq("id", id));
  },

  async getCoupon(code) {
    return (must(await sb().from("coupons").select("*").eq("code", code.toUpperCase()).maybeSingle()) as Coupon | null) ?? null;
  },
  async listCoupons() {
    return must(await sb().from("coupons").select("*").order("created_at", { ascending: false })) as Coupon[];
  },
  async upsertCoupon(c) {
    must(await sb().from("coupons").upsert(c));
    return c;
  },

  async createOrder(o) {
    const existing = must(await sb().from("orders").select("id").eq("idempotency_key", o.idempotency_key).maybeSingle());
    const id = must(await sb().rpc("create_order", { p: o })) as string;
    const order = await this.getOrder(id);
    if (!order) throw new StoreError("unavailable", "Order could not be saved.");
    return { order, existed: Boolean(existing) };
  },
  async getOrder(id) {
    const r = must(await sb().from("orders").select(ORDER_SELECT).eq("id", id).maybeSingle());
    return r ? toOrder(r) : null;
  },
  async getOrderByToken(t) {
    const r = must(await sb().from("orders").select(ORDER_SELECT).eq("public_token", t).maybeSingle());
    return r ? toOrder(r) : null;
  },
  async getOrderByRazorpayOrderId(id) {
    const r = must(await sb().from("orders").select(ORDER_SELECT).eq("razorpay_order_id", id).maybeSingle());
    return r ? toOrder(r) : null;
  },
  async listOrders(f = {}) {
    let q = sb().from("orders").select(ORDER_SELECT).order("created_at", { ascending: false }).limit(f.limit ?? 200);
    if (f.status) q = q.eq("status", f.status);
    if (f.from) q = q.gte("created_at", f.from);
    if (f.to) q = q.lte("created_at", f.to);
    if (f.q) {
      const s = f.q.replace(/[,%()]/g, "");
      q = q.or(`reference.ilike.%${s}%,customer_name.ilike.%${s}%,customer_phone.ilike.%${s}%`);
    }
    return (must(await q) ?? []).map(toOrder);
  },
  async updateOrder(id, patch) {
    const r = must(await sb().from("orders").update(patch).eq("id", id).select(ORDER_SELECT).single());
    return toOrder(r);
  },
  async recordPayment(p) {
    const recorded = must(
      await sb().rpc("record_payment", {
        p_order: p.order_id, p_provider: p.provider, p_provider_order: p.provider_order_id, p_payment: p.provider_payment_id,
        p_amount: p.amount, p_method: p.method, p_raw: p.raw,
      }),
    ) as boolean;
    const order = await this.getOrder(p.order_id);
    if (!order) throw new StoreError("not_found", "Order not found");
    return { recorded, order };
  },
  async markPaymentFailed(orderId) {
    must(await sb().from("orders").update({ payment_status: "failed" }).eq("id", orderId).neq("payment_status", "paid"));
  },
  async claimWebhookEvent(provider, eventId, payload) {
    const res = await sb().from("webhook_events").insert({ provider, event_id: eventId, payload });
    if (res.error?.code === "23505") return false;
    must(res);
    return true;
  },

  async createReservation(r, check) {
    const settings = await this.getSettings();
    const sameDay = await this.listReservations({ date: r.date });
    const active = sameDay.filter((x) => x.status === "requested" || x.status === "confirmed");
    const dup = active.find((x) => x.phone === r.phone && x.time === r.time);
    if (dup) return { ok: true, reservation: dup, existed: true };
    const verdict = check(active);
    if (!verdict.ok) return verdict;
    // The SQL function re-checks capacity under an advisory lock (race-safe).
    const res = must(
      await sb().rpc("create_reservation", { p: r, p_max_covers: settings.reservations.max_covers_per_slot, p_seating: settings.reservations.seating_minutes }),
    ) as { ok: boolean; existed?: boolean; id?: string; code?: string };
    if (!res.ok) return { ok: false, code: res.code ?? "full", message: "That time just filled up. Please pick another slot." };
    const reservation = await this.getReservation(res.id!);
    return { ok: true, reservation: reservation!, existed: Boolean(res.existed) };
  },
  async listReservations(f = {}) {
    let q = sb().from("reservations").select("*").order("date").order("time").limit(f.limit ?? 300);
    if (f.status) q = q.eq("status", f.status);
    if (f.date) q = q.eq("date", f.date);
    if (f.from) q = q.gte("date", f.from);
    if (f.to) q = q.lte("date", f.to);
    return (must(await q) ?? []).map(toReservation);
  },
  async getReservationByToken(t) {
    const r = must(await sb().from("reservations").select("*").eq("public_token", t).maybeSingle());
    return r ? toReservation(r) : null;
  },
  async getReservation(id) {
    const r = must(await sb().from("reservations").select("*").eq("id", id).maybeSingle());
    return r ? toReservation(r) : null;
  },
  async updateReservation(id, patch) {
    const res = await sb().from("reservations").update(patch).eq("id", id).select("*").single();
    if (res.error?.code === "23P01") throw new StoreError("conflict", "That table is already booked for an overlapping time.");
    return toReservation(must(res));
  },

  async listPlatforms(opts) {
    let q = sb().from("external_platforms").select("*").order("display_order");
    if (opts?.publicOnly) q = q.eq("is_active", true).eq("is_verified", true).not("platform_url", "is", null);
    return (must(await q) ?? []) as ExternalPlatform[];
  },
  async upsertPlatform(p) {
    return must(await sb().from("external_platforms").upsert(p).select("*").single()) as ExternalPlatform;
  },
  async deletePlatform(id) {
    must(await sb().from("external_platforms").delete().eq("id", id));
  },
  async reorderPlatforms(ids) {
    await Promise.all(ids.map((id, i) => sb().from("external_platforms").update({ display_order: i }).eq("id", id)));
  },

  async listGallery() {
    return must(await sb().from("gallery_images").select("*").order("sort_order")) as GalleryImage[];
  },
  async upsertGalleryImage(g) {
    must(await sb().from("gallery_images").upsert(g));
    return g;
  },
  async deleteGalleryImage(id) {
    must(await sb().from("gallery_images").delete().eq("id", id));
  },
  async reorderGallery(ids) {
    await Promise.all(ids.map((id, i) => sb().from("gallery_images").update({ sort_order: i }).eq("id", id)));
  },

  async uploadImage(path, file) {
    must(await sb().storage.from("media").upload(path, file, { contentType: file.type, upsert: false, cacheControl: "31536000" }));
    return sb().storage.from("media").getPublicUrl(path).data.publicUrl;
  },

  async logNotification(n) {
    await sb().from("notification_logs").insert(n);
  },
  async listNotificationLogs(limit = 50) {
    return (must(await sb().from("notification_logs").select("*").order("created_at", { ascending: false }).limit(limit)) ?? []) as NotificationLog[];
  },

  async createContactMessage(m) {
    return must(await sb().from("contact_messages").insert(m).select("*").single()) as ContactMessage;
  },
  async listContactMessages(limit = 50) {
    return (must(await sb().from("contact_messages").select("*").order("created_at", { ascending: false }).limit(limit)) ?? []) as ContactMessage[];
  },

  async healthCheck() {
    const r = await sb().from("categories").select("id").limit(1);
    return !r.error;
  },
};
