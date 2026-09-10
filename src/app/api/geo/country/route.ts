import { NextRequest, NextResponse } from "next/server"
import { isKnownPhoneIso } from "@/lib/phone-countries"

/** Alias éventuels (Cloudflare / CDN / IP lookup). */
const ALIASES: Record<string, string> = {
  UK: "GB",
}

function normalizeIso(raw: string | null | undefined): string | null {
  if (!raw) return null
  const iso = ALIASES[raw.trim().toUpperCase()] || raw.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(iso)) return null
  if (iso === "XX" || iso === "T1") return null
  return isKnownPhoneIso(iso) ? iso : null
}

/**
 * Indique le pays probable du visiteur (ISO) pour préremplir l'indicatif téléphone.
 * Ordre : en-tête CDN → lookup IP léger → null (le client retombe sur le fuseau).
 */
export async function GET(req: NextRequest) {
  const headerCandidates = [
    req.headers.get("cf-ipcountry"),
    req.headers.get("x-vercel-ip-country"),
    req.headers.get("x-country-code"),
    req.headers.get("cloudfront-viewer-country"),
  ]

  for (const h of headerCandidates) {
    const iso = normalizeIso(h)
    if (iso) {
      return NextResponse.json(
        { iso, source: "header" },
        { headers: { "Cache-Control": "private, max-age=3600" } }
      )
    }
  }

  const forwarded = req.headers.get("x-forwarded-for")
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    ""

  if (
    ip &&
    !ip.startsWith("127.") &&
    !ip.startsWith("10.") &&
    !ip.startsWith("192.168.") &&
    ip !== "::1"
  ) {
    try {
      const ctrl = AbortSignal.timeout(1800)
      const res = await fetch(
        `https://ipapi.co/${encodeURIComponent(ip)}/country_code/`,
        {
          signal: ctrl,
          headers: { Accept: "text/plain" },
          next: { revalidate: 86400 },
        }
      )
      if (res.ok) {
        const text = (await res.text()).trim()
        const iso = normalizeIso(text)
        if (iso) {
          return NextResponse.json(
            { iso, source: "ip" },
            { headers: { "Cache-Control": "private, max-age=3600" } }
          )
        }
      }
    } catch {
      /* ignore */
    }
  }

  return NextResponse.json(
    { iso: null, source: "none" },
    { headers: { "Cache-Control": "private, max-age=300" } }
  )
}
