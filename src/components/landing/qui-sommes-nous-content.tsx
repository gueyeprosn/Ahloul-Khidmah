"use client"

import { SeoPageShell } from "@/components/seo/seo-page-shell"
import { AboutPortrait } from "@/components/landing/about-portrait"
import { useLocale } from "@/components/landing/locale-provider"
import { aboutByLocale } from "@/content/about"

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-14 font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)] md:text-3xl">
      {children}
    </h2>
  )
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 text-base leading-relaxed text-[var(--ak-ink-soft)]">
      {children}
    </p>
  )
}

export function QuiSommesNousContent() {
  const { locale, isRtl } = useLocale()
  const t = aboutByLocale[locale]

  return (
    <SeoPageShell
      eyebrow={t.eyebrow}
      title={t.title}
      intro={t.intro}
      ctaLabel={t.cta}
      ctaOr={t.ctaOr}
      ctaContributeLabel={t.ctaContribute}
      homeLabel={locale === "ar" ? "الرئيسية" : "Accueil"}
    >
      <div className={isRtl ? "text-right" : ""}>
        <AboutPortrait
          src="/brand/cheikh-ahmadou-bamba.jpg"
          alt={`${t.cheikh.name} — ${t.cheikh.role}`}
          name={t.cheikh.name}
          role={t.cheikh.role}
          priority
          variant="featured"
        />

        {t.identity.map((p) => (
          <Body key={p.slice(0, 48)}>{p}</Body>
        ))}

        <div className="ak-khalife-block">
          <SectionTitle>{t.khalife.title}</SectionTitle>
          <AboutPortrait
            src="/brand/khalife-mountakha.jpg"
            alt={`Serigne Mouhamadou Mountakha Mbacké — ${t.khalife.role}`}
            name="Serigne Mouhamadou Mountakha Mbacké"
            role={t.khalife.role}
            variant="inline"
          />
          {t.khalife.paragraphs.map((p) => (
            <Body key={p.slice(0, 48)}>{p}</Body>
          ))}
          <Body>{t.khalife.line}</Body>
        </div>

        <ol className="mt-6 space-y-4">
          {t.khalife.steps.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--ak-emerald-deep)] font-[family-name:var(--font-amiri)] text-sm text-[var(--ak-gold-light)]"
              >
                {i + 1}
              </span>
              <span className="pt-1 font-[family-name:var(--font-amiri)] text-lg text-[var(--ak-emerald-deep)]">
                {step}
              </span>
            </li>
          ))}
        </ol>

        <div className="ak-khalife-block">
          <SectionTitle>{t.dieuwrigne.title}</SectionTitle>
          <AboutPortrait
            src="/brand/dieuwrigne-mbackiyou-faye.jpg"
            alt="Dieuwrigne Serigne Mbackiyou Faye"
            name="Dieuwrigne Serigne Mbackiyou Faye"
            role={t.dieuwrigne.role}
            variant="inline"
          />
          {t.dieuwrigne.paragraphs.map((p) => (
            <Body key={p.slice(0, 48)}>{p}</Body>
          ))}
        </div>

        <SectionTitle>{t.raisonEtre.title}</SectionTitle>
        <Body>{t.raisonEtre.lead}</Body>
        {t.raisonEtre.paragraphs.map((p) => (
          <Body key={p.slice(0, 48)}>{p}</Body>
        ))}
        <p className="mt-5 text-base leading-relaxed text-[var(--ak-ink-soft)]">
          {t.raisonEtre.wantTransform}
        </p>
        <ul className="mt-3 space-y-2 border-[var(--ak-gold)]/50 ps-5 border-s-2">
          {t.raisonEtre.transform.map((item) => (
            <li
              key={item}
              className="font-medium text-[var(--ak-emerald-deep)]"
            >
              {item}
            </li>
          ))}
        </ul>
        <Body>{t.raisonEtre.closing}</Body>

        <SectionTitle>{t.pillarsTitle}</SectionTitle>
        <ol className="mt-8 space-y-10">
          {t.pillars.map((pillar) => (
            <li key={pillar.n} className="flex gap-4">
              <span
                aria-hidden
                className="font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-gold-dark)]"
              >
                {pillar.n}
              </span>
              <div>
                <h3 className="font-[family-name:var(--font-amiri)] text-xl text-[var(--ak-emerald-deep)] md:text-2xl">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ak-ink-soft)] md:text-base">
                  {pillar.text}
                </p>
                <p className="mt-3 text-sm font-semibold text-[var(--ak-emerald-mid)]">
                  {pillar.slogan}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <SectionTitle>{t.vision.title}</SectionTitle>
        <p className="mt-3 font-[family-name:var(--font-amiri)] text-xl text-[var(--ak-emerald-mid)]">
          {t.vision.subtitle}
        </p>
        {t.vision.paragraphs.map((p) => (
          <Body key={p.slice(0, 48)}>{p}</Body>
        ))}

        <SectionTitle>{t.valuesTitle}</SectionTitle>
        <ul className="mt-8 space-y-6">
          {t.values.map((v) => (
            <li key={v.title}>
              <h3 className="font-[family-name:var(--font-amiri)] text-xl text-[var(--ak-emerald-deep)]">
                {v.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--ak-ink-soft)] md:text-base">
                {v.text}
              </p>
            </li>
          ))}
        </ul>

        <SectionTitle>{t.community.title}</SectionTitle>
        {t.community.paragraphs.map((p) => (
          <Body key={p.slice(0, 48)}>{p}</Body>
        ))}
        <ul className="mt-4 space-y-2 border-[var(--ak-gold)]/50 ps-5 border-s-2">
          {t.community.questions.map((q) => (
            <li
              key={q}
              className="font-medium text-[var(--ak-emerald-deep)]"
            >
              {q}
            </li>
          ))}
        </ul>
        <Body>{t.community.closing}</Body>

        <SectionTitle>{t.engagement.title}</SectionTitle>
        {t.engagement.paragraphs.map((p) => (
          <Body key={p.slice(0, 48)}>{p}</Body>
        ))}
        <blockquote className="mt-8 border-[var(--ak-gold)] bg-white/60 px-5 py-4 font-[family-name:var(--font-amiri)] text-xl leading-relaxed text-[var(--ak-emerald-deep)] border-s-4">
          « {t.engagement.quote} »
        </blockquote>

        <div className="mt-14 rounded-2xl bg-[var(--ak-emerald-deep)] px-6 py-8 text-center text-[var(--ak-ivory)] md:px-10">
          <p className="font-[family-name:var(--font-amiri)] text-3xl">
            {t.closing.title}
          </p>
          <p className="mt-3 text-sm font-semibold tracking-wide text-[var(--ak-gold-light)] uppercase">
            {t.closing.pillars}
          </p>
          <p className="mt-5 text-base text-[var(--ak-ivory)]/80">
            {t.closing.tagline}
          </p>
          <p className="mt-3 font-[family-name:var(--font-amiri)] text-xl text-[var(--ak-gold-light)]">
            {t.closing.call}
          </p>
        </div>
      </div>
    </SeoPageShell>
  )
}
