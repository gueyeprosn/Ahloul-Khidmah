import { prisma } from "@/lib/db"

export async function getWalletBalance(adherentId: string) {
  const agg = await prisma.walletTransaction.groupBy({
    by: ["type"],
    where: { adherentId },
    _sum: { amount: true },
  })
  const credits = agg.find((r) => r.type === "credit")?._sum.amount ?? 0
  const debits = agg.find((r) => r.type === "debit")?._sum.amount ?? 0
  return credits - debits
}

export async function getWalletTransactions(
  adherentId: string,
  take = 50
) {
  return prisma.walletTransaction.findMany({
    where: { adherentId },
    orderBy: { createdAt: "desc" },
    take,
  })
}

/** Ajoute un crédit au wallet (paiement reçu, etc.). */
export async function walletCredit(opts: {
  adherentId: string
  amount: number
  label: string
  reference?: string
}) {
  return prisma.walletTransaction.create({
    data: {
      adherentId: opts.adherentId,
      type: "credit",
      amount: opts.amount,
      label: opts.label,
      reference: opts.reference || null,
    },
  })
}

/** Ajoute un débit au wallet (cotisation due, etc.). */
export async function walletDebit(opts: {
  adherentId: string
  amount: number
  label: string
  reference?: string
}) {
  return prisma.walletTransaction.create({
    data: {
      adherentId: opts.adherentId,
      type: "debit",
      amount: opts.amount,
      label: opts.label,
      reference: opts.reference || null,
    },
  })
}

export function serializeWalletTransaction(tx: {
  id: string
  type: string
  amount: number
  label: string
  reference: string | null
  createdAt: Date
}) {
  return {
    id: tx.id,
    type: tx.type as "credit" | "debit",
    amount: tx.amount,
    label: tx.label,
    reference: tx.reference,
    createdAt: tx.createdAt.toISOString(),
  }
}
