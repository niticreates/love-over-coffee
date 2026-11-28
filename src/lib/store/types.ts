import type {
  Category,
  ContactMessage,
  Coupon,
  ExternalPlatform,
  GalleryImage,
  NotificationLog,
  Order,
  OrderStatus,
  Product,
  Reservation,
  ReservationStatus,
  WebsiteSettings,
} from "../types";

export interface OrderFilter {
  status?: OrderStatus;
  from?: string; // ISO date
  to?: string;
  q?: string;
  limit?: number;
}

export interface ReservationFilter {
  status?: ReservationStatus;
  date?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export type NewOrder = Omit<Order, "id" | "created_at" | "updated_at">;
export type NewReservation = Omit<Reservation, "id" | "created_at" | "updated_at" | "status" | "table_id" | "staff_note">;

export interface PaymentRecord {
  order_id: string;
  provider: "razorpay" | "simulated";
  provider_order_id: string | null;
  provider_payment_id: string;
  amount: number;
  status: "captured" | "authorized" | "failed";
  method: string | null;
  raw: unknown;
}

export interface Store {
  readonly mode: "memory" | "supabase";

  getSettings(): Promise<WebsiteSettings>;
  updateSettings(patch: Partial<WebsiteSettings>): Promise<WebsiteSettings>;

  listCategories(opts?: { includeInactive?: boolean }): Promise<Category[]>;
  upsertCategory(c: Category): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  listProducts(opts?: { includeUnavailable?: boolean }): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | null>;
  upsertProduct(p: Product): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  getCoupon(code: string): Promise<Coupon | null>;
  listCoupons(): Promise<Coupon[]>;
  upsertCoupon(c: Coupon): Promise<Coupon>;

  /** Idempotent on idempotency_key: returns the existing order if the key was used. */
  createOrder(o: NewOrder): Promise<{ order: Order; existed: boolean }>;
  getOrder(id: string): Promise<Order | null>;
  getOrderByToken(token: string): Promise<Order | null>;
  getOrderByRazorpayOrderId(rzpOrderId: string): Promise<Order | null>;
  listOrders(f?: OrderFilter): Promise<Order[]>;
  updateOrder(id: string, patch: Partial<Pick<Order, "status" | "payment_status" | "razorpay_order_id" | "razorpay_payment_id">>, actor?: string): Promise<Order>;
  /**
   * Atomically mark an order paid. Returns false if this payment id was already
   * recorded (duplicate callback / webhook) — callers must treat that as success-noop.
   */
  recordPayment(p: PaymentRecord): Promise<{ recorded: boolean; order: Order }>;
  markPaymentFailed(orderId: string, detail: unknown): Promise<void>;
  /** Returns true the first time an event id is seen. */
  claimWebhookEvent(provider: string, eventId: string, payload: unknown): Promise<boolean>;

  /**
   * Create a reservation inside a critical section. `check` receives the active bookings
   * for that date and decides whether capacity allows it. Duplicate submissions
   * (same phone/date/time while active) return the existing booking.
   */
  createReservation(
    r: NewReservation,
    check: (sameDay: Reservation[]) => { ok: true } | { ok: false; code: string; message: string },
  ): Promise<{ ok: true; reservation: Reservation; existed: boolean } | { ok: false; code: string; message: string }>;
  listReservations(f?: ReservationFilter): Promise<Reservation[]>;
  getReservationByToken(token: string): Promise<Reservation | null>;
  getReservation(id: string): Promise<Reservation | null>;
  updateReservation(id: string, patch: Partial<Pick<Reservation, "status" | "date" | "time" | "guests" | "staff_note" | "table_id">>, actor?: string): Promise<Reservation>;

  /** publicOnly → active, verified, with a URL; sorted by display_order. */
  listPlatforms(opts?: { publicOnly?: boolean }): Promise<ExternalPlatform[]>;
  upsertPlatform(p: Omit<ExternalPlatform, "created_at" | "updated_at">): Promise<ExternalPlatform>;
  deletePlatform(id: string): Promise<void>;
  reorderPlatforms(ids: string[]): Promise<void>;

  listGallery(): Promise<GalleryImage[]>;
  upsertGalleryImage(g: GalleryImage): Promise<GalleryImage>;
  deleteGalleryImage(id: string): Promise<void>;
  reorderGallery(ids: string[]): Promise<void>;

  uploadImage(path: string, file: File): Promise<string>;

  logNotification(n: Omit<NotificationLog, "id" | "created_at">): Promise<void>;
  listNotificationLogs(limit?: number): Promise<NotificationLog[]>;

  createContactMessage(m: Omit<ContactMessage, "id" | "created_at">): Promise<ContactMessage>;
  listContactMessages(limit?: number): Promise<ContactMessage[]>;

  /** Demo only: delete every order, payment, reservation, message, notification log and customer. Returns rows removed per table. */
  purgeCustomerData(): Promise<Record<string, number>>;

  healthCheck(): Promise<boolean>;
}

export class StoreError extends Error {
  constructor(public code: "not_found" | "conflict" | "unavailable", message: string) {
    super(message);
  }
}
