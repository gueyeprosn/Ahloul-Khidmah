"use client"

import Image from "next/image"
import Link from "next/link"
import { Mail, MapPin, Phone } from "lucide-react"
import { contact } from "@/content/landing"
import { useLocale } from "@/components/landing/locale-provider"
import { STORE_PUBLIC_ENABLED } from "@/lib/store/store-status"

const FOOTER_LINKS = [
  { href: "/qui-sommes-nous", key: "about" as const },
  { href: "/adhesion", key: "adhesion" as const },
  { href: "/contribuer", key: "contribute" as const },
  ...(STORE_PUBLIC_ENABLED ? [{ href: "/boutique", key: "store" as const }] : []),
  { href: "/mon-espace", key: "monEspace" as const },
  { href: "/mediatheque", key: "mediatheque" as const },
  { href: "/mission", key: "mission" as const },
  { href: "/vision", key: "vision" as const },
  { href: "/faq", key: "faq" as const },
]

export function LandingFooter() {
  const { dict } = useLocale()

  return (
    <footer className="border-t border-[var(--ak-gold)]/20 bg-[#061f14] px-5 py-14 md:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/brand/logo.png"
              alt="Ahloul Khidmah — logo"
              width={44}
              height={44}
              className="size-11 rounded-full object-cover ring-1 ring-[var(--ak-gold)]/40"
            />
            <div>
              <p className="font-[family-name:var(--font-amiri)] text-xl text-[var(--ak-ivory)]">
                Ahloul Khidmah
              </p>
              <p className="text-sm text-[var(--ak-ivory)]/50">
                {dict.footer.community}
              </p>
            </div>
          </div>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-[var(--ak-ivory)]/55">
            {dict.footer.slogan}
          </p>
        </div>

        <div className="space-y-4 text-sm text-[var(--ak-ivory)]/75">
          <a
            href={contact.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 hover:text-[var(--ak-gold-light)]"
          >
            <Phone className="size-4 shrink-0 text-[var(--ak-gold)]" />
            WhatsApp {contact.whatsappDisplay}
          </a>
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-3 hover:text-[var(--ak-gold-light)]"
          >
            <Mail className="size-4 shrink-0 text-[var(--ak-gold)]" />
            {contact.email}
          </a>
          <a
            href={contact.website}
            className="flex items-center gap-3 hover:text-[var(--ak-gold-light)]"
          >
            <span className="flex size-4 shrink-0 items-center justify-center text-[var(--ak-gold)]">
              ↗
            </span>
            www.ahloulkhidmah.org
          </a>
          <p className="flex items-center gap-3">
            <MapPin className="size-4 shrink-0 text-[var(--ak-gold)]" />
            {dict.contact.address}
          </p>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-6xl flex-wrap gap-6 border-t border-white/10 pt-8 text-sm text-[var(--ak-ivory)]/45">
        {FOOTER_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="hover:text-[var(--ak-gold-light)]"
          >
            {dict.footer[link.key]}
          </Link>
        ))}
        <Link
          href="/mentions-legales"
          className="hover:text-[var(--ak-gold-light)]"
        >
          Mentions légales
        </Link>
        <Link
          href="/confidentialite"
          className="hover:text-[var(--ak-gold-light)]"
        >
          Confidentialité
        </Link>
      </div>

      <p className="mx-auto mt-8 max-w-6xl text-xs text-[var(--ak-ivory)]/35">
        © {new Date().getFullYear()} Ahloul Khidmah — {dict.contact.address}
      </p>
    </footer>
  )
}
