import { prisma } from "@/lib/db"

/** "Fatou Diop" → "Fatou D." — un peu de confidentialité pour un avis public. */
export function displayReviewerName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  const first = parts[0]
  const lastInitial = parts[parts.length - 1][0]
  return `${first} ${lastInitial}.`
}

export async function getApprovedReviews(productId: string, take = 20) {
  return prisma.review.findMany({
    where: { productId, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take,
  })
}

export async function getReviewStats(productId: string) {
  const result = await prisma.review.aggregate({
    where: { productId, status: "APPROVED" },
    _avg: { rating: true },
    _count: { _all: true },
  })
  return {
    average: result._avg.rating ? Math.round(result._avg.rating * 10) / 10 : 0,
    count: result._count._all,
  }
}

export async function getReviewStatsForProducts(productIds: string[]) {
  if (productIds.length === 0) return new Map<string, { average: number; count: number }>()
  const rows = await prisma.review.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds }, status: "APPROVED" },
    _avg: { rating: true },
    _count: { _all: true },
  })
  const map = new Map<string, { average: number; count: number }>()
  for (const r of rows) {
    map.set(r.productId, {
      average: r._avg.rating ? Math.round(r._avg.rating * 10) / 10 : 0,
      count: r._count._all,
    })
  }
  return map
}
