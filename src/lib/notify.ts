// Notifications: transactional email (Resend) and WhatsApp (Meta Cloud API, approved templates).
// Each send is logged to notification_logs. A missing integration is logged as "skipped",
// never thrown — a notification failure must not fail an order or reservation.
import "server-only";
import { demoMode, env } from "./config";
import { formatINR } from "./money";
import { getStore } from "./store";
import type { Order, Reservation, WebsiteSettings } from "./types";

type Template =
  | "order_placed_customer"
  | "order_placed_admin"
  | "order_status_customer"
  | "reservation_requested_customer"
  | "reservation_requested_admin"
  | "reservation_confirmed_customer"
  | "reservation_rejected_customer"
  | "reservation_cancelled_customer"
  | "reservation_reminder_customer";

const STATUS_COPY: Record<string, string> = {
  confirmed: "has been confirmed by the café",
  preparing: "is being prepared",
  ready_for_pickup: "is ready for pickup",
  out_for_delivery: "is out for delivery",
  completed: "is complete — thank you!",
  cancelled: "has been cancelled",
};

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function layout(title: string, body: string, s: WebsiteSettings) {
  return `<!doctype html><html><body style="margin:0;background:#F2EBDD;font-family:Helvetica,Arial,sans-serif;color:#292720">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#F8F4EC;border:1px solid #E7DCCB">
<tr><td style="padding:28px 32px;border-bottom:1px solid #E7DCCB;font-family:Georgia,serif;letter-spacing:.2em;font-size:13px">LOVE OVER COFFEE</td></tr>
<tr><td style="padding:32px"><h1 style="font-family:Georgia,serif;font-weight:normal;font-size:28px;margin:0 0 16px">${esc(title)}</h1>${body}</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #E7DCCB;font-size:12px;color:#6B6457">${esc(s.business.address_lines.join(", "))}, ${esc(s.business.city)} · ${esc(s.business.phone_display)}</td></tr>
</table></td></tr></table></body></html>`;
}

function orderTable(o: Order) {
  const rows = o.items
    .map((i) => `<tr><td style="padding:6px 0">${i.quantity} × ${esc(i.name)}${i.selections.length ? `<br><span style="color:#6B6457;font-size:12px">${esc(i.selections.map((s) => s.option).join(", "))}</span>` : ""}</td><td align="right">${formatINR(i.line_total)}</td></tr>`)
    .join("");
  const line = (l: string, v: number) => (v ? `<tr><td style="color:#6B6457">${l}</td><td align="right">${formatINR(v)}</td></tr>` : "");
  return `<table width="100%" style="font-size:14px;border-collapse:collapse">${rows}
<tr><td colspan="2" style="border-top:1px solid #E7DCCB;padding-top:8px"></td></tr>
${line("Subtotal", o.subtotal)}${o.discount ? `<tr><td style="color:#6B6457">Discount</td><td align="right">−${formatINR(o.discount)}</td></tr>` : ""}${line("Taxes", o.tax)}${line("Delivery", o.delivery_fee)}
<tr><td style="padding-top:8px"><b>Total</b></td><td align="right" style="padding-top:8px"><b>${formatINR(o.total)}</b></td></tr></table>`;
}

async function sendEmail(to: string, subject: string, html: string, template: Template) {
  const store = getStore();
  if (demoMode()) {
    await store.logNotification({ channel: "email", template, recipient: to, status: "skipped", detail: "Demo mode: notifications are off" });
    return;
  }
  if (!env.resendKey || !env.emailFrom) {
    await store.logNotification({ channel: "email", template, recipient: to, status: "skipped", detail: "Resend not configured" });
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.emailFrom, to: [to], subject, html }),
    });
    await store.logNotification({ channel: "email", template, recipient: to, status: res.ok ? "sent" : "failed", detail: res.ok ? null : `HTTP ${res.status}` });
  } catch (e) {
    await store.logNotification({ channel: "email", template, recipient: to, status: "failed", detail: String(e).slice(0, 200) });
  }
}

/**
 * WhatsApp Business messages outside a 24h customer window must use pre-approved templates.
 * Template names below must be created and approved in Meta Business Manager first
 * (see docs/INTEGRATIONS.md). Parameters are positional body variables.
 */
async function sendWhatsApp(toE164: string, template: Template, params: string[]) {
  const store = getStore();
  if (demoMode()) {
    await store.logNotification({ channel: "whatsapp", template, recipient: toE164, status: "skipped", detail: "Demo mode: notifications are off" });
    return;
  }
  if (!env.whatsappToken || !env.whatsappPhoneNumberId) {
    await store.logNotification({ channel: "whatsapp", template, recipient: toE164, status: "skipped", detail: "WhatsApp not configured" });
    return;
  }
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${env.whatsappPhoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.whatsappToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toE164.replace("+", ""),
        type: "template",
        template: { name: template, language: { code: "en" }, components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }] },
      }),
    });
    await store.logNotification({ channel: "whatsapp", template, recipient: toE164, status: res.ok ? "sent" : "failed", detail: res.ok ? null : `HTTP ${res.status}` });
  } catch (e) {
    await store.logNotification({ channel: "whatsapp", template, recipient: toE164, status: "failed", detail: String(e).slice(0, 200) });
  }
}

