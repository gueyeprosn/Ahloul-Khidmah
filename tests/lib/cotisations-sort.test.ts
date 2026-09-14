import { describe, it, expect } from "vitest"
import { sortCotisationRows } from "@/lib/cotisations-sort"

function row(nom: string, prenoms: string, paidAt: string | null) {
  return { nom, prenoms, paidAt }
}

describe("sortCotisationRows", () => {
  it("place les paiements les plus récents en premier", () => {
    const rows = [
      row("Diop", "Awa", "2026-09-01T10:00:00.000Z"),
      row("Ba", "Modou", "2026-09-10T10:00:00.000Z"),
      row("Fall", "Ndèye", "2026-09-05T10:00:00.000Z"),
    ]
    const sorted = sortCotisationRows(rows)
    expect(sorted.map((r) => r.nom)).toEqual(["Ba", "Fall", "Diop"])
  })

  it("relègue les non-payés (paidAt null) en fin de liste", () => {
    const rows = [
      row("Zorro", "Non payé", null),
      row("Ba", "Modou", "2026-09-10T10:00:00.000Z"),
      row("Aba", "En attente", null),
    ]
    const sorted = sortCotisationRows(rows)
    expect(sorted.map((r) => r.nom)).toEqual(["Ba", "Aba", "Zorro"])
  })

  it("trie les non-payés entre eux par nom puis prénom", () => {
    const rows = [row("Sow", "Awa", null), row("Ba", "Modou", null), row("Ba", "Awa", null)]
    const sorted = sortCotisationRows(rows)
    expect(sorted.map((r) => `${r.nom} ${r.prenoms}`)).toEqual([
      "Ba Awa",
      "Ba Modou",
      "Sow Awa",
    ])
  })

  it("ne modifie pas le tableau d'origine", () => {
    const rows = [row("Sow", "Awa", null), row("Ba", "Modou", "2026-09-10T10:00:00.000Z")]
    const original = [...rows]
    sortCotisationRows(rows)
    expect(rows).toEqual(original)
  })
})
