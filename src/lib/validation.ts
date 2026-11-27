import { z } from "zod";

/** Strip control chars and angle brackets; trim. React escapes output too — this is defence in depth. */
export const clean = (s: string) => s.replace(/[\u0000-\u001F\u007F<>]/g, "").replace(/\s+/g, " ").trim();
const text = (max: number) => z.string().max(max * 2).transform(clean).pipe(z.string().max(max));
const optionalText = (max: number) =>
  z.string().max(max * 2).optional().nullable().transform((v) => (v ? clean(v) : null)).pipe(z.string().max(max).nullable());

/** Accepts 10-digit Indian mobiles with optional +91/0 prefix and spaces; outputs E.164. */
export const indianMobile = z
  .string()
  .transform((v) => v.replace(/[\s()-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"))
  .transform((v) => `+91${v}`);

const email = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v ? v.trim().toLowerCase() : null))
  .pipe(z.string().email("Enter a valid email").max(160).nullable());

export const cartLineSchema = z.object({
  product_id: z.string().min(1).max(80),
  quantity: z.number().int().min(1).max(20),
  selections: z
    .array(z.object({ customization_id: z.string().max(80), option_ids: z.array(z.string().max(80)).max(10) }))
    .max(10)
    .optional(),
});

export const checkoutSchema = z
  .object({
    idempotency_key: z.string().min(16).max(80),
    items: z.array(cartLineSchema).min(1, "Your cart is empty").max(50),
    customer_name: text(80).pipe(z.string().min(2, "Please enter your name")),
    customer_phone: indianMobile,
    customer_email: email,
    fulfilment: z.enum(["pickup", "delivery"]),
    address: optionalText(300),
    landmark: optionalText(120),
    notes: optionalText(500),
    coupon_code: z.string().max(24).optional().nullable().transform((v) => (v ? v.trim().toUpperCase() : null)),
  })
  .superRefine((v, ctx) => {
    if (v.fulfilment === "delivery" && (!v.address || v.address.length < 10))
      ctx.addIssue({ code: "custom", path: ["address"], message: "Please enter your full delivery address" });
  });
export type CheckoutInput = z.input<typeof checkoutSchema>;

export const verifyPaymentSchema = z.object({
  order_id: z.string().uuid(),
  razorpay_order_id: z.string().max(80),
  razorpay_payment_id: z.string().max(80),
  razorpay_signature: z.string().max(200),
});

export const reservationSchema = z.object({
  name: text(80).pipe(z.string().min(2, "Please enter your name")),
  phone: indianMobile,
  email,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a time"),
  guests: z.coerce.number().int().min(1).max(50),
  occasion: optionalText(60),
  requests: optionalText(500),
  website: z.string().max(0).optional(), // honeypot
});

export const contactSchema = z
  .object({
    name: text(80).pipe(z.string().min(2, "Please enter your name")),
    phone: z.string().optional().nullable().transform((v) => (v ? v : null)).pipe(indianMobile.nullable()),
    email,
    message: text(2000).pipe(z.string().min(5, "Please write a short message")),
    website: z.string().max(0).optional(),
  })
  .refine((v) => v.phone || v.email, { path: ["email"], message: "Add a phone number or email so we can reply" });

export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const k = issue.path.join(".") || "_";
    if (!out[k]) out[k] = issue.message;
  }
  return out;
}
