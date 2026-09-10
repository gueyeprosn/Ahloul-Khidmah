"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

export function ProductReviewForm({
  orderId,
  productId,
  productName,
}: {
  orderId: string
  productId: string
  productName: string
}) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0 || comment.trim().length < 5) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/store/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, productId, rating, comment: comment.trim() }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || "Impossible d'envoyer l'avis")
        return
      }
      setSubmitted(true)
    } catch {
      setError("Erreur réseau — réessayez")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <p className="text-sm text-emerald-700">
        Merci pour votre avis sur {productName} — il sera visible après vérification.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-xl border border-[#E6DCC0] p-3">
      <p className="text-sm font-medium text-[var(--ak-ink)]">Laisser un avis sur {productName}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHoverRating(n)}
            onMouseLeave={() => setHoverRating(0)}
          >
            <Star
              className={cn(
                "size-6 transition-colors",
                n <= (hoverRating || rating)
                  ? "fill-[var(--ak-gold)] text-[var(--ak-gold)]"
                  : "text-[var(--ak-ink)]/20"
              )}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="Votre avis sur ce produit…"
        className="w-full rounded-lg border border-[#E6DCC0] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--ak-emerald-mid)]"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting || rating === 0 || comment.trim().length < 5}
        className="rounded-lg bg-[var(--ak-emerald-deep)] px-3 py-1.5 text-sm font-medium text-[var(--ak-ivory)] disabled:opacity-50"
      >
        {submitting ? "Envoi…" : "Envoyer mon avis"}
      </button>
    </form>
  )
}
