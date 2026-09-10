"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { HandCoins, Users } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useLocale } from "@/components/landing/locale-provider"
import { getContributeDict } from "@/i18n/contribute"
import { ContributeForm } from "@/components/contribute/contribute-form"
import { cn } from "@/lib/utils"

const AdhesionForm = dynamic(
  () =>
    import("@/components/adhesion/adhesion-form").then((m) => m.AdhesionForm),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3 rounded-2xl border border-[#E6DCC0] bg-white p-3">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    ),
  }
)

type Tab = "adhesion" | "contribuer"

type LandingJoinProps = {
  defaultMontant?: string
  /** Adhérent déjà connecté sur /mon-espace — inutile de lui remontrer le formulaire d'adhésion. */
  isMember?: boolean
}

function tabFromHash(isMember: boolean): Tab {
  if (typeof window === "undefined") return isMember ? "contribuer" : "adhesion"
  const hash = window.location.hash.replace("#", "")
  if (hash === "adhesion") return "adhesion"
  if (hash === "contribuer") return "contribuer"
  return isMember ? "contribuer" : "adhesion"
}

export function LandingJoin({ defaultMontant, isMember = false }: LandingJoinProps) {
  const { dict, locale } = useLocale()
  const contribute = getContributeDict(locale)
  const [tab, setTab] = useState<Tab>(isMember ? "contribuer" : "adhesion")
  /** Mode formulaire plein écran : titres réduits pour gagner de la place */
  const [formFocus, setFormFocus] = useState(false)
  const tabsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const hash = window.location.hash
    // Lu depuis window.location.hash, indisponible côté serveur — un
    // lazy initializer useState() ici provoquerait un hydration mismatch.
    // Ce sync ne peut donc se faire qu'après le montage, dans cet effet.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTab(tabFromHash(isMember))
    if (hash === "#adhesion" || hash === "#contribuer") {
      setFormFocus(true)
    }
    const onHash = () => {
      setTab(tabFromHash(isMember))
      if (
        window.location.hash === "#adhesion" ||
        window.location.hash === "#contribuer"
      ) {
        setFormFocus(true)
      }
    }
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [isMember])

  const selectTab = useCallback((next: Tab) => {
    setTab(next)
    setFormFocus(true)
    const hash = next === "adhesion" ? "#adhesion" : "#contribuer"
    if (window.location.hash !== hash) {
      window.history.replaceState(null, "", hash)
    }
    requestAnimationFrame(() => {
      document.getElementById("adhesion")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    })
  }, [])

  const isAdhesion = tab === "adhesion"

  return (
    <section
      id="adhesion"
      className={cn(
        "relative scroll-mt-20 bg-[linear-gradient(180deg,#F7F3E8_0%,var(--ak-ivory)_100%)] px-5 text-[var(--ak-ink)] md:px-8",
        formFocus ? "py-3 md:py-8" : "py-10 md:py-14"
      )}
    >
      <div id="contribuer" className="pointer-events-none absolute" aria-hidden />

      <div className="mx-auto max-w-6xl">
        {!formFocus ? (
          <header className="mb-6">
            <p className="text-xs font-semibold tracking-[0.25em] text-[var(--ak-emerald-mid)] uppercase">
              {isAdhesion
                ? dict.adhesion.eyebrow
                : contribute.paths.contribute.title}
            </p>
            <h2 className="mt-2 max-w-2xl font-[family-name:var(--font-amiri)] text-3xl leading-tight text-[var(--ak-emerald-deep)] md:text-4xl">
              {isAdhesion ? dict.adhesion.title : contribute.form.title}
            </h2>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[var(--ak-ink-soft)] md:text-sm">
              {isAdhesion
                ? dict.adhesion.intro
                : contribute.paths.contribute.text}
            </p>
          </header>
        ) : null}

        {/* Mobile : pas sticky (évite le chevauchement). Desktop : sticky sous le header. */}
        <div
          ref={tabsRef}
          className="relative z-20 border-b border-[#E6DCC0] bg-[var(--ak-ivory)] pb-2 md:sticky md:top-20 md:z-30 md:rounded-2xl md:border md:px-2 md:py-1.5 md:backdrop-blur-md"
          role="tablist"
          aria-label="Adhésion ou contribution"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-1 md:max-w-md">
            <button
              type="button"
              role="tab"
              aria-selected={isAdhesion}
              onClick={() => selectTab("adhesion")}
              className={cn(
                "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ak-emerald-mid)]",
                isAdhesion
                  ? "bg-[var(--ak-emerald-deep)] text-white shadow-sm"
                  : "text-[var(--ak-ink-soft)] hover:bg-white/70 hover:text-[var(--ak-emerald-deep)]"
              )}
            >
              <Users className="size-4 shrink-0" aria-hidden />
              {dict.nav.adhesion}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isAdhesion}
              onClick={() => selectTab("contribuer")}
              className={cn(
                "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ak-emerald-mid)]",
                !isAdhesion
                  ? "bg-[var(--ak-emerald-deep)] text-white shadow-sm"
                  : "text-[var(--ak-ink-soft)] hover:bg-white/70 hover:text-[var(--ak-emerald-deep)]"
              )}
            >
              <HandCoins className="size-4 shrink-0" aria-hidden />
              {dict.nav.contribute}
            </button>
          </div>
        </div>

        <div
          className={cn(
            "relative z-10 rounded-2xl border border-[#E6DCC0] bg-white",
            "mt-4 p-3 md:mt-5 md:p-5"
          )}
        >
          {isAdhesion ? (
            <div role="tabpanel" aria-label={dict.nav.adhesion}>
              <AdhesionForm defaultMontant={defaultMontant} compact />
            </div>
          ) : (
            <div role="tabpanel" aria-label={dict.nav.contribute}>
              <ContributeForm compact />
            </div>
          )}
        </div>

        {formFocus ? (
          <button
            type="button"
            onClick={() => setFormFocus(false)}
            className="mt-2 cursor-pointer text-center text-xs text-[var(--ak-ink-soft)] underline-offset-2 hover:underline md:mt-3"
          >
            Afficher le titre
          </button>
        ) : null}
      </div>
    </section>
  )
}
