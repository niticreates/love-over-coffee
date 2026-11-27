"use client";
import clsx from "clsx";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatINR } from "@/lib/money";
import type { Category, Product, ProductCustomization } from "@/lib/types";
import { ImageUpload } from "./ImageUpload";
import { useAdminAction } from "./useAdmin";
import { Badge } from "./ui";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
const rid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}`;

export function MenuManager({ categories, products, canEdit }: { categories: Category[]; products: Product[]; canEdit: boolean }) {
  const { run, busy } = useAdminAction();
  const [editing, setEditing] = useState<Product | null>(null);
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState<"items" | "categories">("items");
  const blank = (): Product => ({
    id: "", slug: "", category_id: categories[0]?.id ?? "", name: "", description: "", price: null, is_veg: null, is_available: true, is_featured: false,
    image_url: null, image_alt: null, sort_order: products.length, customizations: [], verification: "verified",
  });
  const list = products.filter((p) => !filter || p.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="admin-pill-tabs" role="group" aria-label="Menu view">
          {(["items", "categories"] as const).map((t) => <button key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)} className="capitalize">{t}</button>)}
        </div>
        {tab === "items" && <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search items" className="input w-auto flex-1" aria-label="Search items" />}
        {canEdit && tab === "items" && <button className="btn btn-primary min-h-[44px]" onClick={() => setEditing(blank())}><Plus size={14} /> Add item</button>}
      </div>

      {tab === "categories" ? <CategoryManager categories={categories} products={products} canEdit={canEdit} /> : (
        <div className="grid gap-6">
          {categories.map((c) => {
            const items = list.filter((p) => p.category_id === c.id);
            if (!items.length) return null;
            return (
              <section key={c.id} className="admin-surface">
                <h2 className="border-b border-ink/8 bg-turquoise-soft/60 px-5 py-4 font-display text-2xl text-ink">{c.name} {!c.is_active && <Badge value="hidden" />}</h2>
                <ul className="divide-y divide-oat">
                  {items.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                      <div className="min-w-[200px] flex-1">
                        <p className="font-semibold">{p.name} {p.verification !== "verified" && <Badge value="owner_to_confirm" />}</p>
                        {p.source_note && <p className="text-xs text-muted">{p.source_note}</p>}
                      </div>
                      <span className={clsx("w-28 tabular-nums", p.price == null && "text-danger")}>{p.price == null ? "No price" : formatINR(p.price)}</span>
                      <label className="flex items-center gap-2"><input type="checkbox" checked={p.is_available} disabled={busy} onChange={(e) => run(`/api/admin/products/${p.id}`, { is_available: e.target.checked }, "PATCH", e.target.checked ? `${p.name} available` : `${p.name} marked unavailable`)} /> Available</label>
                      {canEdit && <label className="flex items-center gap-2"><input type="checkbox" checked={p.is_featured} disabled={busy} onChange={(e) => run(`/api/admin/products/${p.id}`, { is_featured: e.target.checked }, "PATCH")} /> Featured</label>}
                      {canEdit && <button className="btn btn-outline min-h-[36px] px-3" onClick={() => setEditing(p)}>Edit</button>}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {editing && (
        <ProductEditor
          product={editing} categories={categories} busy={busy}
          onClose={() => setEditing(null)}
          onSave={async (p, priceRupees) => {
            const { price: _p, source_note: _s, ...rest } = p;
            const ok = await run("/api/admin/products", { ...rest, id: p.id || undefined, slug: p.slug || slugify(p.name), price_rupees: priceRupees }, "POST", "Item saved");
            if (ok) setEditing(null);
          }}
          onDelete={async (p) => {
            if (!confirm(`Delete ${p.name}? This can't be undone.`)) return;
            const ok = await run(`/api/admin/products/${p.id}`, {}, "DELETE", "Item deleted");
            if (ok) setEditing(null);
          }}
        />
      )}
    </>
  );
}

