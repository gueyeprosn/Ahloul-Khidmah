"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  dictionaries,
  LOCALE_COOKIE,
  type LandingDict,
  type Locale,
} from "@/i18n/landing"

type LocaleContextValue = {
  locale: Locale
  dict: LandingDict
  setLocale: (locale: Locale) => void
  isRtl: boolean
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function readCookieLocale(): Locale {
  if (typeof document === "undefined") return "fr"
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`))
  const value = match?.[1]
  return value === "ar" ? "ar" : "fr"
}

function writeCookieLocale(locale: Locale) {
  const secure =
    typeof location !== "undefined" && location.protocol === "https:"
      ? "; Secure"
      : ""
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax${secure}`
}

export function LocaleProvider({
  children,
  initialLocale = "fr",
}: {
  children: ReactNode
  initialLocale?: Locale
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  useEffect(() => {
    const fromCookie = readCookieLocale()
    if (fromCookie !== locale) setLocaleState(fromCookie)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale === "ar" ? "ar" : "fr"
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr"
    const shell = document.getElementById("marketing-shell")
    if (shell) {
      shell.setAttribute("dir", locale === "ar" ? "rtl" : "ltr")
      shell.setAttribute("lang", locale === "ar" ? "ar" : "fr")
    }
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    writeCookieLocale(next)
  }, [])

  const value = useMemo(
    () => ({
      locale,
      dict: dictionaries[locale],
      setLocale,
      isRtl: locale === "ar",
    }),
    [locale, setLocale]
  )

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider")
  }
  return ctx
}

/** Safe outside LocaleProvider (ex. dashboard) — defaults to French. */
export function useOptionalLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  return (
    ctx ?? {
      locale: "fr",
      dict: dictionaries.fr,
      setLocale: () => {},
      isRtl: false,
    }
  )
}
