"use client"

import { useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Loader2 } from "lucide-react"
import {
  adhesionAdminSchema,
  adhesionLightSchema,
  type AdhesionAdminValues,
  type AdhesionLightValues,
} from "@/features/adherents/schema"
import { MONTANTS } from "@/features/adherents/constants"
import { AdhesionSuccess } from "@/components/adhesion/adhesion-success"
import {
  formatMontantLabel,
  persistTicket,
  type AdhesionTicket,
} from "@/lib/adhesion-id"
import { SoftPayPanel } from "@/components/payments/softpay-panel"
import { PostPaymentCelebration } from "@/components/payments/post-payment-celebration"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/shared/phone-input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { useOptionalLocale } from "@/components/landing/locale-provider"
import { getFormDict, translateFormError } from "@/i18n/form"
import { CelluleCombobox } from "@/components/adhesion/cellule-combobox"

type PaymentPreview = {
  nom: string
  prenoms: string
  tel: string
  montant: string
  montantAutre?: string
}

type AdhesionFormProps = {
  defaultMontant?: string
  className?: string
  /** public = formulaire court ; admin = inscription dashboard allégée */
  mode?: "light" | "full" | "admin"
  /** espacements réduits (page d'accueil) */
  compact?: boolean
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-rose-700">{message}</p>
}

function Section({
  step,
  title,
  subtitle,
  children,
  compact = false,
}: {
  step: string
  title: string
  subtitle: string
  children: React.ReactNode
  compact?: boolean
}) {
  return (
    <section
      className={cn(
        compact
          ? "border-b border-dashed border-[var(--ak-gold-light)] pb-4 last:border-0 last:pb-0"
          : "rounded-2xl border border-[#E6DCC0] bg-white p-5 shadow-[0_10px_30px_rgba(11,58,37,0.08)] md:p-7"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2.5",
          compact
            ? "mb-3"
            : "mb-6 border-b border-dashed border-[var(--ak-gold-light)] pb-4"
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--ak-emerald-mid),var(--ak-emerald-deep))] font-[family-name:var(--font-amiri)] text-[var(--ak-gold-light)] shadow-[inset_0_0_0_2px_var(--ak-gold)]",
            compact ? "size-8 text-base" : "size-10 text-lg"
          )}
        >
          {step}
        </div>
        <div>
          <h3
            className={cn(
              "font-[family-name:var(--font-amiri)] text-[var(--ak-emerald-deep)]",
              compact ? "text-lg" : "text-xl"
            )}
          >
            {title}
          </h3>
          {!compact ? (
            <p className="text-xs text-[var(--ak-ink-soft)]">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  )
}

export function AdhesionForm({
  defaultMontant,
  className,
  mode = "light",
  compact = false,
}: AdhesionFormProps) {
  const { locale } = useOptionalLocale()
  const t = getFormDict(locale)
  const [ticket, setTicket] = useState<AdhesionTicket | null>(null)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const initialMontant = useMemo(() => {
    if (
      defaultMontant === "1400" ||
      defaultMontant === "14000" ||
      defaultMontant === "140000" ||
      defaultMontant === "autre"
    ) {
      return defaultMontant
    }
    return undefined
  }, [defaultMontant])

  if (mode === "full" || mode === "admin") {
    return (
      <AdhesionFormAdmin
        className={className}
        initialMontant={initialMontant}
        ticket={ticket}
        setTicket={setTicket}
        paymentUrl={paymentUrl}
        setPaymentUrl={setPaymentUrl}
        paymentId={paymentId}
        setPaymentId={setPaymentId}
        submitting={submitting}
        setSubmitting={setSubmitting}
      />
    )
  }

  return (
    <AdhesionFormLight
      className={className}
      compact={compact}
      initialMontant={initialMontant}
      paymentUrl={paymentUrl}
      setPaymentUrl={setPaymentUrl}
      paymentId={paymentId}
      setPaymentId={setPaymentId}
      submitting={submitting}
      setSubmitting={setSubmitting}
    />
  )
}

type SharedState = {
  className?: string
  initialMontant?: "1400" | "14000" | "140000" | "autre"
  ticket: AdhesionTicket | null
  setTicket: (t: AdhesionTicket | null) => void
  paymentUrl: string | null
  setPaymentUrl: (u: string | null) => void
  paymentId: string | null
  setPaymentId: (id: string | null) => void
  submitting: boolean
  setSubmitting: (v: boolean) => void
}

