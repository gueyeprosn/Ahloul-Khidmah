"use client"

import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2, Loader2 } from "lucide-react"
import {
  adhesionCompleteSchema,
  type AdhesionCompleteValues,
} from "@/features/adherents/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/shared/phone-input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useOptionalLocale } from "@/components/landing/locale-provider"
import { getFormDict, translateFormError } from "@/i18n/form"
import { MemberCardActions } from "@/components/adhesion/member-card-actions"
import { InlineMessage } from "@/components/shared/inline-message"
import Link from "next/link"

type Props = {
  adherentId: string
  className?: string
  initial?: {
    nom?: string
    prenoms?: string
    tel?: string
    whatsapp?: string
    profession?: string
  }
}

export function AdhesionCompleteForm({
  adherentId,
  className,
  initial,
}: Props) {
  const { locale } = useOptionalLocale()
  const t = getFormDict(locale)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [doneMember, setDoneMember] = useState<{
    prenoms: string
    nom: string
    tel: string
    whatsapp: string
    celluleLocale: string
  } | null>(null)

  const form = useForm<AdhesionCompleteValues>({
    resolver: zodResolver(adhesionCompleteSchema),
    defaultValues: {
      nom: initial?.nom || "",
      prenoms: initial?.prenoms || "",
      whatsapp: initial?.whatsapp || "",
      email: "",
      profession: initial?.profession || "",
      autreProfession: "",
      tel: initial?.tel || "",
    },
  })

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = form

  const err = (message?: string) => translateFormError(message, t)

  const onSubmit = async (values: AdhesionCompleteValues) => {
    setSubmitting(true)
    setApiError(null)
    try {
      const res = await fetch(`/api/adhesions/${adherentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", ...values }),
      })
      const payload = (await res.json()) as {
        error?: string
        adherent?: {
          prenoms: string
          nom: string
          tel: string
          whatsapp: string | null
          celluleLocale: string
        }
      }
      if (!res.ok || !payload.adherent) {
        setApiError(payload.error || t.alerts.saveFailed)
        return
      }
      setDoneMember({
        prenoms: payload.adherent.prenoms,
        nom: payload.adherent.nom,
        tel: payload.adherent.tel,
        whatsapp: payload.adherent.whatsapp || payload.adherent.tel,
        celluleLocale: payload.adherent.celluleLocale,
      })
      setDone(true)
    } catch {
      setApiError(t.alerts.network)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-[var(--ak-gold)] bg-white p-8 text-center",
          className
        )}
      >
        <CheckCircle2 className="mx-auto size-12 text-[var(--ak-emerald-mid)]" />
        <h2 className="mt-4 font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)]">
          {t.complete.doneTitle}
        </h2>
        <p className="mt-2 text-sm text-[var(--ak-ink-soft)]">
          {t.complete.doneSubtitle}
        </p>
        {doneMember ? (
          <div className="mt-8 border-t border-[#E6DCC0] pt-6 text-left">
            <p className="mb-4 text-center text-sm font-semibold text-[var(--ak-emerald-deep)]">
              Votre carte membre
            </p>
            <MemberCardActions
              member={{
                id: adherentId,
                prenoms: doneMember.prenoms,
                nom: doneMember.nom,
                celluleLocale: doneMember.celluleLocale,
                tel: doneMember.tel,
                whatsapp: doneMember.whatsapp,
              }}
            />
          </div>
        ) : null}
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-[var(--ak-emerald-deep)] px-6 py-2.5 text-sm font-semibold text-white"
        >
          {t.complete.home}
        </Link>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={cn("space-y-5 text-[var(--ak-ink)]", className)}
    >
      <p className="rounded-xl border border-[var(--ak-gold)] bg-[var(--ak-ivory)] px-4 py-3 text-sm text-[var(--ak-ink-soft)]">
        {t.complete.intro}
      </p>

      {apiError ? <InlineMessage message={apiError} variant="error" /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="nom">{t.labels.nom}</Label>
          <Input
            id="nom"
            className="mt-1.5 border-[#DED2AE] bg-[var(--ak-ivory)]"
            {...register("nom")}
          />
          {errors.nom ? (
            <p className="mt-1 text-xs text-rose-700">{err(errors.nom.message)}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="prenoms">{t.labels.prenoms}</Label>
          <Input
            id="prenoms"
            className="mt-1.5 border-[#DED2AE] bg-[var(--ak-ivory)]"
            {...register("prenoms")}
          />
          {errors.prenoms ? (
            <p className="mt-1 text-xs text-rose-700">
              {err(errors.prenoms.message)}
            </p>
          ) : null}
        </div>
        <div className="min-w-0 sm:col-span-2">
          <Label htmlFor="tel">{t.labels.tel}</Label>
          <Controller
            control={control}
            name="tel"
            render={({ field }) => (
              <PhoneInput
                id="tel"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                className="mt-1.5"
              />
            )}
          />
          <p className="mt-1 text-xs text-[var(--ak-ink-soft)]">
            {t.complete.telHint}
          </p>
          {errors.tel ? (
            <p className="mt-1 text-xs text-rose-700">{err(errors.tel.message)}</p>
          ) : null}
        </div>
        <div className="min-w-0 sm:col-span-2">
          <Label htmlFor="whatsapp">{t.labels.whatsapp}</Label>
          <Controller
            control={control}
            name="whatsapp"
            render={({ field }) => (
              <PhoneInput
                id="whatsapp"
                value={field.value || ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                className="mt-1.5"
              />
            )}
          />
        </div>
        <div>
          <Label htmlFor="email">{t.labels.email}</Label>
          <Input
            id="email"
            type="email"
            placeholder={t.placeholders.email}
            className="mt-1.5 border-[#DED2AE] bg-[var(--ak-ivory)]"
            {...register("email")}
          />
          {errors.email ? (
            <p className="mt-1 text-xs text-rose-700">
              {err(errors.email.message)}
            </p>
          ) : null}
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="profession">{t.labels.profession}</Label>
          <Input
            id="profession"
            placeholder="Ex: Enseignant, Commerçant, Informaticien…"
            className="mt-1.5 border-[#DED2AE] bg-[var(--ak-ivory)]"
            {...register("profession")}
          />
          {errors.profession ? (
            <p className="mt-1 text-xs text-rose-700">
              {err(errors.profession.message)}
            </p>
          ) : null}
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="autreProfession">
            {t.labels.autreProfession}{" "}
            <span className="font-normal text-[var(--ak-ink-soft)] italic">
              {t.labels.optional}
            </span>
          </Label>
          <Textarea
            id="autreProfession"
            placeholder={t.placeholders.autreProfession}
            className="mt-1.5 min-h-20 border-[#DED2AE] bg-[var(--ak-ivory)]"
            {...register("autreProfession")}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="ak-cta-solid h-auto w-full rounded-2xl px-8 py-3.5 text-base font-bold hover:opacity-100"
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {t.actions.submitting}
          </>
        ) : (
          t.complete.submit
        )}
      </Button>
    </form>
  )
}
