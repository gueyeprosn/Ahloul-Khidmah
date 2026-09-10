/**
 * Bascule pour masquer temporairement la boutique publique (catalogue,
 * fiche produit, panier, checkout, collections) sans toucher à la gestion
 * admin ni aux données — le catalogue, les commandes et le stock restent
 * gérables normalement depuis /admin/boutique pendant que la vitrine
 * publique est masquée.
 *
 * Pour rouvrir la boutique : repasser cette valeur à true, puis
 * build + déployer. Voir middleware.ts (redirection des pages publiques
 * et blocage du checkout), landing-nav.tsx et landing-footer.tsx (lien
 * et icônes retirés du menu et du pied de page tant que c'est à false).
 */
export const STORE_PUBLIC_ENABLED = false
