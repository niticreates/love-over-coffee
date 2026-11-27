"use client";
import { useState } from "react";
import type { SiteContent } from "@/lib/types";
import { ImageUpload } from "./ImageUpload";
import { useAdminAction } from "./useAdmin";
import { Card } from "./ui";

export function ContentEditor({ content }: { content: SiteContent }) {
  const [c, setC] = useState(content);
  const { run, busy } = useAdminAction();
  const set = <K extends keyof SiteContent>(k: K, v: SiteContent[K]) => setC((x) => ({ ...x, [k]: v }));
  const text = (k: keyof SiteContent, label: string, rows = 1) => (
    <div className="field">
      <label htmlFor={`c-${k}`}>{label}</label>
      {rows > 1 ? <textarea id={`c-${k}`} rows={rows} className="input" value={(c[k] as string) ?? ""} onChange={(e) => set(k, e.target.value as never)} />
        : <input id={`c-${k}`} className="input" value={(c[k] as string) ?? ""} onChange={(e) => set(k, e.target.value as never)} />}
    </div>
  );
  return (
    <form className="grid gap-6" onSubmit={(e) => { e.preventDefault(); run("/api/admin/settings", { content: { ...c, announcement: c.announcement?.trim() || null } }, "PATCH", "Content saved"); }}>
      <Card title="Promotional banner">{text("announcement", "Banner text (leave empty to hide)")}</Card>
      <Card title="Homepage hero">
        <div className="grid gap-4">
          {text("hero_headline", "Headline")}
          {text("hero_subhead", "Supporting text", 3)}
          <ImageUpload folder="site" label="Hero photograph (wide, at least 2400px)" value={c.hero_image_url} onChange={(url) => set("hero_image_url", url)} />
        </div>
      </Card>
      <Card title="Brand introduction"><div className="grid gap-4">{text("intro_headline", "Headline")}{text("intro_body", "Text", 4)}</div></Card>
      <Card title="Reservation section"><div className="grid gap-4">{text("reservation_headline", "Headline")}{text("reservation_body", "Text", 3)}</div></Card>
      <Card title="Our Story page">
        <div className="grid gap-6">
          {c.story_sections.map((s, i) => (
            <div key={s.id} className="grid gap-3 border-b border-oat pb-6 last:border-0">
              <input className="input font-semibold" value={s.title} aria-label="Section title" onChange={(e) => set("story_sections", c.story_sections.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
              <textarea className="input" rows={4} value={s.body} aria-label="Section text" onChange={(e) => set("story_sections", c.story_sections.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!s.needs_owner_review} onChange={(e) => set("story_sections", c.story_sections.map((x, j) => (j === i ? { ...x, needs_owner_review: !e.target.checked } : x)))} /> Approved by owner</label>
            </div>
          ))}
        </div>
      </Card>
      <div className="sticky bottom-0 border-t border-oat bg-paper py-4"><button className="btn btn-primary" disabled={busy}>Save content</button></div>
    </form>
  );
}
