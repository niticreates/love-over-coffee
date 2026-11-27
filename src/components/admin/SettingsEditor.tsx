"use client";
import { useState } from "react";
import { DAY_NAMES } from "@/lib/hours";
import type { WebsiteSettings } from "@/lib/types";
import { useAdminAction } from "./useAdmin";
import { Card } from "./ui";

const num = (v: string) => (v.trim() === "" ? null : Number(v));
const rupees = (paise: number | null) => (paise == null ? "" : String(paise / 100));
const toPaise = (v: string) => (v.trim() === "" ? null : Math.round(Number(v) * 100));

export function SettingsEditor({ settings, isOwner, integrations }: { settings: WebsiteSettings; isOwner: boolean; integrations: Record<string, string> }) {
  const { run, busy } = useAdminAction();
  const [b, setB] = useState(settings.business);
  const [c, setC] = useState(settings.commerce);
  const [r, setR] = useState(settings.reservations);
  const [n, setN] = useState(settings.notifications);
  const hours = b.hours ?? [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: null as string | null, close: null as string | null }));
  const lock = !isOwner;

  return (
    <div className="grid gap-6">
      {!isOwner && <p className="border border-oat bg-ivory p-4 text-sm">Business, payment and notification settings can only be changed by the owner. You can edit reservation capacity.</p>}

      <Card title="Business information" action={<Save disabled={busy || lock} onClick={() => run("/api/admin/settings", { business: { ...b, hours: b.hours } }, "PATCH", "Business info saved")} />}>
        <fieldset disabled={lock} className="grid gap-4 md:grid-cols-2">
          <Text label="Business name" value={b.name} onChange={(v) => setB({ ...b, name: v })} />
          <Text label="Phone (display)" value={b.phone_display} onChange={(v) => setB({ ...b, phone_display: v })} />
          <Text label="Phone (international, e.g. +919329697769)" value={b.phone_e164} onChange={(v) => setB({ ...b, phone_e164: v.replace(/\s/g, "") })} />
          <Text label="WhatsApp number (blank to hide)" value={b.whatsapp_e164 ?? ""} onChange={(v) => setB({ ...b, whatsapp_e164: v.replace(/\s/g, "") || null })} />
          <Text label="Address line 1" value={b.address_lines[0] ?? ""} onChange={(v) => setB({ ...b, address_lines: [v, ...b.address_lines.slice(1)] })} />
          <Text label="Address line 2" value={b.address_lines[1] ?? ""} onChange={(v) => setB({ ...b, address_lines: [b.address_lines[0] ?? "", v].filter((x, i) => i === 0 || x) })} />
          <Text label="Public email (optional)" value={b.email ?? ""} onChange={(v) => setB({ ...b, email: v || null })} />
          <Text label="Official Instagram URL" value={b.instagram_url ?? ""} onChange={(v) => setB({ ...b, instagram_url: v || null })} />
          <Text label="Google Maps link" value={b.maps_place_url} onChange={(v) => setB({ ...b, maps_place_url: v })} />
          <Text label="Map search text (used for the embedded map)" value={b.maps_query} onChange={(v) => setB({ ...b, maps_query: v })} />
          <Text label="Latitude (from Google Maps pin)" value={b.geo?.lat?.toString() ?? ""} onChange={(v) => setB({ ...b, geo: v ? { lat: Number(v), lng: b.geo?.lng ?? 0 } : null })} />
          <Text label="Longitude" value={b.geo?.lng?.toString() ?? ""} onChange={(v) => setB({ ...b, geo: b.geo || v ? { lat: b.geo?.lat ?? 0, lng: Number(v) } : null })} />
          <Text label="FSSAI licence no. (shown in footer)" value={b.fssai ?? ""} onChange={(v) => setB({ ...b, fssai: v || null })} />
        </fieldset>

        <fieldset disabled={lock} className="mt-6 border-t border-oat pt-5">
          <legend className="eyebrow text-walnut">Opening hours</legend>
          <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={b.hours != null} onChange={(e) => setB({ ...b, hours: e.target.checked ? hours : null })} /> Publish opening hours</label>
          {b.hours && (
            <div className="mt-3 grid gap-2">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                const h = hours.find((x) => x.day === d)!;
                const upd = (patch: Partial<typeof h>) => setB({ ...b, hours: hours.map((x) => (x.day === d ? { ...x, ...patch } : x)) });
                return (
                  <div key={d} className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="w-24">{DAY_NAMES[d]}</span>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={!h.open} onChange={(e) => upd(e.target.checked ? { open: null, close: null } : { open: "10:00", close: "22:00" })} /> Closed</label>
                    {h.open && <><input type="time" className="input w-auto" value={h.open} onChange={(e) => upd({ open: e.target.value })} aria-label={`${DAY_NAMES[d]} opens`} /> – <input type="time" className="input w-auto" value={h.close ?? ""} onChange={(e) => upd({ close: e.target.value })} aria-label={`${DAY_NAMES[d]} closes`} /></>}
                  </div>
                );
              })}
              <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={b.hours_verification === "verified"} onChange={(e) => setB({ ...b, hours_verification: e.target.checked ? "verified" : "owner_to_confirm" })} /> These hours are confirmed (shown to search engines)</label>
            </div>
          )}
        </fieldset>
      </Card>

      <Card title="Online ordering, tax & delivery" action={<Save disabled={busy || lock} onClick={() => run("/api/admin/settings", { commerce: c }, "PATCH", "Ordering settings saved")} />}>
        <fieldset disabled={lock} className="grid gap-4 md:grid-cols-2">
          <Check label="Accept online orders" checked={c.ordering_enabled} onChange={(v) => setC({ ...c, ordering_enabled: v })} />
          <Check label="Offer delivery (website-managed)" checked={c.delivery_enabled} onChange={(v) => setC({ ...c, delivery_enabled: v })} />
          <Text label="GST rate (%) — confirm with your accountant" value={c.tax_bps == null ? "" : String(c.tax_bps / 100)} onChange={(v) => setC({ ...c, tax_bps: v === "" ? null : Math.round(Number(v) * 100) })} />
          <Check label="Menu prices already include GST" checked={c.tax_inclusive} onChange={(v) => setC({ ...c, tax_inclusive: v })} />
          <Text label="Delivery charge (₹)" value={rupees(c.delivery_fee)} onChange={(v) => setC({ ...c, delivery_fee: toPaise(v) ?? 0 })} />
          <Text label="Free delivery above (₹, blank = never)" value={rupees(c.free_delivery_above)} onChange={(v) => setC({ ...c, free_delivery_above: toPaise(v) })} />
          <Text label="Minimum order value (₹)" value={rupees(c.min_order_value)} onChange={(v) => setC({ ...c, min_order_value: toPaise(v) ?? 0 })} />
        </fieldset>
        <dl className="mt-5 grid gap-1 border-t border-oat pt-4 text-sm">
          <p className="eyebrow mb-2 text-walnut">Payment gateway</p>
          <div className="flex justify-between"><dt>Razorpay</dt><dd>{integrations.payments}</dd></div>
          <div className="flex justify-between"><dt>Razorpay webhook</dt><dd>{integrations.webhook}</dd></div>
          <p className="mt-2 text-xs text-muted">API keys are stored as server environment variables, never in the database or browser. See docs/INTEGRATIONS.md.</p>
        </dl>
      </Card>

      <Card title="Reservations" action={<Save disabled={busy} onClick={() => run("/api/admin/settings", { reservations: r }, "PATCH", "Reservation settings saved")} />}>
        <div className="grid gap-4 md:grid-cols-3">
          <Check label="Accept reservation requests" checked={r.enabled} onChange={(v) => setR({ ...r, enabled: v })} />
          <Text label="Max guests seated at once (blank = approve manually)" value={r.max_covers_per_slot?.toString() ?? ""} onChange={(v) => setR({ ...r, max_covers_per_slot: num(v) })} />
          <Text label="Largest online party size" value={String(r.max_guests_per_booking)} onChange={(v) => setR({ ...r, max_guests_per_booking: Number(v) || 1 })} />
          <div className="field"><label htmlFor="slot">Slot interval</label><select id="slot" className="input" value={r.slot_minutes} onChange={(e) => setR({ ...r, slot_minutes: Number(e.target.value) as 15 | 30 | 60 })}><option value={15}>15 min</option><option value={30}>30 min</option><option value={60}>60 min</option></select></div>
          <Text label="Typical table time (minutes)" value={String(r.seating_minutes)} onChange={(v) => setR({ ...r, seating_minutes: Number(v) || 90 })} />
          <Text label="Minimum notice (minutes)" value={String(r.min_lead_minutes)} onChange={(v) => setR({ ...r, min_lead_minutes: Number(v) || 0 })} />
          <Text label="Book up to (days ahead)" value={String(r.max_days_ahead)} onChange={(v) => setR({ ...r, max_days_ahead: Number(v) || 30 })} />
          <Text label="Last booking before close (minutes)" value={String(r.last_booking_before_close_minutes)} onChange={(v) => setR({ ...r, last_booking_before_close_minutes: Number(v) || 0 })} />
        </div>
      </Card>

      <Card title="Notifications" action={<Save disabled={busy || lock} onClick={() => run("/api/admin/settings", { notifications: n }, "PATCH", "Notification settings saved")} />}>
        <fieldset disabled={lock} className="grid gap-4 md:grid-cols-2">
          <Check label={`Send emails (${integrations.email})`} checked={n.email_enabled} onChange={(v) => setN({ ...n, email_enabled: v })} />
          <Check label={`Send WhatsApp messages (${integrations.whatsapp})`} checked={n.whatsapp_enabled} onChange={(v) => setN({ ...n, whatsapp_enabled: v })} />
          <Text label="Staff emails for new orders & bookings (comma-separated)" value={n.admin_emails.join(", ")} onChange={(v) => setN({ ...n, admin_emails: v.split(",").map((x) => x.trim()).filter(Boolean) })} />
          <Text label="Staff WhatsApp numbers (+91…, comma-separated)" value={n.admin_whatsapp.join(", ")} onChange={(v) => setN({ ...n, admin_whatsapp: v.split(",").map((x) => x.trim().replace(/\s/g, "")).filter(Boolean) })} />
        </fieldset>
      </Card>
    </div>
  );
}

function Save({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return <button type="button" className="btn btn-dark min-h-[36px] px-4" disabled={disabled} onClick={onClick}>Save</button>;
}
function Text({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = label.replace(/\W+/g, "-").toLowerCase();
  return <div className="field"><label htmlFor={id}>{label}</label><input id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)} /></div>;
}
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label className="flex min-h-[48px] items-center gap-3 text-sm"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /> {label}</label>;
}
