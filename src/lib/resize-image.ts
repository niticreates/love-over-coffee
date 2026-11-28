// Browser-side photo shrinking before upload. Phone photos are often 3–12 MB and 4000+ px wide;
// the site never shows them larger than these sizes, and uploaded photos are served straight
// from Supabase Storage, so they are made web-sized here. Re-encoding also drops EXIF data
// such as GPS location. If the browser can't decode or encode the file, the original is sent
// and the server's own checks (type, magic bytes, 8 MB) still apply.

export const MAX_EDGE: Record<string, number> = { menu: 1600, gallery: 2000, site: 2560, platforms: 800 };
const QUALITY = 0.85;

/** Size that fits inside max×max, keeping the aspect ratio; never enlarges. */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

const toBlob = (canvas: HTMLCanvasElement, type: string) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY));

export async function resizeForUpload(file: File, folder: string): Promise<File> {
  const max = MAX_EDGE[folder] ?? 2000;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }
  try {
    const size = fitWithin(bitmap.width, bitmap.height, max);
    const shrinks = size.width < bitmap.width;
    if (!shrinks && file.size <= 600_000) return file; // already web-sized
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, size.width, size.height);
    // WebP keeps logo transparency; browsers that can't encode it return PNG, so fall back to JPEG for photos.
    let blob = await toBlob(canvas, "image/webp");
    if (blob?.type !== "image/webp") blob = folder === "platforms" ? null : await toBlob(canvas, "image/jpeg");
    if (!blob || (!shrinks && blob.size >= file.size)) return file;
    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + "." + ext, { type: blob.type, lastModified: Date.now() });
  } finally {
    bitmap.close();
  }
}