function AdhesionFormLight({
  className,
  compact = false,
  initialMontant,
  paymentUrl,
  setPaymentUrl,
  paymentId,
  setPaymentId,
  submitting,
  setSubmitting,
}: Omit<SharedState, "ticket" | "setTicket"> & { compact?: boolean }) {
  const { locale } = useOptionalLocale()
  const t = getFormDict(locale)
  const [paymentPreview, setPaymentPreview] = useState<PaymentPreview | null>(
    null
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [celebrate, setCelebrate] = useState(false)

  const form = useForm<AdhesionLightValues>({
    resolver: zodResolver(adhesionLightSchema),
    defaultValues: {
      nom: "",
      prenoms: "",
      tel: "",
      paysRegion: "",
      montant: initialMontant,
      montantAutre: "",
      website: "",
    },
  })

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = form

  const montant = watch("montant")

  useEffect(() => {
    if (initialMontant) {
      setValue("montant", initialMontant, { shouldValidate: true })
    }
  }, [initialMontant, setValue])

  const err = (message?: string) => translateFormError(message, t)

  const onSubmit = async (values: AdhesionLightValues) => {
    // Ferme le clavier virtuel mobile dès la soumission (pas après la
    // réponse réseau, pour lui laisser le temps de se refermer) : sinon,
    // sa fermeture peut décaler la page après coup et le défilement vers
    // le paiement rate sa cible (visiteur qui se retrouve sur le hero).
    ;(document.activeElement as HTMLElement | null)?.blur()
    setSubmitting(true)
    setFormError(null)
    try {
      const res = await fetch("/api/adhesions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, mode: "light" }),
      })
      const payload = (await res.json()) as {
        error?: string
        paymentUrl?: string | null
        paymentId?: string | null
        preview?: PaymentPreview
      }
      if (!res.ok || !payload.paymentId || !payload.preview) {
        setFormError(payload.error || t.alerts.saveFailed)
        return
      }
      setPaymentPreview(payload.preview)
      if (payload.paymentUrl) setPaymentUrl(payload.paymentUrl)
      setPaymentId(payload.paymentId)
      requestAnimationFrame(() => {
        // Petite marge de sécurité si le clavier était encore en train de
        // se refermer : on laisse la mise en page se stabiliser avant de
        // mesurer où se trouve le panneau de paiement.
        window.setTimeout(() => {
          document.getElementById("softpay-adhesion")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
        }, 250)
      })
    } catch {
      setFormError(t.alerts.network)
    } finally {
      setSubmitting(false)
    }
  }

  if (paymentPreview && paymentId) {
    const fullName =
      `${paymentPreview.prenoms} ${paymentPreview.nom}`.trim()
    const montantLabel = formatMontantLabel(paymentPreview.montant)

    return (
      <div
        id="softpay-adhesion"
        dir={locale === "ar" ? "rtl" : "ltr"}
        lang={locale === "ar" ? "ar" : "fr"}
        className={cn("scroll-mt-24 space-y-3", className)}
      >
        <div className="rounded-xl border border-[var(--ak-gold)] bg-[var(--ak-ivory)] px-3 py-2.5 md:px-4">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
            <p className="font-medium text-[var(--ak-emerald-deep)]">
              {fullName}
            </p>
            <p className="font-semibold text-[var(--ak-emerald-deep)]">
              {montantLabel}
            </p>
          </div>
          <p className="mt-1 text-xs text-[var(--ak-ink-soft)]">
            {t.light.payment.subtitle}
          </p>
        </div>

        <SoftPayPanel
          paymentId={paymentId}
          defaultPhone={paymentPreview.tel}
          compact
          hideHeader
          labels={{
            title: t.light.payment.title,
            subtitle: t.light.payment.subtitle,
          }}
          onCompleted={() => setCelebrate(true)}
        />

        {celebrate ? (
          <PostPaymentCelebration
            paymentId={paymentId}
            kind="adhesion"
            onClose={() => setCelebrate(false)}
          />
        ) : null}

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setPaymentPreview(null)
              setPaymentUrl(null)
              setPaymentId(null)
              reset({
                montant: initialMontant,
                website: "",
                paysRegion: "",
              })
            }}
            className="cursor-pointer text-sm text-[var(--ak-ink-soft)] underline-offset-4 hover:underline"
          >
            {t.light.payment.cancel}
          </button>
        </div>
      </div>
    )
  }

  if (paymentPreview) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-800",
          className
        )}
      >
        <p>{t.light.payment.errorNoPayment}</p>
        <button
          type="button"
          onClick={() => {
            setPaymentPreview(null)
            setPaymentUrl(null)
            setPaymentId(null)
          }}
          className="mt-4 text-[var(--ak-emerald-deep)] underline-offset-4 hover:underline"
        >
          {t.light.payment.cancel}
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      dir={locale === "ar" ? "rtl" : "ltr"}
      lang={locale === "ar" ? "ar" : "fr"}
      className={cn(
        "ak-adhesion-form relative text-[var(--ak-ink)]",
        compact ? "space-y-4" : "space-y-6",
        className
      )}
      id="ak-adhesion-fiche"
    >
      <Honeypot register={register} />

      {formError ? (
        <p
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          role="alert"
        >
          {formError}
        </p>
      ) : null}

      <div
        className={cn(
          "flex items-start gap-2.5 rounded-xl border border-[var(--ak-gold)]/60 bg-[var(--ak-ivory)] text-sm text-[var(--ak-ink-soft)]",
          compact ? "px-3 py-2.5" : "px-4 py-4 md:px-5 md:py-5 lg:px-6"
        )}
      >
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full bg-[var(--ak-emerald-deep)] text-[var(--ak-gold-light)]",
            compact ? "size-8" : "size-9 md:size-10"
          )}
        >
          <Check className={compact ? "size-4" : "size-5"} aria-hidden />
        </span>
        <p className={compact ? "text-sm" : "md:text-base"}>
          {t.light.intro.before}{" "}
          <strong className="text-[var(--ak-emerald-deep)]">
            {t.light.intro.brand}
          </strong>{" "}
          {t.light.intro.after}
        </p>
      </div>

      <div className={cn("grid lg:grid-cols-2 lg:items-start", compact ? "gap-4" : "gap-6")}>
        <Section
          compact={compact}
          step={t.light.steps[0]}
          title={t.light.sections.identity.title}
          subtitle={t.light.sections.identity.subtitle}
        >
          <div className={cn("grid sm:grid-cols-2", compact ? "gap-3" : "gap-4")}>
            <div>
              <Label htmlFor="nom">{t.labels.nom}</Label>
              <Input
                id="nom"
                className="mt-1.5 min-h-11 border-[#DED2AE] bg-[var(--ak-ivory)]"
                {...register("nom")}
              />
              <FieldError message={err(errors.nom?.message)} />
            </div>
            <div>
              <Label htmlFor="prenoms">{t.labels.prenoms}</Label>
              <Input
                id="prenoms"
                className="mt-1.5 min-h-11 border-[#DED2AE] bg-[var(--ak-ivory)]"
                {...register("prenoms")}
              />
              <FieldError message={err(errors.prenoms?.message)} />
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
              <FieldError message={err(errors.tel?.message)} />
            </div>
            <div className="min-w-0 sm:col-span-2">
              <Label htmlFor="paysRegion">{t.labels.paysRegion}</Label>
              <Input
                id="paysRegion"
                placeholder={t.placeholders.paysRegion}
                className="mt-1.5 min-h-11 border-[#DED2AE] bg-[var(--ak-ivory)]"
                {...register("paysRegion")}
              />
              <FieldError message={err(errors.paysRegion?.message)} />
            </div>
          </div>
        </Section>

        <Section
          compact={compact}
          step={t.light.steps[1]}
          title={t.light.sections.contrib.title}
          subtitle={t.light.sections.contrib.subtitle}
        >
          <MontantOnlyFields
            compact={compact}
            montant={montant}
            setValue={setValue}
            register={register}
            errors={errors}
            t={t}
            err={err}
          />
        </Section>
      </div>

      <div
        className={cn(
          "ak-no-print flex flex-col items-center",
          compact
            ? "sticky bottom-0 z-20 -mx-3 gap-2 border-t border-[#E6DCC0] bg-white/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none"
            : "gap-3 pt-2"
        )}
      >
        <Button
          type="submit"
          disabled={submitting}
          className={cn(
            "ak-cta-solid h-auto min-h-12 w-full cursor-pointer rounded-2xl font-bold hover:opacity-100 sm:w-auto",
            compact ? "px-8 py-3 text-sm" : "px-10 py-4 text-base"
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t.actions.submitting}
            </>
          ) : (
            t.light.actions.submit
          )}
        </Button>
        <p className="text-xs text-[var(--ak-ink-soft)]">{t.actions.required}</p>
      </div>
    </form>
  )
}

