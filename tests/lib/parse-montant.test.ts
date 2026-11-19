import { describe, it, expect } from "vitest"
import { parseMontantFcfa } from "@/lib/adherents-shared"

describe("parseMontantFcfa (montant « autre »)", () => {
  it.each([
    ["5000", 5000],
    ["5 000", 5000],
    ["5.000", 5000],
    ["5,000", 5000],
    ["5000 FCFA", 5000],
    ["5000F", 5000],
    ["10 000 f cfa", 10000],
  ])("« %s » → %i", (saisie, attendu) => {
    expect(parseMontantFcfa("autre", saisie)).toBe(attendu)
  })

  it("renvoie 0 pour une saisie illisible", () => {
    expect(parseMontantFcfa("autre", "abc")).toBe(0)
    expect(parseMontantFcfa("autre", "")).toBe(0)
  })

  it("garde les montants fixes", () => {
    expect(parseMontantFcfa("1400")).toBe(1400)
    expect(parseMontantFcfa("14000")).toBe(14000)
  })
})
