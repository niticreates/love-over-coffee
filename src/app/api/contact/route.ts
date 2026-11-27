import { fail, json, limit, parseBody } from "@/lib/http";
import { getStore } from "@/lib/store";
import { contactSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const limited = limit(req, "contact", 5, 10 * 60_000);
  if (limited) return limited;
  const body = await parseBody(req, contactSchema);
  if (!body.ok) return body.res;
  if (body.data.website) return json({ ok: true });
  try {
    const { website: _hp, ...m } = body.data;
    await getStore().createContactMessage(m);
    return json({ ok: true });
  } catch {
    return fail(503, "unavailable", "We couldn't send your message. Please call or WhatsApp us instead.");
  }
}
