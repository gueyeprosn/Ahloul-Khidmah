"use client"

import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Loader2 } from "lucide-react"
import {
  CONTRIBUTION_AMOUNTS,
  CONTRIBUTION_CAMPAGNES,
  contributionSchema,
  type ContributionFormValues,
} from "@/features/contributions/schema"
import { getContributeDict } from "@/i18n/contribute"
import { useOptionalLocale } from "@/components/landing/locale-provider"
import { SoftPayPanel } from "@/components/payments/softpay-panel"
import { PostPaymentCelebration } from "@/components/payments/post-payment-celebration"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/shared/phone-input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-rose-700">{message}</p>
}

function Section({
  step,
  title,
  subtitle,
  children,
}: {
  step: string
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-[#E6DCC0] bg-white p-5 shadow-[0_10px_30px_rgba(11,58,37,0.08)] md:p-7">
      <div className="mb-6 flex items-center gap-3 border-b border-dashed border-[var(--ak-gold-light)] pb-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--ak-emerald-mid),var(--ak-emerald-deep))] font-[family-name:var(--font-amiri)] text-lg text-[var(--ak-gold-light)] shadow-[inset_0_0_0_2px_var(--ak-gold)]">
          {step}
        </div>
        <div>
          <h3 className="font-[family-name:var(--font-amiri)] text-xl text-[var(--ak-emerald-deep)]">
            {title}
          </h3>
          <p className="text-xs text-[var(--ak-ink-soft)]">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

const cellClass = (active: boolean, compact = false) =>
  cn(
    "flex cursor-pointer items-center rounded-xl border-2 transition-all",
    compact ? "gap-2 px-2.5 py-2" : "gap-3 px-4 py-3.5",
    active
      ? "border-[var(--ak-emerald-mid)] bg-[#E7F0EA]"
      : "border-[#E6DCC0] bg-[var(--ak-ivory)] hover:border-[var(--ak-gold)]"
  )

export function ContributeForm({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  const { locale } = useOptionalLocale()
  const t = getContributeDict(locale).form
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [payerPhone, setPayerPhone] = useState("")
  const [showMessage, setShowMessage] = useState(false)
  const [celebrate, setCelebrate] = useState(false)

  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      prenoms: "",
      nom: "",
      tel: "",
      email: "",
      montant: "10000",
      montantAutre: "",
      campagne: "general",
      message: "",
      anonymous: false,
      website: "",
    },
  })

  const anonymous = form.watch("anonymous")
  const montant = form.watch("montant")
  const campagne = form.watch("campagne")

  useEffect(() => {
    if (!paymentId) return
    requestAnimationFrame(() => {
      // Petite marge de sécurité si le clavier mobile était encore en
      // train de se refermer : on laisse la mise en page se stabiliser
      // avant de mesurer où se trouve le panneau de paiement.
      window.setTimeout(() => {
        document.getElementById("softpay-contribuer")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }, 250)
    })
  }, [paymentId])

  async function onSubmit(values: ContributionFormValues) {
    // Ferme le clavier virtuel mobile dès la soumission (pas après la
    // réponse réseau, pour lui laisser le temps de se refermer) : sinon,
    // sa fermeture peut décaler la page après coup et le défilement vers
    // le paiement rate sa cible.
    ;(document.activeElement as HTMLElement | null)?.blur()
    setSubmitting(true)
    setApiError(null)
    try {
      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const data = (await res.json()) as {
        error?: string
        paymentId?: string
      }
      if (!res.ok) {
        setApiError(data.error || "Erreur lors de la contribution")
        return
      }
      if (data.paymentId) {
        setPayerPhone(values.tel || "")
        setPaymentId(data.paymentId)
        return
      }
      setApiError("Paiement indisponible — réessayez")
    } catch {
      setApiError("Erreur réseau — réessayez")
    } finally {
      setSubmitting(false)
    }
  }

  if (paymentId) {
    return (
      <div
        id="softpay-contribuer"
        className={cn("scroll-mt-24 space-y-3", className)}
      >
        <p className="text-center text-sm font-medium text-[var(--ak-emerald-deep)]">
          {t.successTitle}
        </p>
        <SoftPayPanel
          paymentId={paymentId}
          defaultPhone={payerPhone}
          compact
          hideHeader
          onCompleted={() => setCelebrate(true)}
        />

        {celebrate ? (
          <PostPaymentCelebration
            paymentId={paymentId}
            kind="don"
            onClose={() => setCelebrate(false)}
          />
        ) : null}
      </div>
    )
  }

  if (compact) {
    return (
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("space-y-3", className)}
        noValidate
      >
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
          aria-hidden
          {...form.register("website")}
        />

        {apiError ? (
          <p
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
            role="alert"
          >
            {apiError}
          </p>
        ) : null}

        {/* Montant — prioritaire, visible sans scroll */}
        <div>
          <Label className="text-sm">{t.amount}</Label>
          <RadioGroup
            value={montant}
            onValueChange={(v) =>
              form.setValue("montant", v as ContributionFormValues["montant"], {
                shouldValidate: true,
              })
            }
            className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3"
          >
            {CONTRIBUTION_AMOUNTS.map((a) => (
              <label
                key={a.value}
                className={cellClass(montant === a.value, true)}
              >
                <RadioGroupItem value={a.value} className="size-3.5" />
                <span className="text-xs font-medium leading-tight sm:text-sm">
                  {a.label}
                </span>
              </label>
            ))}
          </RadioGroup>
          <FieldError message={form.formState.errors.montant?.message} />
          {montant === "autre" ? (
            <Input
              placeholder={t.otherAmount}
              className="mt-1.5 min-h-10 border-[#DED2AE] bg-[var(--ak-ivory)]"
              {...form.register("montantAutre")}
            />
          ) : null}
        </div>

        {/* Campagne = select compact */}
        <div>
          <Label htmlFor="campagne" className="text-sm">
            {t.campagne}
          </Label>
          <select
            id="campagne"
            value={campagne}
            onChange={(e) =>
              form.setValue(
                "campagne",
                e.target.value as ContributionFormValues["campagne"],
                { shouldValidate: true }
              )
            }
            className="mt-1.5 min-h-10 w-full cursor-pointer rounded-xl border-2 border-[#E6DCC0] bg-[var(--ak-ivory)] px-3 text-sm outline-none focus:border-[var(--ak-emerald-mid)]"
          >
            {CONTRIBUTION_CAMPAGNES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Identité compacte */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="anonymous"
            checked={Boolean(anonymous)}
            onCheckedChange={(v) => form.setValue("anonymous", Boolean(v))}
          />
          <Label
            htmlFor="anonymous"
            className="cursor-pointer text-sm font-normal"
          >
            {t.anonymous}
          </Label>
        </div>

        {!anonymous ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="min-w-0">
              <Input
                placeholder={t.prenoms}
                className="min-h-10 border-[#DED2AE] bg-[var(--ak-ivory)]"
                {...form.register("prenoms")}
              />
              <FieldError message={form.formState.errors.prenoms?.message} />
            </div>
            <div className="min-w-0">
              <Input
                placeholder={t.nom}
                className="min-h-10 border-[#DED2AE] bg-[var(--ak-ivory)]"
                {...form.register("nom")}
              />
              <FieldError message={form.formState.errors.nom?.message} />
            </div>
            <div className="col-span-2 min-w-0">
              <Controller
                control={form.control}
                name="tel"
                render={({ field }) => (
                  <PhoneInput
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
              <FieldError message={form.formState.errors.tel?.message} />
            </div>
            <div className="col-span-2 min-w-0">
              <Input
                type="email"
                placeholder={t.email}
                className="min-h-10 border-[#DED2AE] bg-[var(--ak-ivory)]"
                {...form.register("email")}
              />
              <FieldError message={form.formState.errors.email?.message} />
            </div>
          </div>
        ) : (
          <Controller
            control={form.control}
            name="tel"
            render={({ field }) => (
              <PhoneInput
                value={field.value || ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        )}

        {!showMessage ? (
          <button
            type="button"
            onClick={() => setShowMessage(true)}
            className="cursor-pointer text-xs text-[var(--ak-emerald-mid)] underline-offset-2 hover:underline"
          >
            + {t.message}
          </button>
        ) : (
          <Textarea
            className="min-h-16 border-[#DED2AE] bg-[var(--ak-ivory)]"
            rows={2}
            placeholder={t.messageHint}
            {...form.register("message")}
          />
        )}

        <div className="sticky bottom-0 z-20 -mx-4 border-t border-[#E6DCC0] bg-white/95 px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <Button
            type="submit"
            disabled={submitting}
            className="ak-cta-solid h-11 min-h-11 w-full cursor-pointer rounded-xl text-sm font-bold"
          >
            {submitting ? (
              <>
                <Loader2 className="me-2 size-4 animate-spin" />
                {t.submitting}
              </>
            ) : (
              t.submit
            )}
          </Button>
        </div>
      </form>
    )
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("space-y-6", className)}
      noValidate
    >
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        aria-hidden
        {...form.register("website")}
      />

      <div className="flex items-start gap-2.5 rounded-2xl border border-[var(--ak-gold)] bg-[var(--ak-ivory)] px-4 py-4 text-sm text-[var(--ak-ink-soft)] md:px-5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--ak-emerald-deep)] text-[var(--ak-gold-light)]">
          <Check className="size-4" aria-hidden />
        </span>
        <p>
          <strong className="text-[var(--ak-emerald-deep)]">{t.title}</strong>
          {" — "}
          {t.subtitle}
        </p>
      </div>

      {apiError ? (
        <p
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          role="alert"
        >
          {apiError}
        </p>
      ) : null}

      <Section step="1" title={t.identityTitle} subtitle={t.identitySubtitle}>
        <div className="flex items-center gap-3 rounded-xl border-2 border-[#E6DCC0] bg-[var(--ak-ivory)] px-4 py-3">
          <Checkbox
            id="anonymous-full"
            checked={Boolean(anonymous)}
            onCheckedChange={(v) => form.setValue("anonymous", Boolean(v))}
          />
          <Label
            htmlFor="anonymous-full"
            className="cursor-pointer text-sm font-normal"
          >
            {t.anonymous}
          </Label>
        </div>

        {!anonymous ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <Label htmlFor="prenoms">{t.prenoms}</Label>
              <Input
                id="prenoms"
                className="mt-1.5 border-[#DED2AE] bg-[var(--ak-ivory)]"
                {...form.register("prenoms")}
              />
              <FieldError message={form.formState.errors.prenoms?.message} />
            </div>
            <div className="min-w-0">
              <Label htmlFor="nom">{t.nom}</Label>
              <Input
                id="nom"
                className="mt-1.5 border-[#DED2AE] bg-[var(--ak-ivory)]"
                {...form.register("nom")}
              />
              <FieldError message={form.formState.errors.nom?.message} />
            </div>
            <div className="min-w-0 sm:col-span-2">
              <Label htmlFor="tel">{t.tel}</Label>
              <Controller
                control={form.control}
                name="tel"
                render={({ field }) => (
                  <PhoneInput
                    id="tel"
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    className="mt-1.5"
                  />
                )}
              />
              <FieldError message={form.formState.errors.tel?.message} />
            </div>
            <div className="min-w-0 sm:col-span-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                className="mt-1.5 border-[#DED2AE] bg-[var(--ak-ivory)]"
                {...form.register("email")}
              />
              <FieldError message={form.formState.errors.email?.message} />
            </div>
          </div>
        ) : null}
      </Section>

      <Section step="2" title={t.amountTitle} subtitle={t.amountSubtitle}>
        <Label>{t.amount}</Label>
        <RadioGroup
          value={montant}
          onValueChange={(v) =>
            form.setValue("montant", v as ContributionFormValues["montant"], {
              shouldValidate: true,
            })
          }
          className="mt-2 grid gap-2 sm:grid-cols-2"
        >
          {CONTRIBUTION_AMOUNTS.map((a) => (
            <label key={a.value} className={cellClass(montant === a.value)}>
              <RadioGroupItem value={a.value} />
              <span className="text-sm font-medium">{a.label}</span>
            </label>
          ))}
        </RadioGroup>
        <FieldError message={form.formState.errors.montant?.message} />
        {montant === "autre" ? (
          <div className="mt-3">
            <Label htmlFor="montantAutre">{t.otherAmount}</Label>
            <Input
              id="montantAutre"
              className="mt-1.5 border-[#DED2AE] bg-[var(--ak-ivory)]"
              {...form.register("montantAutre")}
            />
            <FieldError message={form.formState.errors.montantAutre?.message} />
          </div>
        ) : null}

        <div className="mt-5">
          <Label>{t.campagne}</Label>
          <RadioGroup
            value={campagne}
            onValueChange={(v) =>
              form.setValue(
                "campagne",
                v as ContributionFormValues["campagne"],
                { shouldValidate: true }
              )
            }
            className="mt-2 grid gap-2 sm:grid-cols-2"
          >
            {CONTRIBUTION_CAMPAGNES.map((c) => (
              <label
                key={c.value}
                className={cellClass(campagne === c.value)}
              >
                <RadioGroupItem value={c.value} />
                <span className="text-sm font-medium">{c.label}</span>
              </label>
            ))}
          </RadioGroup>
          <FieldError message={form.formState.errors.campagne?.message} />
        </div>
      </Section>

      <Section step="3" title={t.messageTitle} subtitle={t.messageSubtitle}>
        <Textarea
          className="border-[#DED2AE] bg-[var(--ak-ivory)]"
          rows={3}
          placeholder={t.messageHint}
          {...form.register("message")}
        />
      </Section>

      <Button
        type="submit"
        disabled={submitting}
        className="ak-cta-solid h-12 min-h-12 w-full cursor-pointer rounded-2xl text-sm font-bold"
      >
        {submitting ? (
          <>
            <Loader2 className="me-2 size-4 animate-spin" />
            {t.submitting}
          </>
        ) : (
          t.submit
        )}
      </Button>
      <p className="text-center text-xs text-[var(--ak-ink-soft)]">{t.note}</p>
    </form>
  )
}
