import { describe, it, expect } from "vitest"
import { buildCollecteSeries } from "@/lib/rapports-collectes"

describe("buildCollecteSeries", () => {
  const now = new Date(2026, 8, 14) // 14 septembre 2026 (lundi)

  it("regroupe par jour et remplit les jours sans encaissement à zéro", () => {
    const series = buildCollecteSeries(
      [{ date: new Date(2026, 8, 14, 10), montant: 1000 }],
      [{ date: new Date(2026, 8, 13, 9), montant: 500 }],
      "jour",
      3,
      now
    )
    expect(series).toHaveLength(3)
    // le plus récent en premier
    expect(series[0].key).toBe("2026-09-14")
    expect(series[0].cotisations).toBe(1000)
    expect(series[0].dons).toBe(0)
    expect(series[0].total).toBe(1000)

    expect(series[1].key).toBe("2026-09-13")
    expect(series[1].dons).toBe(500)
    expect(series[1].total).toBe(500)

    expect(series[2].key).toBe("2026-09-12")
    expect(series[2].total).toBe(0)
  })

  it("regroupe par semaine (début lundi)", () => {
    const series = buildCollecteSeries(
      [
        { date: new Date(2026, 8, 14), montant: 200 }, // lundi de la semaine courante
        { date: new Date(2026, 8, 10), montant: 300 }, // jeudi de la semaine précédente
      ],
      [],
      "semaine",
      2,
      now
    )
    expect(series).toHaveLength(2)
    expect(series[0].cotisations).toBe(200)
    expect(series[1].cotisations).toBe(300)
  })

  it("regroupe par mois", () => {
    const series = buildCollecteSeries(
      [{ date: new Date(2026, 8, 1), montant: 1500 }],
      [{ date: new Date(2026, 7, 20), montant: 2500 }],
      "mois",
      2,
      now
    )
    expect(series).toHaveLength(2)
    expect(series[0].key).toBe("2026-09")
    expect(series[0].cotisations).toBe(1500)
    expect(series[1].key).toBe("2026-08")
    expect(series[1].dons).toBe(2500)
  })

  it("ignore les encaissements hors de la fenêtre demandée", () => {
    const series = buildCollecteSeries(
      [{ date: new Date(2026, 0, 1), montant: 999 }],
      [],
      "jour",
      3,
      now
    )
    expect(series.reduce((s, b) => s + b.cotisations, 0)).toBe(0)
  })
})
