interface GeorgiaSudsLogoProps {
  size?: number;
  showText?: boolean;
  /** Unique ID prefix to avoid SVG filter/gradient ID collisions on the same page */
  id?: string;
}

export default function GeorgiaSudsLogo({ size = 40, showText = true, id = "gs" }: GeorgiaSudsLogoProps) {
  const p = id;
  return (
    <div className="flex items-center gap-3">
      <svg
        width={size}
        height={size}
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Peach: warm radial from upper-left highlight → deep orange-peach edge */}
          <radialGradient id={`${p}-peach`} cx="38%" cy="32%" r="65%">
            <stop offset="0%"   stopColor="#FFD5A0" />
            <stop offset="45%"  stopColor="#FF9055" />
            <stop offset="100%" stopColor="#D0490A" />
          </radialGradient>

          {/* Shine overlay */}
          <radialGradient id={`${p}-shine`} cx="30%" cy="25%" r="50%">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0"   />
          </radialGradient>

          {/* Leaf gradient */}
          <linearGradient id={`${p}-leaf`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#6CB86C" />
            <stop offset="100%" stopColor="#2E7A32" />
          </linearGradient>
        </defs>

        {/* ── Peach body ───────────────────────────── */}
        <circle cx="22" cy="33" r="18" fill={`url(#${p}-peach)`} />

        {/* Shine highlight (top-left) */}
        <ellipse cx="16" cy="24" rx="7" ry="5" fill={`url(#${p}-shine)`} />

        {/* Peach cleft — subtle vertical groove from top */}
        <path
          d="M 22 15.5 Q 22.4 24, 22 33"
          stroke="#A03010"
          strokeWidth="1.0"
          fill="none"
          opacity="0.18"
        />

        {/* ── Leaf ─────────────────────────────────── */}
        {/* Left leaf */}
        <path
          d="M 22 15 Q 15 7, 11 10 Q 16 13, 22 15 Z"
          fill={`url(#${p}-leaf)`}
        />
        {/* Right leaf */}
        <path
          d="M 22 15 Q 29 7, 33 10 Q 28 13, 22 15 Z"
          fill={`url(#${p}-leaf)`}
          opacity="0.78"
        />

        {/* Stem */}
        <line
          x1="22" y1="15" x2="22" y2="11"
          stroke="#5A3020" strokeWidth="1.5" strokeLinecap="round"
        />

        {/* ── Monogram ─────────────────────────────── */}
        <text
          x="22" y="34"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontFamily: "var(--font-fizzo), Georgia, serif" }}
          fontSize="11"
          fontStyle="italic"
          fontWeight="bold"
          fill="#7A1E04"
          opacity="0.72"
          letterSpacing="2.5"
        >
          GS
        </text>

        {/* ── Soap bubbles ─────────────────────────── */}
        {/* Large */}
        <circle cx="49" cy="20" r="8"    stroke="#FFAA7A" strokeWidth="1.0"  fill="white" fillOpacity="0.07" />
        <circle cx="46.5" cy="17.5" r="2"     fill="white" fillOpacity="0.52" />

        {/* Medium */}
        <circle cx="54" cy="34" r="5.5"  stroke="#FFAA7A" strokeWidth="0.85" fill="white" fillOpacity="0.06" />
        <circle cx="52"   cy="32"   r="1.3"   fill="white" fillOpacity="0.48" />

        {/* Small */}
        <circle cx="46" cy="46" r="3.5"  stroke="#FFAA7A" strokeWidth="0.7"  fill="white" fillOpacity="0.05" />
        <circle cx="44.8" cy="44.8" r="0.85"  fill="white" fillOpacity="0.44" />

        {/* Tiny floating */}
        <circle cx="55" cy="25" r="2"    stroke="#FFAA7A" strokeWidth="0.55" fill="white" fillOpacity="0.05" />
      </svg>

      {showText && (
        <span
          className="text-peach-900 tracking-wide leading-none"
          style={{ fontFamily: "var(--font-fizzo), Georgia, serif", fontSize: Math.round(size * 0.42), fontWeight: 700 }}
        >
          Georgia Suds
        </span>
      )}
    </div>
  );
}
