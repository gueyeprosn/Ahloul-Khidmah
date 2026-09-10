"use client"

import { useEffect, useState } from "react"
import { Download, X } from "lucide-react"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const DISMISS_KEY = "ak_pwa_dismiss"

export function PwaRegister() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  )
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return
    }

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((reg) => {
      // Force la prise en compte du nouveau SW (fix /uploads, camera…)
      void reg.update()
      if (reg.waiting) {
        reg.waiting.postMessage("SKIP_WAITING")
      }
    }).catch(() => {
      /* HTTPS requis hors localhost — silencieux */
    })

    const onBip = (e: Event) => {
      e.preventDefault()
      if (sessionStorage.getItem(DISMISS_KEY) === "1") return
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener("beforeinstallprompt", onBip)

    const onInstalled = () => {
      setVisible(false)
      setDeferred(null)
    }
    window.addEventListener("appinstalled", onInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setVisible(false)
    setDeferred(null)
  }

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1")
    setVisible(false)
  }

  if (!visible || !deferred) return null

  return (
    <div
      role="dialog"
      aria-label="Installer l'application"
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-[#C9A24C]/50 bg-[#0B3A25] px-4 py-3 text-[#FBF6EA] shadow-[0_16px_40px_rgba(0,0,0,0.35)] sm:inset-x-auto sm:right-4 sm:bottom-4 sm:left-auto"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#C9A24C]/20 text-[#E8CE83]">
        <Download className="size-5" />
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold text-[#E8CE83]">Installer Ahloul Khidmah</p>
        <p className="text-xs text-[#FBF6EA]/75">
          Accès rapide depuis l&apos;écran d&apos;accueil
        </p>
      </div>
      <button
        type="button"
        onClick={() => void install()}
        className="shrink-0 rounded-full bg-[linear-gradient(135deg,#E8CE83,#C9A24C)] px-3 py-1.5 text-xs font-bold text-[#0B3A25]"
      >
        Installer
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Fermer"
        className="shrink-0 rounded-full p-1 text-[#FBF6EA]/60 hover:text-[#FBF6EA]"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
