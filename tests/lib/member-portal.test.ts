import { describe, it, expect, beforeEach } from "vitest"
import { prisma } from "@/lib/db"
import { findAdherentByTelAndCode } from "@/lib/member-portal"
import { memberIdSuffix } from "@/lib/member-access"
import { hashMemberPin } from "@/lib/member-pin"
import { rid } from "../helpers"

function makeAdherentData(overrides: Partial<Parameters<typeof prisma.adherent.create>[0]["data"]> = {}) {
  const id = rid("AK-TEST")
  return {
    id,
    celluleLocale: "À préciser",
    zoneRegion: "Dakar",
    nom: "Diop",
    prenoms: "Awa",
    dateNaissance: "1990-01-01",
    cni: rid("CNI"),
    nationalite: "Sénégalaise",
    adresse: "Dakar",
    tel: "+221770000001",
    profession: "Commerçante",
    montant: "1000",
    canal: "en_ligne",
    status: "actif",
    ...overrides,
  }
}

describe("findAdherentByTelAndCode", () => {
  beforeEach(async () => {
    await prisma.adherent.deleteMany({ where: { tel: { startsWith: "+22177000" } } })
  })

  it("sans PIN défini : le suffixe d'ID (4 derniers caractères) fonctionne", async () => {
    const adherent = await prisma.adherent.create({ data: makeAdherentData() })
    const suffix = memberIdSuffix(adherent.id)
    const found = await findAdherentByTelAndCode(adherent.tel, suffix)
    expect(found?.id).toBe(adherent.id)
  })

  it(
    "une fois un PIN défini : le suffixe d'ID ne fonctionne plus (audit sécurité V-04 — " +
      "un PIN personnel doit désactiver l'accès par identifiant public, jamais coexister avec lui)",
    async () => {
      const pinHash = await hashMemberPin("4242")
      const adherent = await prisma.adherent.create({ data: makeAdherentData({ pinHash }) })
      const suffix = memberIdSuffix(adherent.id)

      const viaSuffix = await findAdherentByTelAndCode(adherent.tel, suffix)
      expect(viaSuffix).toBeNull()

      const viaPin = await findAdherentByTelAndCode(adherent.tel, "4242")
      expect(viaPin?.id).toBe(adherent.id)
    }
  )

  it("PIN défini : un mauvais PIN échoue (et ne retombe pas sur le suffixe)", async () => {
    const pinHash = await hashMemberPin("4242")
    const adherent = await prisma.adherent.create({ data: makeAdherentData({ pinHash }) })
    const found = await findAdherentByTelAndCode(adherent.tel, "0000")
    expect(found).toBeNull()
  })

  it("téléphone inconnu : retourne null", async () => {
    const found = await findAdherentByTelAndCode("+221779999999", "ABCD")
    expect(found).toBeNull()
  })
})
