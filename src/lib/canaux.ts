/** Agrégation canaux : en ligne (paydunya + legacy) vs cellule */
export function canalBucket(canal: string): "en_ligne" | "cellule" {
  if (canal === "cellule") return "cellule"
  return "en_ligne"
}

export function canalBucketLabel(bucket: "en_ligne" | "cellule") {
  return bucket === "en_ligne" ? "En ligne (PayDunya)" : "Versement cellule"
}
