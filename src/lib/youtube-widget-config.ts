// TODO: coller l'ID réel de la playlist ici (valeur du paramètre `list=`
// dans l'URL de la playlist YouTube).
export const YOUTUBE_PLAYLIST_ID = "REPLACE_ME_PLAYLIST_ID"

/**
 * URL d'intégration `youtube-nocookie.com` — domaine à vie privée renforcée,
 * pas d'API IFrame Player nécessaire (juste un <iframe src="...">, ce qui
 * limite le changement de CSP au strict `frame-src`).
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
  })
  return `https://www.youtube-nocookie.com/embed/videoseries?${params.toString()}`
}