function ProductEditor({ product, categories, busy, onClose, onSave, onDelete }: {
  product: Product; categories: Category[]; busy: boolean; onClose: () => void; onSave: (p: Product, priceRupees: number | null) => void; onDelete: (p: Product) => void;
}) {
  const [p, setP] = useState<Product>(product);
  const [price, setPrice] = useState(product.price == null ? "" : String(product.price / 100));
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((x) => ({ ...x, [k]: v }));
  const setCz = (i: number, cz: ProductCustomization | null) => setP((x) => ({ ...x, customizations: cz ? x.customizations.map((c, j) => (j === i ? cz : c)) : x.customizations.filter((_, j) => j !== i) }));
  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-navy/50 backdrop-blur-sm" onClick={onClose} />
      <form
        className="relative h-full w-full max-w-xl overflow-y-auto bg-ivory p-6 shadow-drawer sm:rounded-l-[28px] md:p-8"
        onSubmit={(e) => { e.preventDefault(); onSave(p, price.trim() === "" ? null : Number(price)); }}
        role="dialog" aria-modal="true" aria-label={p.id ? `Edit ${p.name}` : "New item"}
      >
        <h2 className="text-3xl">{p.id ? `Edit ${product.name}` : "New item"}</h2>
        <div className="mt-6 grid gap-4">
          <div className="field"><label htmlFor="pe-name">Name</label><input id="pe-name" className="input" value={p.name} required maxLength={120} onChange={(e) => set("name", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="field"><label htmlFor="pe-cat">Category</label><select id="pe-cat" className="input" value={p.category_id} onChange={(e) => set("category_id", e.target.value)}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="field"><label htmlFor="pe-price">Price (₹)</label><input id="pe-price" className="input" inputMode="decimal" value={price} placeholder="Leave blank if not set" onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))} /></div>
          </div>
          <div className="field"><label htmlFor="pe-desc">Description</label><textarea id="pe-desc" className="input" rows={3} maxLength={600} value={p.description ?? ""} onChange={(e) => set("description", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="field"><label htmlFor="pe-veg">Dietary mark</label>
              <select id="pe-veg" className="input" value={p.is_veg == null ? "" : p.is_veg ? "veg" : "nonveg"} onChange={(e) => set("is_veg", e.target.value === "" ? null : e.target.value === "veg")}>
                <option value="">Not shown</option><option value="veg">Vegetarian</option><option value="nonveg">Non-vegetarian</option>
              </select>
            </div>
            <div className="field"><label htmlFor="pe-slug">URL slug</label><input id="pe-slug" className="input" value={p.slug} placeholder={slugify(p.name)} onChange={(e) => set("slug", slugify(e.target.value))} /></div>
          </div>
          <div className="flex flex-wrap gap-5 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={p.is_available} onChange={(e) => set("is_available", e.target.checked)} /> Available</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={p.is_featured} onChange={(e) => set("is_featured", e.target.checked)} /> Featured on homepage</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={p.verification === "verified"} onChange={(e) => set("verification", e.target.checked ? "verified" : "owner_to_confirm")} /> Details checked by owner</label>
          </div>
          <ImageUpload folder="menu" value={p.image_url} onChange={(url) => setP((x) => ({ ...x, image_url: url, image_alt: url ? x.image_alt ?? x.name : null }))} />

          <div className="border-t border-oat pt-4">
            <div className="flex items-center justify-between"><p className="eyebrow text-turquoise-deep">Customisations</p>
              <button type="button" className="text-sm underline" onClick={() => set("customizations", [...p.customizations, { id: rid("cz"), name: "", required: false, max_select: 1, options: [{ id: rid("opt"), label: "", price_delta: 0 }] }])}>+ Add group</button>
            </div>
            {p.customizations.map((c, i) => (
              <div key={c.id} className="mt-3 grid gap-2 rounded-2xl border border-ink/10 bg-ivory p-3">
                <div className="flex gap-2">
                  <input className="input flex-1" placeholder="Group name, e.g. Milk" value={c.name} onChange={(e) => setCz(i, { ...c, name: e.target.value })} aria-label="Group name" />
                  <button type="button" className="px-2 text-danger" onClick={() => setCz(i, null)} aria-label="Remove group"><Trash2 size={16} /></button>
                </div>
                <div className="flex gap-4 text-xs">
                  <label className="flex items-center gap-1"><input type="checkbox" checked={c.required} onChange={(e) => setCz(i, { ...c, required: e.target.checked })} /> Required</label>
                  <label className="flex items-center gap-1">Max choices <input type="number" min={1} max={10} className="w-14 rounded-md border border-ink/15 px-1" value={c.max_select} onChange={(e) => setCz(i, { ...c, max_select: Number(e.target.value) || 1 })} /></label>
                </div>
                {c.options.map((o, j) => (
                  <div key={o.id} className="flex gap-2">
                    <input className="input flex-1" placeholder="Option" value={o.label} onChange={(e) => setCz(i, { ...c, options: c.options.map((x, k) => (k === j ? { ...x, label: e.target.value } : x)) })} aria-label="Option label" />
                    <input className="input w-28" inputMode="decimal" placeholder="+₹" value={o.price_delta ? String(o.price_delta / 100) : ""} onChange={(e) => setCz(i, { ...c, options: c.options.map((x, k) => (k === j ? { ...x, price_delta: Math.round(Number(e.target.value.replace(/[^0-9.]/g, "") || 0) * 100) } : x)) })} aria-label="Extra price" />
                    <button type="button" className="px-2 text-danger" disabled={c.options.length === 1} onClick={() => setCz(i, { ...c, options: c.options.filter((_, k) => k !== j) })} aria-label="Remove option"><Trash2 size={14} /></button>
                  </div>
                ))}
                <button type="button" className="justify-self-start text-xs underline" onClick={() => setCz(i, { ...c, options: [...c.options, { id: rid("opt"), label: "", price_delta: 0 }] })}>+ Add option</button>
              </div>
            ))}
          </div>
        </div>
        <div className="sticky bottom-0 -mx-6 mt-8 flex gap-3 border-t border-oat bg-ivory px-6 py-4 md:-mx-8 md:px-8">
          <button className="btn btn-primary" disabled={busy}>Save</button>
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          {p.id && <button type="button" className="btn ml-auto text-danger" onClick={() => onDelete(p)}>Delete</button>}
        </div>
      </form>
    </div>
  );
}

