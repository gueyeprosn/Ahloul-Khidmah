export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  PROCESSING: "En préparation",
  READY: "Prête",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
  FAILED: "Échouée",
}

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  UNPAID: "Non payée",
  PENDING: "En attente",
  PAID: "Payée",
  FAILED: "Échouée",
  REFUNDED: "Remboursée",
}

/**
 * Transitions manuelles valides depuis chaque statut (le serveur les fait
 * respecter). PENDING → PROCESSING n'apparaît jamais ici : ce passage ne se
 * produit qu'automatiquement à la confirmation réelle du paiement PayDunya
 * (webhook / poll), jamais via une action admin — un statut ne doit jamais
 * pouvoir simuler un paiement qui n'a pas eu lieu.
 * REFUNDED enregistre qu'un remboursement a été fait par un autre moyen
 * (PayDunya, virement...) et restocke — ce système n'exécute pas lui-même
 * de remboursement PayDunya.
 */
export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CANCELLED"],
  PROCESSING: ["READY", "REFUNDED"],
  READY: ["SHIPPED", "REFUNDED"],
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
  FAILED: [],
}

export function canTransition(from: string, to: string): boolean {
  return (ORDER_STATUS_TRANSITIONS[from] || []).includes(to)
}
