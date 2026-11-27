"use client";
import { useState } from "react";
import { PlatformLogo } from "@/components/PlatformCard";
import { PLATFORM_BRANDS, PLATFORM_TYPES, type BusinessSettings, type ExternalPlatform, type WhatsAppContext } from "@/lib/types";
import { whatsappLink } from "@/lib/whatsapp";
import { ImageUpload } from "./ImageUpload";
import { Badge, Card } from "./ui";
import { useAdminAction } from "./useAdmin";

const TYPE_LABEL: Record<string, string> = { reservation: "Reservation", ordering: "Food ordering", location: "Location" };
const BRAND_LABEL: Record<string, string> = { district: "District", zomato: "Zomato", swiggy: "Swiggy", google_maps: "Google Maps", other: "Other" };
const MSG_LABEL: Record<WhatsAppContext, string> = {
  general: "General enquiry (floating button)",
  reservation: "Table reservation enquiry",
  ordering: "Order enquiry",
  group: "Group visit enquiry",
};

type Draft = Omit<ExternalPlatform, "created_at" | "updated_at" | "id"> & { id?: string };
const blank = (order: number): Draft => ({
  platform_name: "", platform_type: "reservation", platform_url: null, platform_logo: null, brand: "other",
  description: null, is_active: false, is_verified: false, verification_note: null, display_order: order,
});
const strip = ({ created_at: _c, updated_at: _u, ...rest }: ExternalPlatform): Draft => rest;

function liveState(p: Draft) {
  if (!p.platform_url) return { v: "hidden", why: "No link yet" };
  if (!p.is_active) return { v: "hidden", why: "Disabled" };
  if (!p.is_verified) return { v: "owner_to_confirm", why: "Not verified for this outlet" };
  return { v: "verified", why: "Live on the website" };
}

export function IntegrationsManager({ platforms, business }: { platforms: ExternalPlatform[]; business: BusinessSettings }) {
  const { run, busy } = useAdminAction();
  const [adding, setAdding] = useState(false);
  const [wa, setWa] = useState({ whatsapp_e164: business.whatsapp_e164, whatsapp_messages: business.whatsapp_messages });

  const move = (i: number, d: number) => {
    const ids = platforms.map((p) => p.id);
    [ids[i], ids[i + d]] = [ids[i + d], ids[i]];
    run("/api/admin/platforms", { order: ids }, "PUT");
  };

  return (
    <div className="grid gap-6">
      <p className="max-w-3xl text-sm leading-relaxed text-muted">
        Links shown on the Book &amp; Order, Reserve and Menu pages. A link only appears publicly when it is <strong>enabled</strong>, has a URL and is marked
        <strong> verified</strong> — meaning someone has opened it and checked it is the Vijay Nagar outlet (address and phone match), not another branch or the platform&apos;s homepage.
      </p>

      <Card title="Booking & ordering platforms" action={!adding && <button className="btn btn-dark min-h-[38px] px-4" onClick={() => setAdding(true)}>Add platform</button>}>
        <ul className="grid gap-4">
          {adding && <li><PlatformForm initial={blank(platforms.length)} busy={busy} onCancel={() => setAdding(false)} onSave={(d) => run("/api/admin/platforms", d, "POST", "Platform added").then((ok) => ok && setAdding(false))} /></li>}
          {platforms.map((p, i) => (
            <li key={p.id} className="grid gap-3 border border-oat p-4 sm:grid-cols-[1fr_auto]">
              <PlatformForm initial={strip(p)} busy={busy} onSave={(d) => run("/api/admin/platforms", d, "POST", "Saved")} />
              <div className="flex gap-1 sm:flex-col">
                <button className="px-3 py-1" disabled={i === 0 || busy} onClick={() => move(i, -1)} aria-label={`Move ${p.platform_name} up`}>↑</button>
                <button className="px-3 py-1" disabled={i === platforms.length - 1 || busy} onClick={() => move(i, 1)} aria-label={`Move ${p.platform_name} down`}>↓</button>
                <button className="px-3 py-1 text-danger" onClick={() => confirm(`Delete ${p.platform_name}?`) && run(`/api/admin/platforms/${p.id}`, {}, "DELETE", "Deleted")} aria-label={`Delete ${p.platform_name}`}>✕</button>
              </div>
            </li>
          ))}
          {!platforms.length && !adding && <li className="text-sm text-muted">No platforms yet.</li>}
        </ul>
      </Card>

      <Card title="WhatsApp" action={<button className="btn btn-dark min-h-[38px] px-4" disabled={busy} onClick={() => run("/api/admin/whatsapp", wa, "PATCH", "WhatsApp settings saved")}>Save</button>}>
        <div className="grid gap-4">
          <div className="field max-w-sm">
            <label htmlFor="wa-num">WhatsApp number (international format; blank hides all WhatsApp buttons)</label>
            <input id="wa-num" className="input" value={wa.whatsapp_e164 ?? ""} placeholder="+919329697769" onChange={(e) => setWa({ ...wa, whatsapp_e164: e.target.value.replace(/\s/g, "") || null })} />
          </div>
          {(Object.keys(MSG_LABEL) as WhatsAppContext[]).map((k) => (
            <div className="field" key={k}>
              <label htmlFor={`wa-${k}`}>{MSG_LABEL[k]}</label>
              <textarea id={`wa-${k}`} rows={2} maxLength={300} className="input" value={wa.whatsapp_messages[k]} onChange={(e) => setWa({ ...wa, whatsapp_messages: { ...wa.whatsapp_messages, [k]: e.target.value } })} />
            </div>
          ))}
          {whatsappLink(wa, "general") && (
            <p className="text-xs text-muted">Test link: <a className="link-underline break-all" href={whatsappLink(wa, "general")!} target="_blank" rel="noopener noreferrer">{whatsappLink(wa, "general")}</a></p>
          )}
          <p className="text-xs text-muted">The website always says WhatsApp enquiries need staff confirmation — they are never shown as confirmed bookings or orders.</p>
        </div>
      </Card>
    </div>
  );
}

