/**
 * Raisons d'ajustement de stock — liste fixe pour l'admin boutique.
 * La valeur envoyée à l'API / journal est le `label` (lisible).
 */
export const STOCK_ADJUST_REASONS = [
  { id: "reapprovisionnement", label: "Réapprovisionnement" },
  { id: "correction", label: "Correction d'inventaire" },
  { id: "stock_limite", label: "Stock limité" },
  { id: "precommande", label: "Précommande" },
  { id: "rupture", label: "Rupture de stock" },
  { id: "retour", label: "Retour client" },
  { id: "casse", label: "Produit endommagé / perdu" },
  { id: "erreur", label: "Erreur de saisie" },
  { id: "autre", label: "Autre…" },
] as const

export type StockAdjustReasonId = (typeof STOCK_ADJUST_REASONS)[number]["id"]

export function stockAdjustReasonLabel(id: string): string | undefined {
  return STOCK_ADJUST_REASONS.find((r) => r.id === id)?.label
}
