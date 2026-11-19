export type ZoneBucket = "senegal" | "diaspora" | "inconnu"

// Les zones sont saisies librement par les membres ("Senegal", "Sénégal Dakar",
// "Italia", "Almagne"…) : on compare sans accents ni casse, par mot-clé.
const SENEGAL = [
  "senegal", "dakar", "dkar", "thies", "touba", "diourbel", "kaolack",
  "saint-louis", "saint louis", "ziguinchor", "mbour", "louga", "tambacounda",
  "kolda", "fatick", "kaffrine", "matam", "sedhiou", "kedougou", "rufisque",
  "pikine", "guediawaye", "mermoz", "medina", "mbacke", "tivaouane",
  "دكار", "السنغال",
]

const DIASPORA = [
  "france", "paris", "italie", "italia", "italy", "espagne", "spain",
  "allemagne", "almagne", "germany", "deutschland", "wiedenbruck", "canada",
  "usa", "etats-unis", "etats unis", "new york", "londres", "london",
  "royaume", "belgique", "suisse", "portugal", "maroc", "mauritanie",
  "gambie", "guinee", "bissau", "cote d'ivoire", "abidjan", "gabon",
]

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
}

/** Classe une zone saisie librement : Sénégal, diaspora, ou non exploitable. */
export function classifyZone(raw: string | null | undefined): ZoneBucket {
  const zone = fold(raw ?? "")
  if (!zone) return "inconnu"
  if (SENEGAL.some((k) => zone.includes(k))) return "senegal"
  if (DIASPORA.some((k) => zone.includes(k))) return "diaspora"
  return "inconnu"
}