function PlatformForm({ initial, busy, onSave, onCancel }: { initial: Draft; busy: boolean; onSave: (d: Draft) => void; onCancel?: () => void }) {
  const [d, setD] = useState<Draft>(initial);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const state = liveState(d);
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ ...d, platform_url: d.platform_url?.trim() || null, description: d.description?.trim() || null, verification_note: d.verification_note?.trim() || null });
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <PlatformLogo p={d} />
        <strong className="font-display text-2xl">{d.platform_name || "New platform"}</strong>
        <Badge value={state.v} /><span className="text-xs text-muted">{state.why}</span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="field"><label>Name</label><input className="input" required maxLength={60} value={d.platform_name} onChange={(e) => set("platform_name", e.target.value)} /></div>
        <div className="field"><label>Category</label>
          <select className="input" value={d.platform_type} onChange={(e) => set("platform_type", e.target.value as Draft["platform_type"])}>{PLATFORM_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}</select>
        </div>
        <div className="field"><label>Logo style</label>
          <select className="input" value={d.brand} onChange={(e) => set("brand", e.target.value as Draft["brand"])}>{PLATFORM_BRANDS.map((t) => <option key={t} value={t}>{BRAND_LABEL[t]}</option>)}</select>
        </div>
        <div className="field md:col-span-3"><label>Link to the Vijay Nagar listing (https://…)</label>
          <input className="input" type="url" inputMode="url" maxLength={500} placeholder="https://" value={d.platform_url ?? ""} onChange={(e) => setD((x) => ({ ...x, platform_url: e.target.value || null, is_verified: e.target.value === initial.platform_url ? initial.is_verified : false }))} />
        </div>
        <div className="field md:col-span-3"><label>Short description</label><input className="input" maxLength={200} value={d.description ?? ""} onChange={(e) => set("description", e.target.value)} /></div>
        <div className="field md:col-span-2"><label>Verification note (who checked, when, what matched)</label><input className="input" maxLength={300} value={d.verification_note ?? ""} onChange={(e) => set("verification_note", e.target.value)} /></div>
        <div className="flex flex-col justify-end gap-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={d.is_active} onChange={(e) => set("is_active", e.target.checked)} /> Enabled</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={d.is_verified} disabled={!d.platform_url} onChange={(e) => set("is_verified", e.target.checked)} /> Verified for this outlet</label>
        </div>
      </div>
      <ImageUpload folder="platforms" value={d.platform_logo} label="Official logo (optional — otherwise a styled tile is shown)" onChange={(url) => set("platform_logo", url)} />
      <div className="flex gap-2">
        <button className="btn btn-dark min-h-[40px] px-4" disabled={busy}>Save</button>
        {onCancel && <button type="button" className="btn min-h-[40px] px-4" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
