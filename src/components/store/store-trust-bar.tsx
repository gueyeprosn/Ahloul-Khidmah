import { HandHeart, MapPin, ShieldCheck, Truck } from "lucide-react"
import { storeTrustItems } from "@/content/store"

const ICONS = {
  pay: ShieldCheck,
  ship: Truck,
  pickup: MapPin,
  impact: HandHeart,
} as const

export function StoreTrustBar({ className }: { className?: string }) {
  return (
    <ul
      className={
        className ??
        "mx-auto grid max-w-6xl gap-3 px-5 sm:grid-cols-2 md:grid-cols-4 md:px-8"
      }
    >
      {storeTrustItems.map((item) => {
        const Icon = ICONS[item.key]
        return (
          <li
            key={item.key}
            className="flex items-start gap-3 rounded-2xl border border-[var(--ak-gold)]/25 bg-white/80 px-4 py-3"
          >
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--ak-emerald-deep)] text-[var(--ak-gold-light)]">
              <Icon className="size-4" aria-hidden />
            </span>
            <span>
              <p className="text-sm font-semibold text-[var(--ak-emerald-deep)]">
                {item.title}
              </p>
              <p className="text-xs leading-relaxed text-[var(--ak-ink-soft)]">
                {item.text}
              </p>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
