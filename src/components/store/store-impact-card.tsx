import { Heart } from "lucide-react"
import { storeImpact } from "@/content/store"

export function StoreImpactCard({ variant = "full" }: { variant?: "full" | "compact" }) {
  if (variant === "compact") {
    return (
      <div className="flex items-start gap-2.5 rounded-xl bg-[#F3EEDF] px-4 py-3">
        <Heart className="mt-0.5 size-4 shrink-0 text-[var(--ak-gold-dark)]" aria-hidden />
        <p className="text-sm text-[var(--ak-ink-soft)]">{storeImpact.compact}</p>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-[var(--ak-gold)]/30 bg-[#F3EEDF] px-6 py-10 text-center md:px-12">
      <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-[var(--ak-emerald-deep)] text-[var(--ak-gold-light)]">
        <Heart className="size-5" aria-hidden />
      </div>
      <h2 className="mt-4 font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)] md:text-3xl">
        {storeImpact.title}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[var(--ak-ink-soft)] md:text-base">
        {storeImpact.text}
      </p>
    </div>
  )
}
