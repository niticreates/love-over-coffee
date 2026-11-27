"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { postJSON } from "./api";

export function ReservationActions({ token }: { token: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "modify" | "confirmCancel">("idle");
  const [msg, setMsg] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(action: "cancel" | "modify") {
    setBusy(true);
    const r = await postJSON<{ message?: string }>(`/api/reservations/${token}`, { action, message: msg });
    setBusy(false);
    if (!r.ok) return setResult(r.error.message);
    setResult(action === "cancel" ? "Your reservation has been cancelled." : r.data.message ?? "Request sent.");
    setMode("idle");
    router.refresh();
  }

  return (
    <div className="mt-10 border-t border-oat pt-8">
      {result && <p className="mb-6 text-walnut" role="status">{result}</p>}
      {mode === "modify" ? (
        <div className="grid gap-3">
          <label htmlFor="change" className="eyebrow text-walnut">What would you like to change?</label>
          <textarea id="change" className="input" maxLength={500} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="e.g. Could we move to 8 pm, and add one more guest?" />
          <div className="flex gap-3"><button className="btn btn-dark" disabled={busy} onClick={() => send("modify")}>Send request</button><button className="btn btn-outline" onClick={() => setMode("idle")}>Back</button></div>
        </div>
      ) : mode === "confirmCancel" ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="w-full">Cancel this reservation?</p>
          <button className="btn bg-danger text-white" disabled={busy} onClick={() => send("cancel")}>Yes, cancel</button>
          <button className="btn btn-outline" onClick={() => setMode("idle")}>Keep it</button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-outline" onClick={() => setMode("modify")}>Request a change</button>
          <button className="btn btn-outline" onClick={() => setMode("confirmCancel")}>Cancel reservation</button>
        </div>
      )}
    </div>
  );
}
