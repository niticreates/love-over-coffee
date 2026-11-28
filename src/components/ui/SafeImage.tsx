"use client";
import Image, { type ImageProps } from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import { servedDirectly } from "@/lib/image-src";

/**
 * next/image for photos that come from the database. Uploaded photos skip the optimiser (see
 * servedDirectly), and if an image still fails to load, `fallback` is shown instead of the
 * browser's broken-image box with alt text.
 */
export function SafeImage({ fallback = null, src, alt, ...props }: Omit<ImageProps, "src"> & { src: string; fallback?: ReactNode }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (failed) return <>{fallback}</>;
  return <Image {...props} src={src} alt={alt} unoptimized={props.unoptimized ?? servedDirectly(src)} onError={() => setFailed(true)} />;
}
