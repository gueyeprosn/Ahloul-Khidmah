/** Icônes canaux de paiement (Wave, Orange Money / Max it, espèces, PayDunya) */

const LOGO = {
  wave: "/brand/payments/wave.png",
  orange: "/brand/payments/orange-money.png",
} as const

export function CanalIcon({
  canal,
  className = "size-10",
}: {
  canal: string
  className?: string
}) {
  if (canal === "wave" || canal === "orange") {
    const src = LOGO[canal]
    const label = canal === "wave" ? "Wave" : "Orange Money"
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={label}
        width={40}
        height={40}
        className={`shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-black/5 ${className}`}
        loading="lazy"
        decoding="async"
      />
    )
  }

  if (canal === "cellule") {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-[var(--ak-emerald-deep)] ${className}`}
        aria-hidden
      >
        <svg viewBox="0 0 40 40" className="size-[70%]" fill="none">
          <rect
            x="6"
            y="12"
            width="22"
            height="14"
            rx="2"
            fill="#E8CE83"
            stroke="#C9A24C"
            strokeWidth="1.2"
          />
          <circle cx="17" cy="19" r="3.2" fill="#0B3A25" opacity="0.35" />
          <path
            d="M9 15h4M9 23h4M21 15h4M21 23h4"
            stroke="#0B3A25"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.45"
          />
          <circle cx="30" cy="26" r="5.5" fill="#C9A24C" />
          <circle cx="30" cy="26" r="3.2" fill="#E8CE83" />
          <circle cx="27" cy="22" r="4.5" fill="#C9A24C" opacity="0.9" />
          <circle cx="27" cy="22" r="2.5" fill="#FBF6EA" />
        </svg>
      </span>
    )
  }

  if (canal === "paydunya") {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-[#0B3A25] ${className}`}
        aria-hidden
      >
        <svg viewBox="0 0 40 40" className="size-[70%]" fill="none">
          <rect x="8" y="10" width="24" height="20" rx="4" fill="#E8CE83" />
          <path
            d="M14 20h12M14 16h8M14 24h10"
            stroke="#0B3A25"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
    )
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-[#DED2AE] ${className}`}
      aria-hidden
    />
  )
}
