import { describe, it, expect } from "vitest"
import { buildYoutubeEmbedUrl } from "@/lib/youtube-widget-config"

describe("buildYoutubeEmbedUrl", () => {
  it("pointe vers le domaine privacy-enhanced youtube-nocookie.com", () => {
    const url = buildYoutubeEmbedUrl("PL123", { autoplay: true, muted: false })
    expect(url.startsWith("https://www.youtube-nocookie.com/embed/videoseries?")).toBe(true)
  })

  it("inclut list et playlist avec le même id (nécessaire pour boucler la playlist)", () => {
    const url = new URL(buildYoutubeEmbedUrl("PL123", { autoplay: true, muted: false }))
    expect(url.searchParams.get("list")).toBe("PL123")
    expect(url.searchParams.get("playlist")).toBe("PL123")
    expect(url.searchParams.get("loop")).toBe("1")
  })

  it("bascule autoplay=1/0 selon l'option", () => {
    const on = new URL(buildYoutubeEmbedUrl("PL123", { autoplay: true, muted: false }))
    const off = new URL(buildYoutubeEmbedUrl("PL123", { autoplay: false, muted: false }))
    expect(on.searchParams.get("autoplay")).toBe("1")
    expect(off.searchParams.get("autoplay")).toBe("0")
  })

  it("bascule mute=1/0 selon l'option", () => {
    const muted = new URL(buildYoutubeEmbedUrl("PL123", { autoplay: true, muted: true }))
    const unmuted = new URL(buildYoutubeEmbedUrl("PL123", { autoplay: true, muted: false }))
    expect(muted.searchParams.get("mute")).toBe("1")
    expect(unmuted.searchParams.get("mute")).toBe("0")
  })

  it("produit une URL valide même avec l'id placeholder", () => {
    expect(() => new URL(buildYoutubeEmbedUrl("REPLACE_ME_PLAYLIST_ID", { autoplay: true, muted: false }))).not.toThrow()
  })
})