function AdhesionFormAdmin({
  className,
  initialMontant,
  ticket,
  setTicket,
  paymentUrl,
  setPaymentUrl,
  paymentId,
  setPaymentId,
  submitting,
  setSubmitting,
}: SharedState) {
  const { locale } = useOptionalLocale()
  const t = getFormDict(locale)

  const form = useForm<AdhesionAdminValues>({
    resolver: zodResolver(adhesionAdminSchema),
    defaultValues: {
      celluleLocale: "",
      zoneRegion: "",
      nom: "",
      prenoms: "",
      tel: "",
      whatsapp: "",
      email: "",
      profession: "",
      montant: initialMontant,
      montantAutre: "",
      website: "",
    },
  })

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = form

  const montant = watch("montant")

  useEffect(() => {
    if (initialMontant) {
      setValue("montant", initialMontant, { shouldValidate: true })
    }
  }, [initialMontant, setValue])

  const err = (message?: string) => translateFormError(message, t)

  const onSubmit = async (values: AdhesionAdminValues) => {
    setSubmitting(true)
    try {
      const res = await fetch("/api/adhesions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, mode: "admin" }),
      })
      const payload = (await res.json()) as {
        error?: string
        ticket?: AdhesionTicket
        paymentUrl?: string | null
        paymentId?: string | null
      }
      if (!res.ok || !payload.ticket) {
        alert(payload.error || t.alerts.saveFailed)
        return
      }
      persistTicket(payload.ticket)
      setTicket(payload.ticket)
      if (payload.paymentUrl) setPaymentUrl(payload.paymentUrl)
      if (payload.paymentId) setPaymentId(payload.paymentId)
    } catch {
      alert(t.alerts.network)
    } finally {
      setSubmitting(false)
    }
  }

  if (ticket) {
    return (
      <AdhesionSuccess
        ticket={ticket}
        paymentUrl={paymentUrl}
        paymentId={paymentId}
        onReset={() => {
          setTicket(null)
          setPaymentUrl(null)
          setPaymentId(null)
          reset({
            celluleLocale: "",
            zoneRegion: "",
            nom: "",
            prenoms: "",
            tel: "",
            whatsapp: "",
            email: "",
            profession: "",
            montant: initialMontant,
            montantAutre: "",
            website: "",
          })
        }}
        className={className}
      />
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      dir={locale === "ar" ? "rtl" : "ltr"}
      lang={locale === "ar" ? "ar" : "fr"}
      className={cn(
        "ak-adhesion-form relative space-y-6 text-[var(--ak-ink)]",
        className
      )}
      id="ak-adhesion-fiche"
    >
      <Honeypot register={register} />

      <div className="flex items-start gap-3 rounded-2xl border border-[var(--ak-gold)] bg-[var(--ak-ivory)] px-4 py-4 text-sm text-[var(--ak-ink-soft)] md:px-5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--ak-emerald-deep)] text-[var(--ak-gold-light)]">
          <Check className="size-4" aria-hidden />
        </span>
        <p>
          Le <strong className="text-[var(--ak-emerald-deep)]">N° d&apos;adhésion</strong>{" "}
          et le numéro de membre sont générés automatiquement à l&apos;enregistrement.
          Cotisation enregistrée comme versement en cellule (espèces).
        </p>
      </div>

      <Section
        step="1"
        title="Cellule & zone"
        subtitle="Localisation du membre"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="celluleLocale">{t.labels.celluleLocale}</Label>
            <CelluleCombobox
              id="celluleLocale"
              value={watch("celluleLocale") || ""}
              onChange={(v) =>
                setValue("celluleLocale", v, { shouldValidate: true })
              }
              placeholder={t.placeholders.celluleLocale}
              className="mt-1.5 border-[#DED2AE] bg-[var(--ak-ivory)]"
            />
            <FieldError message={err(errors.celluleLocale?.message)} />
          </div>
          <div>
            <Label htmlFor="zoneRegion">{t.labels.zoneRegion}</Label>
            <Input
              id="zoneRegion"
              placeholder={t.placeholders.zoneRegion}
              className="mt-1.5 border-[#DED2AE] bg-[var(--ak-ivory)]"
              {...register("zoneRegion")}
            />
            <FieldError message={err(errors.zoneRegion?.message)} />
          </div>
        </div>
      </Section>

      <Section
        step="2"
        title="Identité"
        subtitle="Informations essentielles"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="nom">{t.labels.nom}</Label>
            <Input
              id="nom"
              className="mt-1.5 border-[#DED2AE] bg-[var(--ak-ivory)]"
              {...register("nom")}
            />
            <FieldError message={err(errors.nom?.message)} />
          </div>
          <div>
            <Label htmlFor="prenoms">{t.labels.prenoms}</Label>
            <Input
              id="prenoms"
              className="mt-1.5 border-[#DED2AE] bg-[var(--ak-ivory)]"
              {...register("prenoms")}
            />
            <FieldError message={err(errors.prenoms?.message)} />
          </div>
          <div>
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
            <FieldError message={err(errors.tel?.message)} />
          </div>
          <div>
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
          <div className="sm:col-span-2">
            <Label htmlFor="email">
              {t.labels.email}{" "}
              <span className="font-normal text-[var(--ak-ink-soft)] italic">
                {t.labels.optional}
              </span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={t.placeholders.email}
              className="mt-1.5 border-[#DED2AE] bg-[var(--ak-ivory)]"
              {...register("email")}
            />
            <FieldError message={err(errors.email?.message)} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="profession">
              {t.labels.profession}{" "}
              <span className="font-normal text-[var(--ak-ink-soft)] italic">
                {t.labels.optional}
              </span>
            </Label>
            <Input
              id="profession"
              className="mt-1.5 border-[#DED2AE] bg-[var(--ak-ivory)]"
              {...register("profession")}
            />
          </div>
        </div>
      </Section>

      <Section
        step="3"
        title="Cotisation"
        subtitle="Montant déjà versé en cellule"
      >
        <MontantOnlyFields
          montant={montant}
          setValue={setValue}
          register={register}
          errors={errors}
          t={t}
          err={err}
        />
      </Section>

      <div className="ak-no-print flex flex-col items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={submitting}
          className="ak-cta-solid h-auto rounded-2xl px-10 py-4 text-base font-bold hover:opacity-100"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t.actions.submitting}
            </>
          ) : (
            "Créer l'adhérent"
          )}
        </Button>
        <p className="text-xs text-[var(--ak-ink-soft)]">{t.actions.required}</p>
      </div>
    </form>
  )
}

