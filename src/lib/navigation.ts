import {
  LayoutDashboard,
  Users,
  Wallet,
  HandCoins,
  MapPinned,
  Sparkles,
  BarChart3,
  Settings,
  Images,
  MessageSquareQuote,
  History,
  ShoppingBag,
  ClipboardList,
  Boxes,
  Tag,
  Star,
  Layers,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  badge?: string
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

export const mainNav: NavGroup[] = [
  {
    label: "Principal",
    items: [
      { title: "Vue d'ensemble", href: "/dashboard", icon: LayoutDashboard },
      { title: "Adhérents", href: "/adherents", icon: Users },
      { title: "Cotisations", href: "/cotisations", icon: Wallet },
      { title: "Contributions", href: "/contributions", icon: HandCoins },
    ],
  },
  {
    label: "Organisation",
    items: [
      { title: "Cellules", href: "/cellules", icon: MapPinned },
      { title: "Professions", href: "/competences", icon: Sparkles },
      { title: "Rapports", href: "/rapports", icon: BarChart3 },
    ],
  },
  {
    label: "Contenu",
    items: [
      { title: "Albums photo", href: "/medias", icon: Images },
      { title: "Témoignages", href: "/temoignages", icon: MessageSquareQuote },
    ],
  },
  {
    label: "Barkelu",
    items: [
      { title: "Produits", href: "/admin/boutique/produits", icon: ShoppingBag },
      { title: "Collections", href: "/admin/boutique/collections", icon: Layers },
      { title: "Commandes", href: "/admin/boutique/commandes", icon: ClipboardList },
      { title: "Stock", href: "/admin/boutique/stock", icon: Boxes },
      { title: "Coupons", href: "/admin/boutique/coupons", icon: Tag },
      { title: "Avis", href: "/admin/boutique/avis", icon: Star },
    ],
  },
]

export const secondaryNav: NavItem[] = [
  { title: "Journal d'activité", href: "/journal", icon: History },
  { title: "Paramètres", href: "/parametres", icon: Settings },
]
