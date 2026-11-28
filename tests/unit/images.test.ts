import { describe, expect, it } from "vitest";
import { servedDirectly } from "@/lib/image-src";
import { fitWithin, MAX_EDGE } from "@/lib/resize-image";

describe("uploaded photo serving", () => {
  it("serves Supabase Storage public URLs directly and keeps /public files on the optimiser", () => {
    expect(servedDirectly("https://abc.supabase.co/storage/v1/object/public/media/menu/x.jpg")).toBe(true);
    expect(servedDirectly("data:image/png;base64,AAA")).toBe(true);
    expect(servedDirectly("/images/coffee/latte-art.webp")).toBe(false);
    expect(servedDirectly("https://example.com/storage/v1/object/sign/media/x.jpg")).toBe(false);
  });
});

describe("upload resizing", () => {
  it("fits the long edge inside the folder's limit without enlarging", () => {
    expect(fitWithin(4000, 3000, MAX_EDGE.menu)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3000, 4000, MAX_EDGE.menu)).toEqual({ width: 1200, height: 1600 });
    expect(fitWithin(800, 600, MAX_EDGE.menu)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(6000, 2000, MAX_EDGE.site)).toEqual({ width: 2560, height: 853 });
  });
});
