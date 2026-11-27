// Domain types shared by the UI, API routes and both data stores.
// Field names mirror the SQL schema in supabase/migrations (snake_case kept for parity).

export type Verification = "verified" | "owner_to_confirm";

export interface Category {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface CustomizationOption {
  id: string;
  label: string;
  price_delta: number; // paise
}

export interface ProductCustomization {
  id: string;
  name: string; // e.g. "Milk"
  required: boolean;
  max_select: number; // 1 = radio, >1 = checkboxes
  options: CustomizationOption[];
}

export interface Product {
  id: string;
  slug: string;
  category_id: string;
  name: string;
  description: string | null;
  /** Price in paise. null = not yet supplied by the owner; item cannot be ordered. */
  price: number | null;
  /** true = vegetarian, false = non-veg, null = not verified (no indicator shown). */
  is_veg: boolean | null;
  is_available: boolean;
  is_featured: boolean;
  image_url: string | null;
  image_alt: string | null;
  sort_order: number;
  customizations: ProductCustomization[];
  /** Data provenance. Anything not "verified" is flagged in admin. */
  verification: Verification;
  source_note?: string;
}

export type FulfilmentMethod = "pickup" | "delivery";

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready_for_pickup",
  "out_for_delivery",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["unpaid", "created", "paid", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface OrderItem {
  product_id: string;
  name: string;
  unit_price: number; // paise, incl. customization deltas
  quantity: number;
  selections: { customization: string; option: string; price_delta: number }[];
  line_total: number;
}

export interface PriceBreakdown {
  subtotal: number;
  discount: number;
  tax: number;
  delivery_fee: number;
  total: number;
}

export interface Order extends PriceBreakdown {
  id: string;
  reference: string; // human-friendly, e.g. LOC-7F3K9Q
  public_token: string; // unguessable token for the customer's status link
  idempotency_key: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  fulfilment: FulfilmentMethod;
  address: string | null;
  landmark: string | null;
  notes: string | null;
  items: OrderItem[];
  coupon_code: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export const RESERVATION_STATUSES = ["requested", "confirmed", "rejected", "cancelled", "completed", "no_show"] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export interface Reservation {
  id: string;
  reference: string;
  public_token: string;
  name: string;
  phone: string;
  email: string | null;
  date: string; // YYYY-MM-DD (Asia/Kolkata)
  time: string; // HH:MM
  guests: number;
  occasion: string | null;
  requests: string | null;
  status: ReservationStatus;
  table_id: string | null;
  staff_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface DayHours {
  /** 0 = Sunday … 6 = Saturday */
  day: number;
  open: string | null; // "HH:MM" or null = closed
  close: string | null; // may be "24:00" or past midnight e.g. "01:00"
}

export interface ReservationSettings {
  enabled: boolean;
  slot_minutes: number;
  seating_minutes: number;
  max_guests_per_booking: number;
  /** Max guests whose bookings may overlap one slot. null = not set by owner → requests only, no auto capacity. */
  max_covers_per_slot: number | null;
  min_lead_minutes: number;
  max_days_ahead: number;
  last_booking_before_close_minutes: number;
}

export interface BusinessSettings {
  name: string;
  short_name: string;
  address_lines: string[];
  locality: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  phone_display: string;
  phone_e164: string;
  whatsapp_e164: string | null;
  email: string | null;
  instagram_url: string | null;
  maps_query: string;
  maps_place_url: string;
  geo: { lat: number; lng: number } | null;
  price_range: string;
  hours: DayHours[] | null;
  hours_verification: Verification;
  rating_note: string | null;
  fssai: string | null;
}

export interface CommerceSettings {
  ordering_enabled: boolean;
  delivery_enabled: boolean;
  /** GST on restaurant service in basis points (e.g. 500 = 5%). null = owner to confirm. */
  tax_bps: number | null;
  tax_inclusive: boolean;
  delivery_fee: number; // paise
  free_delivery_above: number | null;
  min_order_value: number;
  currency: "INR";
}

export interface Coupon {
  code: string;
  kind: "percent" | "flat";
  value: number; // bps for percent, paise for flat
  min_subtotal: number;
  max_discount: number | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

export interface GalleryImage {
  id: string;
  category: "interiors" | "beverages" | "food" | "desserts" | "experiences";
  url: string | null;
  alt: string;
  caption: string | null;
  sort_order: number;
  width: number;
  height: number;
}

export interface SiteContent {
  hero_headline: string;
  hero_image_url: string | null;
  hero_subhead: string;
  intro_headline: string;
  intro_body: string;
  reservation_headline: string;
  reservation_body: string;
  announcement: string | null;
  story_sections: { id: string; title: string; body: string; needs_owner_review: boolean }[];
}

export interface WebsiteSettings {
  business: BusinessSettings;
  commerce: CommerceSettings;
  reservations: ReservationSettings;
  content: SiteContent;
  notifications: {
    admin_emails: string[];
    admin_whatsapp: string[];
    email_enabled: boolean;
    whatsapp_enabled: boolean;
  };
}

export interface NotificationLog {
  id: string;
  channel: "email" | "whatsapp";
  template: string;
  recipient: string;
  status: "sent" | "skipped" | "failed";
  detail: string | null;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  message: string;
  created_at: string;
}
