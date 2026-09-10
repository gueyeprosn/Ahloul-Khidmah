import Link from "next/link"
import { storeCampaign } from "@/content/store"

export function StoreCampaignBanner() {
  if (!storeCampaign.active) return null

  return (
    <aside>
      <div className="relative overflow-hidden rounded-2xl border border-[var(--ak-gold)]/30 bg-[var(--ak-emerald-deep)] px-5 py-5 md:flex md:items-center md:justify-between md:gap-6 md:px-7 md:py-6">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-[var(--ak-gold)] uppercase">
            {storeCampaign.eyebrow}
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-amiri)] text-xl text-[var(--ak-ivory)] md:text-2xl">
            {storeCampaign.title}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-[var(--ak-ivory)]/70">
            {storeCampaign.text}
          </p>
        </div>
        <Link
          href={storeCampaign.ctaHref}
          className="mt-4 inline-flex shrink-0 rounded-xl bg-[var(--ak-gold)] px-4 py-2.5 text-sm font-semibold text-[var(--ak-emerald-deep)] transition-colors hover:bg-[var(--ak-gold-light)] md:mt-0"
        >
          {storeCampaign.ctaLabel}
        </Link>
      </div>
    </aside>
  )
}
