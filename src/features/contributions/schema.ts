import { z } from "zod"

const str = (min: number, max: number, message: string) =>
  z.string().trim().min(min, message).max(max)

export const CONTRIBUTION_AMOUNTS = [
  { value: "5000", label: "5 000 FCFA" },
  { value: "10000", label: "10 000 FCFA" },
  { value: "25000", label: "25 000 FCFA" },
  { value: "50000", label: "50 000 FCFA" },
  { value: "autre", label: "Autre montant" },
] as const

export const CONTRIBUTION_CAMPAGNES = [
  { value: "general", label: "Soutien général" },
  { value: "touba", label: "Projets à Touba" },
  { value: "magal", label: "Magal / grands événements" },
  { value: "education", label: "Éducation & compétences" },
  { value: "autre", label: "Autre" },
] as const

export const contributionSchema = z
  .object({
    prenoms: z.string().trim().max(120).optional().or(z.literal("")),
    nom: z.string().trim().max(80).optional().or(z.literal("")),
    tel: z.string().trim().max(32).optional().or(z.literal("")),
    email: z
      .string()
      .trim()
      .max(160)
      .email("Email invalide")
      .optional()
      .or(z.literal("")),
    montant: z.enum(["5000", "10000", "25000", "50000", "autre"], {
      message: "Choisissez un montant",
    }),
    montantAutre: z.string().trim().max(32).optional().or(z.literal("")),
    campagne: z.enum(
      ["general", "touba", "magal", "education", "autre"],
      { message: "Choisissez une destination" }
    ),
    message: z.string().trim().max(500).optional().or(z.literal("")),
    anonymous: z.boolean().optional(),
    website: z.string().max(100).optional(),
  })
  .superRefine((data, ctx) => {
    if ((data.website ?? "").trim().length > 0) {
      ctx.addIssue({
        code: "custom",
        message: "Requête rejetée",
        path: ["website"],
      })
    }
    if (data.montant === "autre") {
      const n = Number(String(data.montantAutre || "").replace(/\s/g, ""))
      if (!Number.isFinite(n) || n < 500) {
        ctx.addIssue({
          code: "custom",
          message: "Montant minimum 500 FCFA",
          path: ["montantAutre"],
        })
      }
    }
    if (!data.anonymous) {
      if (!data.prenoms || data.prenoms.trim().length < 2) {
        ctx.addIssue({
          code: "custom",
          message: "Prénom requis (ou cochez anonyme)",
          path: ["prenoms"],
        })
      }
      if (!data.tel || data.tel.trim().length < 8) {
        ctx.addIssue({
          code: "custom",
          message: "Téléphone requis (ou cochez anonyme)",
          path: ["tel"],
        })
      }
    }
  })

export type ContributionFormValues = z.infer<typeof contributionSchema>

export function parseContributionAmount(
  montant: string,
  montantAutre?: string | null
): number {
  if (montant === "autre") {
    const n = Number(String(montantAutre || "").replace(/\s/g, ""))
    return Number.isFinite(n) ? n : 0
  }
  const n = Number(montant)
  return Number.isFinite(n) ? n : 0
}

export function campagneLabel(campagne: string) {
  return (
    CONTRIBUTION_CAMPAGNES.find((c) => c.value === campagne)?.label || campagne
  )
}
