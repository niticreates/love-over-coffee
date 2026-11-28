import { adminRoute } from "@/lib/admin-api";
import { fail, json } from "@/lib/http";
import { uuid } from "@/lib/ids";
import { getStore } from "@/lib/store";

const FOLDERS = new Set(["menu", "gallery", "site", "platforms"]);
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

export const POST = adminRoute("manager", async (req) => {
  const form = await req.formData();
  const file = form.get("file");
  // Fixed folders: menu photos, gallery, site banners/hero, partner and brand logos.
  const folder = String(form.get("folder") ?? "");
  if (!FOLDERS.has(folder)) return fail(422, "bad_folder", "Unknown upload folder.");
  if (!(file instanceof File)) return fail(422, "no_file", "Choose an image to upload.");
  const ext = TYPES[file.type];
  if (!ext) return fail(415, "bad_type", "Upload a JPG, PNG, WebP or AVIF image.");
  if (file.size > 8_000_000) return fail(413, "too_large", "Images must be under 8 MB.");
  // Magic-byte sniff so a renamed file can't masquerade as an image.
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpg = head[0] === 0xff && head[1] === 0xd8;
  const isPng = head[0] === 0x89 && head[1] === 0x50;
  const isWebp = head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50;
  const isAvif = String.fromCharCode(...head.slice(4, 12)).startsWith("ftypavi");
  if (!(isJpg || isPng || isWebp || isAvif)) return fail(415, "bad_type", "That file isn't a valid image.");
  const url = await getStore().uploadImage(`${folder}/${uuid()}.${ext}`, file);
  return json({ url });
});
