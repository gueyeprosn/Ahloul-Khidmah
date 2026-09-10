"use client"

import { useEffect } from "react"

const VISITED_KEY = "ak_visited"
const AUTO_SCROLL_DELAY_MS = 2200
const AUTO_SCROLL_DURATION_MS = 1400

function easeOutExpo(t: number) {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

/** Défilement animé "à la main" (décélération prononcée) — plus soigné
 * que le smooth-scroll natif du navigateur pour ce moment mis en avant. */
function styledScrollTo(target: HTMLElement, duration: number) {
  const startY = window.scrollY
  const targetY = target.getBoundingClientRect().top + window.scrollY
  const distance = targetY - startY
  if (distance === 0) return
  const startTime = performance.now()

  function step(now: number) {
    const progress = Math.min((now - startTime) / duration, 1)
    window.scrollTo(0, startY + distance * easeOutExpo(progress))
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

/**
 * Scrolls to #adhesion / #contribuer when the hash or montant query is
 * present (immédiat — réponse directe à un clic).
 *
 * Sur la toute première visite d'un visiteur (jamais vu ce navigateur
 * avant, mémorisé en localStorage), descend automatiquement vers
 * #adhesion — mais seulement après quelques secondes (le temps de voir
 * la page d'accueil) et avec une animation plus soignée. Jamais pour un
 * membre déjà connecté, jamais plus d'une fois par visiteur.
 */
export function ScrollToAdhesion({ isMember = false }: { isMember?: boolean }) {
  useEffect(() => {
    if (typeof window === "undefined") return

    const hash = window.location.hash
    const hasExplicitIntent =
      hash === "#adhesion" ||
      hash === "#contribuer" ||
      new URLSearchParams(window.location.search).has("montant")

    if (hasExplicitIntent) {
      requestAnimationFrame(() => {
        const target =
          document.getElementById("adhesion") ||
          document.getElementById("contribuer")
        target?.scrollIntoView({ behavior: "smooth", block: "start" })
      })
      return
    }

    let alreadyVisited = true
    try {
      alreadyVisited = localStorage.getItem(VISITED_KEY) === "1"
      localStorage.setItem(VISITED_KEY, "1")
    } catch {
      /* stockage indisponible (navigation privée stricte) — on suppose
         déjà vu plutôt que de forcer le défilement à chaque visite */
    }

    if (alreadyVisited || isMember) return

    const timer = window.setTimeout(() => {
      // Simule un clic sur "Adhérer" : replaceState ne déclenche pas
      // "hashchange" (contrairement à location.hash=...), donc on le
      // déclenche nous-même pour que LandingJoin choisisse l'onglet et
      // affiche directement le formulaire (sans ajouter d'entrée dans
      // l'historique de navigation, contrairement à un vrai clic).
      window.history.replaceState(null, "", "#adhesion")
      try {
        window.dispatchEvent(new HashChangeEvent("hashchange"))
      } catch {
        window.dispatchEvent(new Event("hashchange"))
      }
      const target = document.getElementById("adhesion")
      if (target) styledScrollTo(target, AUTO_SCROLL_DURATION_MS)
    }, AUTO_SCROLL_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [isMember])

  return null
}
