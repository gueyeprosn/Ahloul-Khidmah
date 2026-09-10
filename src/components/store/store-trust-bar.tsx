import { HandHeart, MapPin, ShieldCheck, Truck } from "lucide-react"
import { storeTrustItems } from "@/content/store"
import { cn } from "@/lib/utils"

const ICONS = {
  pay: ShieldCheck,
  ship: Truck,
  pickup: MapPin,
  impact: HandHeart,
} as const

export function StoreTrustBar({
  className,
  compact = false,
}: {
  className?: string
  /** Ligne fine sous le catalogue — ne vole pas la place aux produits. */
  compact?: boolean
}) {
  if (compact) {
    return (
      <ul
        className={cn(
          "flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[var(--ak-ink-soft)]",
          className
        )}
      >
        {storeTrustItems.map((item) => {
          const Icon = ICONS[item.key]
          return (
            <li key={item.key} className="inline-flex items-center gap-1.5">
              <Icon className="size-3.5 text-[var(--ak-emerald-deep)]" aria-hidden />
              <span className="font-medium text-[var(--ak-ink)]">{item.title}</span>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <ul
      className={
        className ??
        "mx-auto grid max-w-6xl grid-cols-2 gap-3 px-5 md:grid-cols-4 md:px-8"
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