async function fanOut(jobs: Promise<unknown>[]) {
  await Promise.allSettled(jobs);
}

const statusUrl = (path: string) => `${env.siteUrl}${path}`;

export async function notifyOrderPlaced(o: Order) {
  const s = await getStore().getSettings();
  const n = s.notifications;
  const link = statusUrl(`/order/${o.public_token}`);
  const jobs: Promise<unknown>[] = [];
  if (n.email_enabled && o.customer_email)
    jobs.push(sendEmail(o.customer_email, `We've received your order ${o.reference}`, layout("Order received", `<p>Thank you, ${esc(o.customer_name)}. Your payment was successful and your order <b>${o.reference}</b> has been sent to the café. We'll update you as soon as the café confirms it.</p>${orderTable(o)}<p><a href="${link}" style="color:#8F4F33">Track your order</a></p>`, s), "order_placed_customer"));
  if (n.whatsapp_enabled) jobs.push(sendWhatsApp(o.customer_phone, "order_placed_customer", [o.customer_name, o.reference, formatINR(o.total), link]));
  for (const a of n.admin_emails)
    jobs.push(sendEmail(a, `New ${o.fulfilment} order ${o.reference} · ${formatINR(o.total)}`, layout(`New order ${o.reference}`, `<p><b>${esc(o.customer_name)}</b> · ${esc(o.customer_phone)}<br>${o.fulfilment === "delivery" ? `Delivery to: ${esc(o.address ?? "")} ${o.landmark ? `(${esc(o.landmark)})` : ""}` : "Pickup"}</p>${o.notes ? `<p>Note: ${esc(o.notes)}</p>` : ""}${orderTable(o)}<p><a href="${statusUrl("/admin/orders")}">Open in dashboard</a></p>`, s), "order_placed_admin"));
  if (n.whatsapp_enabled) for (const a of n.admin_whatsapp) jobs.push(sendWhatsApp(a, "order_placed_admin", [o.reference, o.customer_name, formatINR(o.total), o.fulfilment]));
  await fanOut(jobs);
}

export async function notifyOrderStatus(o: Order) {
  const copy = STATUS_COPY[o.status];
  if (!copy) return;
  const s = await getStore().getSettings();
  const link = statusUrl(`/order/${o.public_token}`);
  const jobs: Promise<unknown>[] = [];
  if (s.notifications.email_enabled && o.customer_email)
    jobs.push(sendEmail(o.customer_email, `Order ${o.reference} ${copy}`, layout("Order update", `<p>Your order <b>${o.reference}</b> ${copy}.</p><p><a href="${link}" style="color:#8F4F33">View order</a></p>`, s), "order_status_customer"));
  if (s.notifications.whatsapp_enabled) jobs.push(sendWhatsApp(o.customer_phone, "order_status_customer", [o.reference, copy, link]));
  await fanOut(jobs);
}

const fmtDate = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const fmtTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

export async function notifyReservation(r: Reservation, kind: "requested" | "confirmed" | "rejected" | "cancelled" | "reminder") {
  const s = await getStore().getSettings();
  const n = s.notifications;
  const when = `${fmtDate(r.date)} at ${fmtTime(r.time)}`;
  const link = statusUrl(`/reservation/${r.public_token}`);
  const copy = {
    requested: ["Reservation request received", `We've received your request for ${r.guests} on ${when}. This is not yet confirmed — the café will confirm shortly.`],
    confirmed: ["Your table is confirmed", `Your table for ${r.guests} on ${when} is confirmed. We look forward to seeing you.`],
    rejected: ["About your reservation request", `We're sorry — we can't accommodate ${r.guests} on ${when}. Please choose another time or call us.`],
    cancelled: ["Reservation cancelled", `Your reservation for ${when} has been cancelled.`],
    reminder: ["See you soon", `A reminder of your table for ${r.guests} on ${when}.`],
  }[kind];
  const template = `reservation_${kind}_customer` as Template;
  const jobs: Promise<unknown>[] = [];
  if (n.email_enabled && r.email)
    jobs.push(sendEmail(r.email, `${copy[0]} · ${r.reference}`, layout(copy[0], `<p>Hi ${esc(r.name)},</p><p>${copy[1]}</p><p>Reference: <b>${r.reference}</b></p><p><a href="${link}" style="color:#8F4F33">View or request changes</a></p>`, s), template));
  if (n.whatsapp_enabled) jobs.push(sendWhatsApp(r.phone, template, [r.name, when, r.reference, link]));
  if (kind === "requested") {
    for (const a of n.admin_emails)
      jobs.push(sendEmail(a, `Table request ${r.reference}: ${r.guests} · ${when}`, layout("New reservation request", `<p><b>${esc(r.name)}</b> · ${esc(r.phone)}<br>${r.guests} guests · ${when}${r.occasion ? `<br>Occasion: ${esc(r.occasion)}` : ""}</p>${r.requests ? `<p>${esc(r.requests)}</p>` : ""}<p><a href="${statusUrl("/admin/reservations")}">Approve or decline</a></p>`, s), "reservation_requested_admin"));
    if (n.whatsapp_enabled) for (const a of n.admin_whatsapp) jobs.push(sendWhatsApp(a, "reservation_requested_admin", [r.reference, r.name, String(r.guests), when]));
  }
  await fanOut(jobs);
}
