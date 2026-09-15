export const YOUTUBE_PLAYLIST_ID = "PL_uSyKTZ25BRL6xJ50VzuHuN4Ha6gtLzM"

export const YOUTUBE_EMBED_ORIGIN = "https://www.youtube-nocookie.com"

/**
 * URL d'intégration `youtube-nocookie.com` — domaine à vie privée renforcée.
 * `enablejsapi=1` n'ajoute aucune surface CSP (pas de script externe requis,
 * juste `postMessage` vers l'iframe) mais permet de forcer `playVideo` en
 * secours : le seul paramètre `autoplay=1` n'est pas toujours fiable sur un
 * embed de playlist (`/embed/videoseries`), certains navigateurs le laissent
 * en pause malgré le geste utilisateur qui a créé l'iframe.
 */
export function buildYoutubeEmbedUrl(
  playlistId: string,
  opts: { autoplay: boolean; muted: boolean }
): string {
  const params = new URLSearchParams({
    list: playlistId,
    listType: "playlist",
    // `playlist` doit reprendre le même id que `list` pour que `loop`
    // boucle sur toute la playlist plutôt que sur la seule vidéo courante.
    playlist: playlistId,
    autoplay: opts.autoplay ? "1" : "0",
    mute: opts.muted ? "1" : "0",
    playsinline: "1",
    modestbranding: "1",
    rel: "0",
    loop: "1",
    enablejsapi: "1",
  })
  return `${YOUTUBE_EMBED_ORIGIN}/embed/videoseries?${params.toString()}`
}

/** Commande "postMessage" pour forcer la lecture — voir buildYoutubeEmbedUrl. */
export function buildPlayCommand(): string {
  return JSON.stringify({ event: "command", func: "playVideo", args: [] })
}
