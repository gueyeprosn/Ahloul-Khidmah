"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import {
  PHONE_COUNTRIES,
  countryByIso,
  detectCountryIsoLocal,
  flagEmoji,
  isKnownPhoneIso,
  splitPhone,
} from "@/lib/phone-countries"

export {
  PHONE_COUNTRIES,
  flagEmoji,
  detectCountryIsoLocal,
} from "@/lib/phone-countries"

/**
 * Numéro local + sélecteur d’indicatif (drapeau).
 * Recompose un numéro E.164 ("+22177…") pour le formulaire.
 */
export function PhoneInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder = "77 123 45 67",
  required,
  className = "",
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  required?: boolean
  className?: string
}) {
  const detectedIso = useMemo(() => detectCountryIsoLocal(), [])
  const hasInitialValue = Boolean(value?.replace(/\D/g, ""))
  // eslint-disable-next-line react-hooks/exhaustive-deps -- monté une fois : sinon chaque frappe réécraserait la sélection pays
  const initial = useMemo(() => splitPhone(value, detectedIso), [])
  const [iso, setIso] = useState(initial.iso)
  const [local, setLocal] = useState(initial.local)
  const geoApplied = useRef(hasInitialValue)

  useEffect(() => {
    if (geoApplied.current) return
    geoApplied.current = true

    let cancelled = false
    async function applyGeo() {
      let nextIso = detectedIso
      try {
        const res = await fetch("/api/geo/country", {
          method: "GET",
          cache: "force-cache",
        })
        if (res.ok) {
          const data = (await res.json()) as { iso?: string | null }
          if (data.iso && isKnownPhoneIso(data.iso) && !cancelled) {
            nextIso = data.iso
          }
        }
      } catch {
        /* fallback local déjà calculé */
      }

      if (cancelled || local) return
      if (nextIso === iso) return
      setIso(nextIso)
    }

    void applyGeo()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- détection unique au montage
  }, [])

  function emit(nextIso: string, nextLocal: string) {
    const dial = countryByIso(nextIso).dial
    onChange(nextLocal ? `+${dial}${nextLocal}` : "")
  }

  const current = countryByIso(iso)

  return (
    <div className={`flex min-w-0 items-stretch gap-2 ${className}`}>
      <select
        aria-label={`Indicatif pays — ${current.label}`}
        value={iso}
        onChange={(e) => {
          const next = e.target.value
          setIso(next)
          emit(next, local)
        }}
        title={current.label}
        className="min-h-11 w-[5.5rem] shrink-0 rounded-md border border-[#DED2AE] bg-[var(--ak-ivory)] px-1.5 text-sm tabular-nums outline-none focus:ring-2 focus:ring-[var(--ak-emerald-mid)]"
      >
        {PHONE_COUNTRIES.map((c) => (
          <option key={c.iso} value={c.iso} title={c.label}>
            {flagEmoji(c.iso)} +{c.dial}
          </option>
        ))}
      </select>
      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        required={required}
        placeholder={placeholder}
        value={local}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, 15)
          setLocal(digits)
          emit(iso, digits)
        }}
        onBlur={onBlur}
        className="min-h-11 min-w-0 flex-1 border-[#DED2AE] bg-[var(--ak-ivory)]"
      />
    </div>
  )
}