function CategoryManager({ categories, products, canEdit }: { categories: Category[]; products: Product[]; canEdit: boolean }) {
  const { run, busy } = useAdminAction();
  const [name, setName] = useState("");
  return (
    <div className="admin-surface">
      <ul className="divide-y divide-oat">
        {categories.map((c, i) => (
          <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
            <input className="input max-w-xs flex-1" defaultValue={c.name} disabled={!canEdit} aria-label="Category name" onBlur={(e) => e.target.value !== c.name && run("/api/admin/categories", { ...c, name: e.target.value }, "POST", "Category renamed")} />
            <span className="text-muted">{products.filter((p) => p.category_id === c.id).length} items</span>
            {canEdit && (
              <>
                <label className="flex items-center gap-2"><input type="checkbox" checked={c.is_active} disabled={busy} onChange={(e) => run("/api/admin/categories", { ...c, is_active: e.target.checked }, "POST")} /> Visible</label>
                <button className="px-2" disabled={i === 0 || busy} aria-label="Move up" onClick={async () => { const prev = categories[i - 1]; await run("/api/admin/categories", { ...c, sort_order: prev.sort_order }, "POST"); await run("/api/admin/categories", { ...prev, sort_order: c.sort_order }, "POST"); }}>↑</button>
                <button className="px-2" disabled={i === categories.length - 1 || busy} aria-label="Move down" onClick={async () => { const next = categories[i + 1]; await run("/api/admin/categories", { ...c, sort_order: next.sort_order }, "POST"); await run("/api/admin/categories", { ...next, sort_order: c.sort_order }, "POST"); }}>↓</button>
                <button className="ml-auto px-2 text-danger" aria-label={`Delete ${c.name}`} onClick={() => confirm(`Delete category ${c.name}?`) && run(`/api/admin/categories/${c.id}`, {}, "DELETE", "Category deleted")}><Trash2 size={16} /></button>
              </>
            )}
          </li>
        ))}
      </ul>
      {canEdit && (
        <form className="flex gap-2 border-t border-oat p-4" onSubmit={async (e) => { e.preventDefault(); if (!name.trim()) return; const ok = await run("/api/admin/categories", { slug: slugify(name), name: name.trim(), sort_order: categories.length, is_active: true }, "POST", "Category added"); if (ok) setName(""); }}>
          <input className="input flex-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" aria-label="New category name" />
          <button className="btn btn-dark min-h-[44px]" disabled={busy}>Add</button>
        </form>
      )}
    </div>
  );
}
