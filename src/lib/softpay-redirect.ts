export type SoftpayRedirectInput = {
  fallback?: boolean
  method?: "wave" | "orange"
  url?: string
  omUrl?: string
  maxitUrl?: string
}

export function isMobileDevice() {
  if (typeof navigator === "undefined") return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

/** URL de paiement : app mobile ou page QR selon l'appareil. */
export function softpayRedirectUrl(data: SoftpayRedirectInput): string | null {
  if (data.fallback) return data.url || null

  const mobile = isMobileDevice()

  if (data.method === "wave") {
    return data.url || null
  }

  if (data.method === "orange") {
    if (mobile) {
      return data.omUrl || data.maxitUrl || data.url || null
    }
    return data.url || null
  }

  return data.url || null
}

export function openSoftpayDestination(data: SoftpayRedirectInput) {
  const target = softpayRedirectUrl(data)
  if (!target) return false
  window.location.assign(target)
  return true
}
