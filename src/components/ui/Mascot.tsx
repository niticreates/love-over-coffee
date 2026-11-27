import clsx from "clsx";

/**
 * The Love Over Coffee cup mascot, traced from the storefront signage: a lidded takeaway
 * cup with a turquoise face panel, dot eyes, blush cheeks and an open smile.
 * Replace with the café's official vector artwork when supplied (public/images/brand/mascot.svg).
 * Animation: an occasional blink and a small tilt on hover — both off under reduced motion.
 */
export function Mascot({ className, title = "Love Over Coffee cup mascot", animated = true }: { className?: string; title?: string | null; animated?: boolean }) {
  return (
    <svg
      viewBox="0 0 100 124"
      className={clsx("mascot overflow-visible", animated && "mascot-animated", className)}
      role={title ? "img" : undefined}
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : true}
    >
      <g className="mascot-body" style={{ transformOrigin: "50% 100%" }} strokeLinejoin="round" strokeLinecap="round">
        {/* straw */}
        <path d="M58 22 L64 4 L71 6" fill="none" stroke="#0e1f3d" strokeWidth="4.5" />
        {/* dome lid */}
        <path d="M22 34 C24 18 38 14 50 14 C62 14 76 18 78 34 Z" fill="#fff" stroke="#0e1f3d" strokeWidth="4.5" />
        <rect x="11" y="32" width="78" height="12" rx="6" fill="#fff" stroke="#0e1f3d" strokeWidth="4.5" />
        {/* cup */}
        <path d="M17 44 H83 L76 112 Q75.4 118 69 118 H31 Q24.6 118 24 112 Z" fill="#fff" stroke="#0e1f3d" strokeWidth="4.5" />
        <path d="M26 52 H74 L69.5 104 Q69 108 65 108 H35 Q31 108 30.5 104 Z" fill="#22b8de" />
        {/* face */}
        <g className="mascot-eyes" style={{ transformOrigin: "50% 70px" }}>
          <circle cx="40" cy="70" r="3.6" fill="#0e1f3d" />
          <circle cx="60" cy="70" r="3.6" fill="#0e1f3d" />
        </g>
        <ellipse cx="34" cy="80" rx="4.2" ry="2.6" fill="#f6cdd6" />
        <ellipse cx="66" cy="80" rx="4.2" ry="2.6" fill="#f6cdd6" />
        <path d="M41 79 Q50 80 59 79 Q58 92 50 92 Q42 92 41 79 Z" fill="#0e1f3d" />
        <path d="M44.5 87.5 Q50 84 55.5 87.5 Q53.5 91 50 91 Q46.5 91 44.5 87.5 Z" fill="#d6336c" />
      </g>
    </svg>
  );
}
