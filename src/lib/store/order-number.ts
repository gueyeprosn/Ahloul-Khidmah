import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"

async function nextOrderSeq(year: number): Promise<number> {
  const count = await prisma.order.count({
    where: { orderNumber: { startsWith: `AK-${year}-` } },
  })
  return count + 1
}

/**
 * Numéro de commande lisible et public (ex. AK-2026-000123) — jamais l'id
 * interne (cuid). Même esprit que createAdherentWithMemberNumber : calcul
 * sans verrou, nouvelle tentative si collision (deux commandes créées au
 * même instant peuvent calculer le même numéro).
 */
export function generateOrderNumber(year: number, seq: number): string {
  return `AK-${year}-${String(seq).padStart(6, "0")}`
}

export async function createOrderWithNumber(
  data: Omit<Prisma.OrderUncheckedCreateInput, "orderNumber"> & {
    items: Prisma.OrderItemUncheckedCreateWithoutOrderInput[]
  }
) {
  const year = new Date().getFullYear()
  const MAX_ATTEMPTS = 20
  const { items, ...orderData } = data

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const seq = await nextOrderSeq(year)
    const orderNumber = generateOrderNumber(year, seq)
    try {
      return await prisma.order.create({
        data: {
          ...orderData,
          orderNumber,
          items: { create: items },
        },
        include: { items: true },
      })
    } catch (e) {
      const isOrderNumberConflict =
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002" &&
        String(e.meta?.target ?? "").includes("orderNumber")
      if (!isOrderNumberConflict || attempt === MAX_ATTEMPTS) throw e
      await new Promise((r) => setTimeout(r, 10 + Math.random() * 30))
    }
  }
  throw new Error("Impossible d'attribuer un numéro de commande")
}
