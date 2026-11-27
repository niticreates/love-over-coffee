"use client";
import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

export function ImageUpload({ folder, value, onChange, label = "Photo" }: { folder: string; value: string | null; onChange: (url: string | null) => void; label?: string }) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  return (
    <div className="field">
      <label>{label}</label>
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-ink/10 bg-turquoise-soft">
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-[10px] text-muted">None</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="btn btn-outline min-h-[38px] cursor-pointer px-3">
            {busy ? "Uploading…" : value ? "Replace" : "Upload"}
            <input
              type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={busy}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setBusy(true);
                const fd = new FormData();
                fd.append("file", file);
                fd.append("folder", folder);
                const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
                const data = await res.json().catch(() => ({}));
                setBusy(false);
                if (!res.ok) return toast(data.error?.message ?? "Upload failed", "error");
                onChange(data.url);
              }}
            />
          </label>
          {value && <button type="button" className="btn min-h-[38px] px-3 text-danger" onClick={() => onChange(null)}>Remove</button>}
        </div>
      </div>
      <p className="text-xs text-muted">Use the café&apos;s own photographs. JPG/PNG/WebP, under 8 MB; images are optimised automatically.</p>
    </div>
  );
}