function Honeypot({
  register,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any
}) {
  return (
    <div
      aria-hidden
      className="ak-no-print absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
    >
      <label htmlFor="website">Site web</label>
      <input
        id="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        {...register("website")}
      />
    </div>
  )
}

function MontantOnlyFields({
  montant,
  setValue,
  register,
  errors,
  t,
  err,
  compact = false,
}: {
  montant?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any
  t: ReturnType<typeof getFormDict>
  err: (m?: string) => string | undefined
  compact?: boolean
}) {
  const montantSubs = (value: string, frSub: string) => {
    if (value === "autre") return t.montants.autreSub
    if (frSub === "par mois") return t.montants.perMonth
    return frSub
  }

  const montantLabel = (value: string, frLabel: string) => {
    if (value === "autre") return t.montants.autre
    return frLabel
  }

  return (
    <>
      <Label>{t.labels.montant}</Label>
      <RadioGroup
        value={montant || ""}
        onValueChange={(value) =>
          setValue("montant", value, { shouldValidate: true })
        }
        className={cn(
          "grid sm:grid-cols-2",
          compact ? "mt-2 gap-2" : "mt-3 gap-3"
        )}
      >
        {MONTANTS.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer items-center rounded-xl border-2 transition-all",
              compact ? "gap-2.5 px-3 py-2.5" : "gap-3 px-4 py-3.5",
              montant === option.value
                ? "border-[var(--ak-emerald-mid)] bg-[#E7F0EA]"
                : "border-[#E6DCC0] bg-[var(--ak-ivory)] hover:border-[var(--ak-gold)]"
            )}
          >
            <RadioGroupItem value={option.value} />
            <span>
              <span className="block font-bold text-[var(--ak-emerald-deep)]">
                {montantLabel(option.value, option.label)}
              </span>
              <span className="block text-xs text-[var(--ak-ink-soft)]">
                {montantSubs(option.value, option.sub)}
              </span>
            </span>
          </label>
        ))}
      </RadioGroup>
      <FieldError message={err(errors.montant?.message)} />

      {montant === "autre" ? (
        <div className={compact ? "mt-2" : "mt-3"}>
          <Input
            placeholder={t.placeholders.montantAutre}
            className="border-[#DED2AE] bg-[var(--ak-ivory)]"
            {...register("montantAutre")}
          />
          <FieldError message={err(errors.montantAutre?.message)} />
        </div>
      ) : null}
    </>
  )
}
