import { prisma } from "@/lib/db"

export type AuditAction =
  | "admin.create"
  | "admin.activate"
  | "admin.deactivate"
  | "cotisation.record"
  | "cotisation.update"
  | "contribution.status_change"
  | "parametres.update"
  | "payment.reconcile_as_don"
  | "store.product_create"
  | "store.product_update"
  | "store.product_archive"
  | "store.order_status_change"
  | "store.inventory_adjustment"
  | "store.coupon_create"
  | "store.coupon_update"
  | "store.coupon_toggle"
  | "store.review_moderate"
  | "store.collection_create"
  | "store.collection_update"
  | "store.collection_toggle"
  | "store.collection_product_add"
  | "store.collection_product_remove"

/**
 * Trace une action sensible dans le journal d'activité. N'échoue jamais
 * l'action métier elle-même : une erreur ici est journalisée côté serveur
 * et avalée, l'action principale (déjà effectuée) reste valide.
 */
export async function logAudit(
  admin: { id: string; name: string },
  action: AuditAction,
  entityType: string,
  entityId?: string | null,
  details?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action,
        entityType,
        entityId: entityId ?? null,
        details: details ?? null,
      },
    })
  } catch (e) {
    console.error("audit log failed", e)
  }
}
