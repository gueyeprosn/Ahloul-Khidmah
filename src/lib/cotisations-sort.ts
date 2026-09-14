type SortableRow = {
  paidAt: string | null
  nom: string
  prenoms: string
}

/**
 * Trie par date de paiement — les plus récemment payées en premier, les
 * non payées (paidAt null) relégées en fin de liste (ordre alphabétique
 * entre elles, pour un rendu stable).
 */
export function sortCotisationRows<T extends SortableRow>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    if (a.paidAt && b.paidAt) return b.paidAt.localeCompare(a.paidAt)
    if (a.paidAt && !b.paidAt) return -1
    if (!a.paidAt && b.paidAt) return 1
    return a.nom.localeCompare(b.nom) || a.prenoms.localeCompare(b.prenoms)
  })
}
