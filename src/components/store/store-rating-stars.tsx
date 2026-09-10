import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

export function StoreRatingStars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const starSize = size === "sm" ? "size-3.5" : "size-4"
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            starSize,
            n <= Math.round(rating) ? "fill-[var(--ak-gold)] text-[var(--ak-gold)]" : "text-[var(--ak-ink)]/15"
          )}
        />
      ))}
    </div>
  )
}
