"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export type CartItem = {
  productId: string
  variantId: string | null
  slug: string
  name: string
  variantLabel: string | null
  sku: string
  /** Prix au moment de l'ajout, pour affichage seulement — recalculé
   * intégralement côté serveur à la commande (jamais une source de vérité). */
  unitPrice: number
  image: { url: string; alt: string } | null
  quantity: number
}

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void
  removeItem: (productId: string, variantId: string | null) => void
  setQuantity: (productId: string, variantId: string | null, quantity: number) => void
  clear: () => void
  /** Mini-panier (Sheet) — ouvert automatiquement après un ajout. */
  drawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = "ak_store_cart_v1"

function sameLine(a: { productId: string; variantId: string | null }, b: { productId: string; variantId: string | null }) {
  return a.productId === b.productId && a.variantId === b.variantId
}

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (i): i is CartItem =>
        i &&
        typeof i === "object" &&
        typeof (i as CartItem).productId === "string" &&
        typeof (i as CartItem).quantity === "number"
    )
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    // Lu après le premier rendu (pas dans l'état initial) pour éviter un
    // mismatch d'hydratation : le HTML serveur ne connaît pas localStorage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(readStoredCart())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // quota pleine / navigation privée : le panier reste en mémoire pour la session
    }
  }, [items, hydrated])

  const addItem = useCallback<CartContextValue["addItem"]>((item, quantity = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((line) => sameLine(line, item))
      if (idx === -1) {
        return [...prev, { ...item, quantity: Math.max(quantity, 1) }]
      }
      const next = [...prev]
      next[idx] = { ...next[idx], quantity: next[idx].quantity + Math.max(quantity, 1) }
      return next
    })
  }, [])

  const removeItem = useCallback<CartContextValue["removeItem"]>((productId, variantId) => {
    setItems((prev) => prev.filter((line) => !sameLine(line, { productId, variantId })))
  }, [])

  const setQuantity = useCallback<CartContextValue["setQuantity"]>(
    (productId, variantId, quantity) => {
      setItems((prev) => {
        if (quantity <= 0) {
          return prev.filter((line) => !sameLine(line, { productId, variantId }))
        }
        return prev.map((line) =>
          sameLine(line, { productId, variantId }) ? { ...line, quantity } : line
        )
      })
    },
    []
  )

  const clear = useCallback(() => setItems([]), [])
  const openDrawer = useCallback(() => setDrawerOpen(true), [])
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items])
  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [items]
  )

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      setQuantity,
      clear,
      drawerOpen,
      openDrawer,
      closeDrawer,
    }),
    [items, itemCount, subtotal, addItem, removeItem, setQuantity, clear, drawerOpen, openDrawer, closeDrawer]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart doit être utilisé dans <CartProvider>")
  return ctx
}
