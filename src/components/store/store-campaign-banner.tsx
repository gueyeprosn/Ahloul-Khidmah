import Link from "next/link"
import { storeCampaign } from "@/content/store"

export function StoreCampaignBanner() {
  if (!storeCampaign.active) return null

  return (
    <aside className="mx-auto max-w-6xl px-5 md:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-[var(--ak-gold)]/35 bg-[linear-gradient(135deg,#0B3A25_0%,#145C3A_55%,#0B3A25_100%)] px-6 py-7 md:px-10 md:py-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-[var(--ak-gold)]/15 blur-2xl"
        />
        <p className="text-xs font-semibold tracking-[0.22em] text-[var(--ak-gold)] uppercase">
          {storeCampaign.eyebrow}
        </p>
        <h2 className="mt-2 max-w-xl font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-ivory)] md:text-3xl">
          {storeCampaign.title}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--ak-ivory)]/75 md:text-base">
          {storeCampaign.text}
        </p>
        <Link
          href={storeCampaign.ctaHref}
          className="mt-5 inline-flex rounded-2xl bg-[var(--ak-gold)] px-5 py-2.5 text-sm font-semibold text-[var(--ak-emerald-deep)] transition-colors hover:bg-[var(--ak-gold-light)]"
        >
          {storeCampaign.ctaLabel}
        </Link>
      </div>
    </aside>
  )
}
