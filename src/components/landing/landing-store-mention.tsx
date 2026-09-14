"use client"

import Link from "next/link"
import { ArrowRight, ShoppingBag } from "lucide-react"
import { useLocale } from "@/components/landing/locale-provider"
import { STORE_PUBLIC_ENABLED } from "@/lib/store/store-status"
import { cn } from "@/lib/utils"

/**
 * Mention discrète de la boutique — une ligne, pas une section promotionnelle :
 * ne doit jamais rivaliser visuellement avec les CTA Adhérer/Contribuer.
 */
export function LandingStoreMention() {
  const { dict, isRtl } = useLocale()
  if (!STORE_PUBLIC_ENABLED) return null

  return (
    <div className="border-y border-[var(--ak-gold)]/20 bg-[var(--ak-ivory)] px-5 py-3.5 md:px-8">
      <Link
        href="/boutique"
        className="group mx-auto flex max-w-6xl items-center justify-center gap-2 text-center text-sm text-[var(--ak-ink-soft)] transition-colors hover:text-[var(--ak-emerald-deep)]"
      >
        <ShoppingBag className="size-3.5 shrink-0 text-[var(--ak-gold-dark)]" aria-hidden />
        <span>{dict.storeMention.text}</span>
        <span className="inline-flex items-center gap-1 font-medium text-[var(--ak-emerald-deep)] underline-offset-2 group-hover:underline">
          {dict.storeMention.cta}
          <ArrowRight className={cn("size-3.5", isRtl && "rotate-180")} aria-hidden />
        </span>
      </Link>
    </div>
  )
}
