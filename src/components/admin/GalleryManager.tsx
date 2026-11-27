"use client";
import { useState } from "react";
import type { GalleryImage } from "@/lib/types";
import { ImageUpload } from "./ImageUpload";
import { useAdminAction } from "./useAdmin";

const CATS = ["interiors", "beverages", "food", "desserts", "experiences"] as const;

async function dims(url: string): Promise<{ width: number; height: number }> {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => res({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => res({ width: 1200, height: 1500 });
    img.src = url;
  });
}

export function GalleryManager({ images }: { images: GalleryImage[] }) {
  const { run, busy } = useAdminAction();
  const [newCat, setNewCat] = useState<(typeof CATS)[number]>("interiors");
  const move = (i: number, d: number) => {
    const ids = images.map((g) => g.id);
    [ids[i], ids[i + d]] = [ids[i + d], ids[i]];
    run("/api/admin/gallery", { order: ids }, "PUT");
  };
  return (
    <>
      <div className="mb-6 flex flex-wrap items-end gap-4 border border-oat bg-ivory p-4">
        <div className="field"><label htmlFor="newcat">Category</label>
          <select id="newcat" className="input w-auto" value={newCat} onChange={(e) => setNewCat(e.target.value as typeof newCat)}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
        </div>
        <ImageUpload folder="gallery" value={null} label="Add a photograph" onChange={async (url) => {
          if (!url) return;
          const d = await dims(url);
          run("/api/admin/gallery", { category: newCat, url, alt: `${newCat} at Love Over Coffee`, caption: null, sort_order: images.length, ...d }, "POST", "Photo added");
        }} />
      </div>
      <ul className="grid gap-3">
        {images.map((g, i) => (
          <li key={g.id} className="grid gap-3 border border-oat bg-ivory p-3 sm:grid-cols-[96px_1fr_auto] sm:items-center">
            <div className="h-24 w-24 overflow-hidden bg-oat">{g.url ? <img src={g.url} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-[10px] text-muted">Placeholder</span>}</div>
            <form className="grid gap-2 sm:grid-cols-3" onSubmit={(e) => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
              run("/api/admin/gallery", { ...g, category: f.category, alt: f.alt, caption: f.caption || null }, "POST", "Saved");
            }}>
              <select name="category" defaultValue={g.category} className="input" aria-label="Category">{CATS.map((c) => <option key={c}>{c}</option>)}</select>
              <input name="alt" defaultValue={g.alt} className="input" placeholder="Describe the photo (for accessibility)" aria-label="Alt text" required />
              <div className="flex gap-2"><input name="caption" defaultValue={g.caption ?? ""} className="input" placeholder="Caption" aria-label="Caption" /><button className="btn btn-dark min-h-[44px] px-3" disabled={busy}>Save</button></div>
              {!g.url && <div className="sm:col-span-3"><ImageUpload folder="gallery" value={null} label="Fill this placeholder" onChange={async (url) => url && run("/api/admin/gallery", { ...g, url, ...(await dims(url)) }, "POST", "Photo added")} /></div>}
            </form>
            <div className="flex gap-1 sm:flex-col">
              <button className="px-3 py-1" disabled={i === 0 || busy} onClick={() => move(i, -1)} aria-label="Move up">↑</button>
              <button className="px-3 py-1" disabled={i === images.length - 1 || busy} onClick={() => move(i, 1)} aria-label="Move down">↓</button>
              <button className="px-3 py-1 text-danger" onClick={() => confirm("Delete this photo?") && run(`/api/admin/gallery/${g.id}`, {}, "DELETE", "Deleted")} aria-label="Delete">✕</button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
