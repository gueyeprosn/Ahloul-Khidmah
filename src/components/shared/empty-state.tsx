import Link from "next/link"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

type EmptyStateProps = {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--ak-gold)]/50 bg-white/70 px-6 py-16 text-center",
        className
      )}
    >
      {Icon ? (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-[var(--ak-emerald-deep)] text-[var(--ak-gold-light)]">
          <Icon className="size-5" />
        </div>
      ) : null}
      <h3 className="text-base font-medium tracking-tight text-[var(--ak-emerald-deep)]">
        {title}
      </h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-[var(--ak-ink-soft)]">
          {description}
        </p>
      ) : null}
      {action?.href ? (
        <Button
          className="mt-5 bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)]"
          size="sm"
          asChild
        >
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : action ? (
        <Button
          className="mt-5 bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)]"
          size="sm"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      ) : null}
    </div>
  )
}
