export const DOMAINES = [
  "Artisanat",
  "Métiers du Bâtiment",
  "Informatique",
  "Systèmes d'Information",
  "Santé",
  "Action Sociale",
  "Sciences Religieuses",
  "Éducation",
  "Gestion de Projet",
  "Management",
  "Agriculture",
  "Élevage / Rural",
  "Communication",
  "Stratégie Médias",
  "Transport",
  "Logistique Urbaine",
  "Droit",
  "Ingénierie Institutionnelle",
] as const

export const MONTANTS = [
  { value: "1400", label: "1 400 FCFA", sub: "par mois" },
  { value: "14000", label: "14 000 FCFA", sub: "par mois" },
  { value: "140000", label: "140 000 FCFA", sub: "par mois" },
  { value: "autre", label: "Autre montant", sub: "libre, à préciser" },
] as const

/** Canaux affichés au public : en ligne vs cellule */
export const CANAUX = [
  {
    value: "paydunya",
    label: "Payer en ligne",
    sub: "Wave, Orange Money, carte…",
  },
  {
    value: "cellule",
    label: "Versement cellule",
    sub: "Espèces, en cellule locale",
  },
] as const

/** Anciens canaux (données historiques / admin) */
export const CANAUX_LEGACY = [
  { value: "wave", label: "Wave", sub: "Application mobile" },
  { value: "orange", label: "Orange Money", sub: "Application mobile" },
] as const
