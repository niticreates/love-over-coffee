import { z } from "zod";
import { ORDER_STATUSES, RESERVATION_STATUSES } from "./types";

const slug = z.string().regex(/^[a-z0-9-]{1,80}$/, "Use lowercase letters, numbers and hyphens");
const rupeesToPaise = z.number().min(0).max(100000).transform((r) => Math.round(r * 100));

export const productSchema = z.object({
  id: z.string().max(80).optional(),
  slug,
  category_id: z.string().max(80),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(600).nullable(),
  price_rupees: rupeesToPaise.nullable(),
  is_veg: z.boolean().nullable(),
  is_available: z.boolean(),
  is_featured: z.boolean(),
  image_url: z.string().max(3_000_000).nullable(),
  image_alt: z.string().max(200).nullable(),
  sort_order: z.number().int().min(0).max(10000),
  verification: z.enum(["verified", "owner_to_confirm"]),
  customizations: z
    .array(
      z.object({
        id: z.string().max(80),
        name: z.string().trim().min(1).max(60),
        required: z.boolean(),
        max_select: z.number().int().min(1).max(10),
        options: z.array(z.object({ id: z.string().max(80), label: z.string().trim().min(1).max(60), price_delta: z.number().int().min(-1000000).max(1000000) })).min(1).max(20),
      }),
    )
    .max(10),
});

export const categorySchema = z.object({ id: z.string().max(80).optional(), slug, name: z.string().trim().min(1).max(80), sort_order: z.number().int().min(0), is_active: z.boolean() });

export const orderPatchSchema = z.object({ status: z.enum(ORDER_STATUSES) });

export const reservationPatchSchema = z.object({
  status: z.enum(RESERVATION_STATUSES).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  guests: z.number().int().min(1).max(50).optional(),
  staff_note: z.string().max(2000).nullable().optional(),
});

export const gallerySchema = z.object({
  id: z.string().max(80).optional(),
  category: z.enum(["interiors", "beverages", "food", "desserts", "experiences"]),
  url: z.string().max(3_000_000).nullable(),
  alt: z.string().trim().min(1).max(200),
  caption: z.string().trim().max(200).nullable(),
  sort_order: z.number().int().min(0),
  width: z.number().int().min(1).max(10000),
  height: z.number().int().min(1).max(10000),
});

const hhmm = z.string().regex(/^([01]\d|2[0-4]):[0-5]\d$/);
export const settingsSchema = z.object({
  business: z
    .object({
      name: z.string().min(1).max(120), short_name: z.string().min(1).max(60), address_lines: z.array(z.string().max(160)).max(4),
      locality: z.string().max(80), city: z.string().max(80), region: z.string().max(80), postal_code: z.string().max(12), country: z.string().length(2),
      phone_display: z.string().max(30), phone_e164: z.string().regex(/^\+\d{8,15}$/), whatsapp_e164: z.string().regex(/^\+\d{8,15}$/).nullable(),
      email: z.string().email().nullable(), instagram_url: z.string().url().regex(/^https:\/\/(www\.)?instagram\.com\//).nullable(),
      maps_query: z.string().max(300), maps_place_url: z.string().url(), geo: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).nullable(),
      price_range: z.string().max(60), hours: z.array(z.object({ day: z.number().int().min(0).max(6), open: hhmm.nullable(), close: hhmm.nullable() })).length(7).nullable(),
      hours_verification: z.enum(["verified", "owner_to_confirm"]), rating_note: z.string().max(120).nullable(), fssai: z.string().max(20).nullable(),
    })
    .optional(),
  commerce: z
    .object({
      ordering_enabled: z.boolean(), delivery_enabled: z.boolean(), tax_bps: z.number().int().min(0).max(2800).nullable(), tax_inclusive: z.boolean(),
      delivery_fee: z.number().int().min(0).max(100000), free_delivery_above: z.number().int().min(0).nullable(), min_order_value: z.number().int().min(0), currency: z.literal("INR"),
    })
    .optional(),
  reservations: z
    .object({
      enabled: z.boolean(), slot_minutes: z.union([z.literal(15), z.literal(30), z.literal(60)]), seating_minutes: z.number().int().min(30).max(300),
      max_guests_per_booking: z.number().int().min(1).max(50), max_covers_per_slot: z.number().int().min(1).max(1000).nullable(),
      min_lead_minutes: z.number().int().min(0).max(2880), max_days_ahead: z.number().int().min(1).max(180), last_booking_before_close_minutes: z.number().int().min(0).max(300),
    })
    .optional(),
  content: z
    .object({
      hero_headline: z.string().max(120), hero_image_url: z.string().max(3_000_000).nullable(), hero_subhead: z.string().max(300), intro_headline: z.string().max(120), intro_body: z.string().max(1200),
      reservation_headline: z.string().max(120), reservation_body: z.string().max(400), announcement: z.string().max(200).nullable(),
      story_sections: z.array(z.object({ id: z.string().max(40), title: z.string().max(120), body: z.string().max(2000), needs_owner_review: z.boolean() })).max(12),
    })
    .optional(),
  notifications: z
    .object({
      admin_emails: z.array(z.string().email()).max(10), admin_whatsapp: z.array(z.string().regex(/^\+\d{8,15}$/)).max(5),
      email_enabled: z.boolean(), whatsapp_enabled: z.boolean(),
    })
    .optional(),
});

export const couponSchema = z.object({
  code: z.string().regex(/^[A-Z0-9_-]{3,24}$/), kind: z.enum(["percent", "flat"]), value: z.number().int().min(1),
  min_subtotal: z.number().int().min(0), max_discount: z.number().int().min(0).nullable(), is_active: z.boolean(),
  starts_at: z.string().datetime().nullable(), ends_at: z.string().datetime().nullable(),
});
