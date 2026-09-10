/**
 * Hook de démarrage serveur Next.js (register() exécuté une fois au
 * lancement du process). Sert uniquement à démarrer le balayage périodique
 * des réservations de stock expirées — voir lib/store/reservation-cleanup.ts.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startReservationCleanup } = await import("@/lib/store/reservation-cleanup")
    startReservationCleanup()
  }
}
