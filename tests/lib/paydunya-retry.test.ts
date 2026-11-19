import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { PaydunyaUnavailableError, confirmCheckoutInvoice, diagnoseIpnHash } from "@/lib/paydunya"
import { createHash } from "crypto"

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })
const html502 = () => new Response("<html><body>Bad gateway</body></html>", { status: 502 })
const html403 = () => new Response("<html><body>Attention Required</body></html>", { status: 403 })

describe("appels PayDunya : nouvelles tentatives", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    process.env.PAYDUNYA_MASTER_KEY = "m-test"
    process.env.PAYDUNYA_PRIVATE_KEY = "p-test"
    process.env.PAYDUNYA_TOKEN = "t-test"
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it("une panne 502 passagère est rattrapée par une nouvelle tentative", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(html502()).mockResolvedValueOnce(json({ status: "completed" }))
    vi.stubGlobal("fetch", fetchMock)
    const p = confirmCheckoutInvoice("tok")
    await vi.advanceTimersByTimeAsync(2000)
    expect((await p).status).toBe("completed")
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("un blocage 403 n'est jamais réessayé", async () => {
    const fetchMock = vi.fn().mockResolvedValue(html403())
    vi.stubGlobal("fetch", fetchMock)
    await expect(confirmCheckoutInvoice("tok")).rejects.toBeInstanceOf(PaydunyaUnavailableError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("panne persistante : 3 tentatives puis erreur propre (jamais « Erreur serveur »)", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => html502())
    vi.stubGlobal("fetch", fetchMock)
    const p = confirmCheckoutInvoice("tok")
    const assertion = expect(p).rejects.toBeInstanceOf(PaydunyaUnavailableError)
    await vi.advanceTimersByTimeAsync(5000)
    await assertion
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it("coupure réseau : devient PaydunyaUnavailableError", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("fetch failed"))
    vi.stubGlobal("fetch", fetchMock)
    const p = confirmCheckoutInvoice("tok")
    const assertion = expect(p).rejects.toBeInstanceOf(PaydunyaUnavailableError)
    await vi.advanceTimersByTimeAsync(5000)
    await assertion
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})

describe("diagnoseIpnHash", () => {
  it("ne révèle que des booléens : repère le bon secret sans l'afficher", () => {
    process.env.PAYDUNYA_MASTER_KEY = "master-x"
    process.env.PAYDUNYA_PRIVATE_KEY = "private-y"
    const hashOfPrivate = createHash("sha512").update("private-y").digest("hex")
    const d = diagnoseIpnHash(hashOfPrivate, "inv")
    expect(d.isHex128).toBe(true)
    expect(d.matchesPrivateKey).toBe(true)
    expect(d.matchesMasterTrimmed).toBe(false)
    expect(JSON.stringify(d)).not.toContain("private-y")
    expect(JSON.stringify(d)).not.toContain("master-x")
  })
})
