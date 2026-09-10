export function parseMontantFcfa(
  montant: string,
  montantAutre?: string | null
): number {
  if (montant === "1400") return 1400
  if (montant === "14000") return 14000
  if (montant === "140000") return 140000
  if (montant === "autre") {
    const n = Number(String(montantAutre || "").replace(/\s/g, ""))
    return Number.isFinite(n) ? n : 0
  }
  const n = Number(montant)
  return Number.isFinite(n) ? n : 0
}

export function canalLabel(canal: string) {
  if (canal === "wave") return "Wave"
  if (canal === "orange") return "Orange Money"
  if (canal === "cellule") return "Versement cellule"
  if (canal === "paydunya") return "En ligne (PayDunya)"
  if (canal === "don") return "Don"
  return canal
}

export function statusLabel(status: string) {
  if (status === "actif") return "Actif"
  if (status === "en_attente") return "En attente"
  if (status === "archive") return "Archivé"
  return status
}
