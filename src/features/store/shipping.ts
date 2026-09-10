/**
 * Zones et tarifs de livraison — constantes pour le MVP (pas encore de
 * modèle DB dédié). Le contrat de l'API checkout (`shippingZone: string`)
 * reste inchangé si ceci devient un jour piloté depuis le dashboard.
 */
export const SHIPPING_ZONES = [
  { value: "dakar", label: "Dakar", cost: 1500 },
  { value: "banlieue", label: "Banlieue de Dakar", cost: 2000 },
  { value: "regions", label: "Régions (hors Dakar)", cost: 3000 },
  { value: "retrait", label: "Retrait boutique", cost: 0 },
] as const

export type ShippingZoneValue = (typeof SHIPPING_ZONES)[number]["value"]

export function isShippingZone(value: string): value is ShippingZoneValue {
  return SHIPPING_ZONES.some((z) => z.value === value)
}

export function shippingCostFor(zone: string): number {
  return SHIPPING_ZONES.find((z) => z.value === zone)?.cost ?? 0
}

export function shippingLabelFor(zone: string): string {
  return SHIPPING_ZONES.find((z) => z.value === zone)?.label ?? zone
}
