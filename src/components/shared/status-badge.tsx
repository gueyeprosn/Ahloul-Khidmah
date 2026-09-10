import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const variants = {
  success: "border-[var(--ak-emerald-deep)]/20 bg-[#E7F0EA] text-[var(--ak-emerald-deep)]",
  warning: "border-[var(--ak-gold)]/40 bg-[#FBF3DE] text-[var(--ak-ink)]",
  danger: "border-destructive/25 bg-destructive/10 text-destructive",
  neutral: "border-[#E6DCC0] bg-[var(--ak-ivory)] text-[var(--ak-ink-soft)]",
  info: "border-[var(--ak-gold)]/50 bg-[#E7F0EA] text-[var(--ak-emerald-deep)]",
} as const

type StatusBadgeProps = {
  label: string
  variant?: keyof typeof variants
  className?: string
}

export function StatusBadge({
  label,
  variant = "neutral",
  className,
}: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md px-2 py-0.5 font-medium shadow-none",
        variants[variant],
        className
      )}
    >
      {label}
    </Badge>
  )
}
