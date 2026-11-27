export interface ApiError { code: string; message: string; fields?: Record<string, string> }

export async function postJSON<T>(url: string, body: unknown, method = "POST"): Promise<{ ok: true; data: T } | { ok: false; error: ApiError }> {
  try {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error ?? { code: "http_" + res.status, message: "Something went wrong. Please try again." } };
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: { code: "network", message: "You seem to be offline. Check your connection and try again." } };
  }
}
