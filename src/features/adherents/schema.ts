import { z } from "zod"

const str = (min: number, max: number, message: string) =>
  z.string().trim().min(min, message).max(max)

/** Formulaire public allégé : identité + montant, paiement en ligne direct */
export const adhesionLightSchema = z
  .object({
    nom: str(2, 80, "Nom requis"),
    prenoms: str(2, 120, "Prénom(s) requis"),
    tel: str(8, 32, "Téléphone requis"),
    /** Pays ou région (Sénégal, France, Touba, Dakar…) */
    paysRegion: str(2, 120, "Indiquez votre pays ou région"),
    montant: z.enum(["1400", "14000", "140000", "autre"], {
      message: "Choisissez un montant",
    }),
    montantAutre: z.string().trim().max(32).optional().or(z.literal("")),
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
    if (data.montant === "autre" && !data.montantAutre?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Précisez le montant",
        path: ["montantAutre"],
      })
    }
  })

export type AdhesionLightValues = z.infer<typeof adhesionLightSchema>

/** Complétion de fiche (après paiement) — version simplifiée */
export const adhesionCompleteSchema = z.object({
  nom: str(2, 80, "Nom requis"),
  prenoms: str(2, 120, "Prénom(s) requis"),
  tel: str(8, 32, "Téléphone requis"),
  whatsapp: z.string().trim().max(32).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .max(160)
    .email("Email invalide")
    .optional()
    .or(z.literal("")),
  profession: str(2, 120, "Profession requise"),
  autreProfession: z.string().trim().max(500).optional().or(z.literal("")),
})

export type AdhesionCompleteValues = z.infer<typeof adhesionCompleteSchema>

/**
 * Inscription admin allégée : identité + cellule + cotisation (espèces).
 * N° d’adhésion / memberNumber générés côté serveur.
 */
export const adhesionAdminSchema = z
  .object({
    celluleLocale: str(2, 120, "Indiquez la cellule locale"),
    zoneRegion: str(2, 120, "Indiquez la zone / région"),
    nom: str(2, 80, "Nom requis"),
    prenoms: str(2, 120, "Prénom(s) requis"),
    tel: str(8, 32, "Téléphone requis"),
    whatsapp: z.string().trim().max(32).optional().or(z.literal("")),
    email: z
      .string()
      .trim()
      .max(160)
      .email("Email invalide")
      .optional()
      .or(z.literal("")),
    profession: z.string().trim().max(120).optional().or(z.literal("")),
    montant: z.enum(["1400", "14000", "140000", "autre"], {
      message: "Choisissez un montant",
    }),
    montantAutre: z.string().trim().max(32).optional().or(z.literal("")),
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
    if (data.montant === "autre" && !data.montantAutre?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Précisez le montant",
        path: ["montantAutre"],
      })
    }
  })

export type AdhesionAdminValues = z.infer<typeof adhesionAdminSchema>

/** Correction de profil par un admin (erreurs de saisie). */
export const adhesionAdminUpdateSchema = z
  .object({
    nom: str(2, 80, "Nom requis"),
    prenoms: str(2, 120, "Prénom(s) requis"),
    tel: str(8, 32, "Téléphone requis"),
    whatsapp: z.string().trim().max(32).optional().or(z.literal("")),
    email: z
      .string()
      .trim()
      .max(160)
      .email("Email invalide")
      .optional()
      .or(z.literal("")),
    profession: z.string().trim().max(120).optional().or(z.literal("")),
    autreProfession: z.string().trim().max(500).optional().or(z.literal("")),
    celluleLocale: str(2, 120, "Cellule requise"),
    zoneRegion: str(2, 120, "Zone / région requise"),
    montant: z.enum(["1400", "14000", "140000", "autre"], {
      message: "Choisissez un montant",
    }),
    montantAutre: z.string().trim().max(32).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.montant === "autre" && !data.montantAutre?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Précisez le montant",
        path: ["montantAutre"],
      })
    }
  })

export type AdhesionAdminUpdateValues = z.infer<typeof adhesionAdminUpdateSchema>

/** @deprecated Conservé pour compat ; préférer adhesionAdminSchema */
export const adhesionSchema = adhesionAdminSchema
export type AdhesionFormValues = AdhesionAdminValues
