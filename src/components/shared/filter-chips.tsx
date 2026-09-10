import Link from "next/link"
import { cn } from "@/lib/utils"

export type FilterChip = {
  href: string
  label: string
  active?: boolean
}

export function FilterChips({
  chips,
  className,
}: {
  chips: FilterChip[]
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {chips.map((chip) => (
        <Link
          key={chip.href + chip.label}
          href={chip.href}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            chip.active
              ? "border-[var(--ak-emerald-deep)] bg-[var(--ak-emerald-deep)] text-white"
              : "border-[#E6DCC0] bg-white text-[var(--ak-ink-soft)] hover:border-[var(--ak-gold)] hover:text-[var(--ak-emerald-deep)]"
          )}
        >
          {chip.label}
        </Link>
      ))}
    </div>
  )
}
