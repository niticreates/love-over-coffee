export function MapEmbed({ query, className }: { query: string; className?: string }) {
  // Keyless embed. For a pinned Place ID embed, set NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY and use the Embed API.
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  const src = key
    ? `https://www.google.com/maps/embed/v1/place?key=${key}&q=${encodeURIComponent(query)}`
    : `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  return (
    <div className={`relative overflow-hidden bg-oat ${className ?? ""}`}>
      <iframe title="Map showing Love Over Coffee, Scheme 113, Vijay Nagar" src={src} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full grayscale-[.35] sepia-[.15]" allowFullScreen />
    </div>
  );
}
