export const storeImpact = {
  title: "Acheter. Soutenir. Participer.",
  text: "Chaque commande de la boutique contribue au financement des actions d'Ahloul Khidmah auprès de la communauté.",
  compact: "Votre achat contribue aux actions d'Ahloul Khidmah.",
}

/** Bandeau saisonnier — désactiver avec `active: false` hors période. */
export const storeCampaign = {
  active: true,
  eyebrow: "Magal & khidma",
  title: "Portez nos valeurs, soutenez la khidma",
  text: "Pins, packs et textile Ahloul Khidmah — livraison au Sénégal ou retrait boutique.",
  ctaLabel: "Voir les packs",
  ctaHref: "/boutique?categorie=packs",
}

export const storeTrustItems = [
  {
    key: "pay",
    title: "Paiement sécurisé",
    text: "Wave & Orange Money",
  },
  {
    key: "ship",
    title: "Livraison Sénégal",
    text: "Dakar, banlieue et régions",
  },
  {
    key: "pickup",
    title: "Retrait boutique",
    text: "Gratuit sur place",
  },
  {
    key: "impact",
    title: "Impact réel",
    text: "Chaque achat soutient la khidma",
  },
] as const
