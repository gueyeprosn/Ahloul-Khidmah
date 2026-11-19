import { beforeEach, describe, expect, it, vi } from "vitest"
import { prisma } from "@/lib/db"
import { createAdherentFromForm } from "@/lib/adherents"

let session: { adherentId: string; name: string } | null = null
vi.mock("@/lib/member-auth", () => ({ getMemberSession: async () => session }))

const createCheckoutInvoice = vi.fn(async (_input: { customer?: { phone?: string } }) => ({ token: "tok-membre-contrib", url: "https://pay.test/x" }))
vi.mock("@/lib/paydunya", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/paydunya")>()
  return {
    ...actual,
    paydunyaConfigured: () => true,
    createCheckoutInvoice: (input: { customer?: { phone?: string } }) => createCheckoutInvoice(input),
  }
})

import { POST } from "@/app/api/mon-espace/contribution/route"

const req = (body: unknown) =>
  new Request("http://localhost/api/mon-espace/contribution", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `10.8.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` },
    body: JSON.stringify(body),
  })

async function clean() {
  await prisma.payment.deleteMany({ where: { token: "tok-membre-contrib" } })
  await prisma.payment.deleteMany({ where: { customerName: { contains: "TESTMCONTRIB" } } })
  await prisma.contribution.deleteMany({ where: { nom: "TESTMCONTRIB" } })
  await prisma.adherent.deleteMany({ where: { nom: "TESTMCONTRIB" } })
}

describe("POST /api/mon-espace/contribution", () => {
  beforeEach(async () => {
    session = null
    createCheckoutInvoice.mockClear()
    await clean()
  })

  it("refuse sans session membre", async () => {
    expect((await POST(req({ montant: "5000" }))).status).toBe(401)
    expect(createCheckoutInvoice).not.toHaveBeenCalled()
  })

  it("le membre ne choisit que le montant : identité et téléphone viennent de sa fiche", async () => {
    const a = await createAdherentFromForm(
      { nom: "TESTMCONTRIB", prenoms: "Awa", tel: "+221770000555", paysRegion: "Sénégal", montant: "1400" },
      { mode: "light", status: "actif", allowCreateCellule: true }
    )
    session = { adherentId: a.id, name: "Awa TESTMCONTRIB" }
    // Le navigateur essaie d'imposer une autre identité : ignoré.
    const res = await POST(req({ montant: "10000", prenoms: "Pirate", nom: "Autre", tel: "+221779999999", anonymous: true }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.paymentId).toBeTruthy()
    expect(data.phone).toBe("+221770000555")

    const payment = await prisma.payment.findUnique({ where: { id: data.paymentId } })
    expect(payment).toMatchObject({ type: "don", amount: 10000, status: "pending", adherentId: a.id, customerPhone: "+221770000555" })
    expect(payment?.customerName).toBe("Awa TESTMCONTRIB")
    const c = await prisma.contribution.findUnique({ where: { id: data.contributionId } })
    expect(c).toMatchObject({ prenoms: "Awa", nom: "TESTMCONTRIB", tel: "+221770000555", campagne: "general" })
    expect(createCheckoutInvoice.mock.calls[0][0].customer?.phone).toBe("+221770000555")
  })

  it("montant libre : minimum 500 FCFA, montant invalide refusé", async () => {
    const a = await createAdherentFromForm(
      { nom: "TESTMCONTRIB", prenoms: "Awa", tel: "+221770000556", paysRegion: "Sénégal", montant: "1400" },
      { mode: "light", status: "actif", allowCreateCellule: true }
    )
    session = { adherentId: a.id, name: "Awa TESTMCONTRIB" }
    expect((await POST(req({ montant: "autre", montantAutre: "300" }))).status).toBe(400)
    expect((await POST(req({ montant: "autre", montantAutre: "abc" }))).status).toBe(400)
    expect((await POST(req({ montant: "123" }))).status).toBe(400)
    const ok = await POST(req({ montant: "autre", montantAutre: "15 000" }))
    expect(ok.status).toBe(200)
    expect((await prisma.payment.findUnique({ where: { id: (await ok.json()).paymentId } }))?.amount).toBe(15000)
  })
})
