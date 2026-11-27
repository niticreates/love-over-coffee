import { fail, json, limit } from "@/lib/http";
import { isValidDate } from "@/lib/reservations";
import { availability } from "@/lib/services/reservations";

export async function GET(req: Request) {
  const limited = limit(req, "slots", 60, 60_000);
  if (limited) return limited;
  const url = new URL(req.url);
  const date = url.searchParams.get("date") ?? "";
  const guests = Number(url.searchParams.get("guests") ?? 2);
  if (!isValidDate(date) || !Number.isInteger(guests) || guests < 1 || guests > 50) return fail(422, "invalid", "Invalid date or guests.");
  return json(await availability(date, guests));
}
