"use client"

import { useState } from "react"
import Image from "next/image"
import { Check, Copy, MessageCircle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { contact } from "@/content/landing"
import { formatFcfa } from "@/lib/format"

export type WaveFallback = {
  number: string
  amount: number
  reference: string
}

type CopyKey = "number" | "reference"

/**
 * Pop-up de secours : le paiement en ligne est indisponible, on paie par Wave.
 * Trois gestes : copier le numéro, payer dans Wave, envoyer la preuve sur
 * WhatsApp (message déjà rédigé, avec la référence pour le rapprochement).
 */
export function WaveFallbackDialog({
  info,
  fullName,
  onClose,
}: {
  info: WaveFallback | null
  fullName?: string
  onClose: () => void
}) {
  const [copied, setCopied] = useState<CopyKey | null>(null)

  async function copy(key: CopyKey, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
    } catch {
      /* copie impossible : la valeur reste affichée */
    }
  }

  const proofHref = info
    ? `${contact.whatsappHref}?text=${encodeURIComponent(
        `Bonjour, j'ai envoyé ma contribution d'adhésion de ${formatFcfa(info.amount)} par Wave au ${info.number}.` +
          `\nRéférence : ${info.reference}` +
          (fullName ? `\nNom : ${fullName}` : "")
      )}`
    : "#"

  return (
    <AlertDialog
      open={info !== null}
      onOpenChange={(open) => {
        if (!open) {
          setCopied(null)
          onClose()
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogTitle>Bienvenue, vous êtes membre ✓</AlertDialogTitle>
        <AlertDialogDescription asChild>
          <div className="space-y-4">
            <p>
              Votre adhésion est enregistrée. Le paiement en ligne est
              momentanément indisponible : envoyez simplement votre
              contribution avec <strong>Wave</strong>, en 2 minutes.
            </p>

            <div className="space-y-1">
              <p className="font-semibold text-[var(--ak-emerald-deep)]">
                1. Ouvrez Wave et envoyez votre contribution de {info ? formatFcfa(info.amount) : ""} à ce numéro Wave
              </p>
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center justify-center gap-3 rounded-xl bg-[#F4EFDD] px-3 py-2">
                  <Image
                    src="/brand/wave-logo.png"
                    alt="Wave"
                    width={230}
                    height={101}
                    className="h-9 w-auto shrink-0"
                  />
                  <span className="text-lg font-semibold tracking-wide text-[var(--ak-emerald-deep)]">
                    {info?.number}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    info && copy("number", info.number.replace(/\s/g, ""))
                  }
                  aria-label="Copier le numéro Wave"
                >
                  {copied === "number" ? (
                    <Check className="size-4" aria-hidden />
                  ) : (
                    <Copy className="size-4" aria-hidden />
                  )}
                  {copied === "number" ? "Copié" : "Copier"}
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-[var(--ak-emerald-deep)]">
                2. Écrivez cette référence dans le message du transfert
              </p>
              <div className="flex items-center gap-2">
                <p className="flex-1 rounded-xl border border-[#E6DCC0] px-4 py-2 text-center font-mono text-sm">
                  {info?.reference}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => info && copy("reference", info.reference)}
                  aria-label="Copier la référence"
                >
                  {copied === "reference" ? (
                    <Check className="size-4" aria-hidden />
                  ) : (
                    <Copy className="size-4" aria-hidden />
                  )}
                  {copied === "reference" ? "Copié" : "Copier"}
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-[var(--ak-emerald-deep)]">
                3. Envoyez la preuve de paiement
              </p>
              <a
                href={proofHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white"
              >
                <MessageCircle className="size-4" aria-hidden />
                Envoyer la preuve sur WhatsApp
              </a>
              <p className="text-xs">
                Message déjà rédigé. Merci de votre confiance !
              </p>
            </div>
          </div>
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>Fermer</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
