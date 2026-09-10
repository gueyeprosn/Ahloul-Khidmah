import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type AlertBannerProps = {
  title: string
  description?: string
  href?: string
  linkLabel?: string
  variant?: "warning" | "info" | "danger"
  className?: string
}

const styles = {
  warning:
    "border-[var(--ak-gold)]/40 bg-[#FBF3DE] text-[var(--ak-ink)] [&_svg]:text-[var(--ak-gold-dark)]",
  info: "border-[var(--ak-gold)]/50 bg-[#E7F0EA] text-[var(--ak-emerald-deep)]",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
}

export function AlertBanner({
  title,
  description,
  href,
  linkLabel = "Voir",
  variant = "warning",
  className,
}: AlertBannerProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        styles[variant],
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
        <div>
          <p className="text-sm font-medium">{title}</p>
          {description ? (
            <p className="mt-0.5 text-xs opacity-80">{description}</p>
          ) : null}
        </div>
      </div>
      {href ? (
        <Link
          href={href}
          className="shrink-0 text-sm font-semibold underline-offset-4 hover:underline"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  )
}
