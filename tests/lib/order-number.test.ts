import { describe, it, expect, beforeEach } from "vitest"
import { generateOrderNumber, createOrderWithNumber } from "@/lib/store/order-number"
import { resetStoreTables } from "../helpers"

describe("generateOrderNumber", () => {
  it("formate AK-<année>-<numéro sur 6 chiffres>", () => {
    expect(generateOrderNumber(2026, 1)).toBe("AK-2026-000001")
    expect(generateOrderNumber(2026, 123)).toBe("AK-2026-000123")
  })
})

describe("createOrderWithNumber", () => {
  beforeEach(async () => {
    await resetStoreTables()
  })

  it("attribue des numéros séquentiels croissants", async () => {
    const base = {
      customerName: "Cliente",
      customerPhone: "+221771112233",
      subtotal: 1000,
      total: 1000,
      status: "PENDING",
      paymentStatus: "UNPAID",
      items: [],
    }
    const o1 = await createOrderWithNumber(base)
    const o2 = await createOrderWithNumber(base)
    expect(o1.orderNumber).not.toBe(o2.orderNumber)
    expect(o2.orderNumber > o1.orderNumber).toBe(true)
  })

  it("reste correct même en cas de collision (retry) — aucun doublon possible", async () => {
    const base = {
      customerName: "Cliente",
      customerPhone: "+221771112233",
      subtotal: 1000,
      total: 1000,
      status: "PENDING",
      paymentStatus: "UNPAID",
      items: [],
    }
    const results = await Promise.all(Array.from({ length: 8 }, () => createOrderWithNumber(base)))
    const numbers = results.map((o) => o.orderNumber)
    expect(new Set(numbers).size).toBe(numbers.length)
  })
})
