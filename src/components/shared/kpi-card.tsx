import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import { TrendingDown, TrendingUp } from "lucide-react"

type KpiCardProps = {
  title: string
  value: string
  description?: string
  icon?: LucideIcon
  trend?: {
    value: string
    direction: "up" | "down"
  }
  href?: string
  className?: string
}

export function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: KpiCardProps) {
  return (
    <Card
      className={cn(
        "border-[#E6DCC0] bg-white",
        className
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-[var(--ak-ink-soft)]">
          {title}
        </CardTitle>
        {Icon ? (
          <div className="flex size-9 items-center justify-center rounded-xl bg-[var(--ak-emerald-deep)] text-[var(--ak-gold-light)] shadow-[inset_0_0_0_1px_rgba(201,162,76,0.35)]">
            <Icon className="size-4" />
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-1.5">
        <div className="text-2xl font-semibold tracking-tight text-[var(--ak-emerald-deep)] tabular-nums md:text-3xl">
          {value}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {trend ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 font-medium",
                trend.direction === "up"
                  ? "text-[var(--ak-emerald-deep)]"
                  : "text-destructive"
              )}
            >
              {trend.direction === "up" ? (
                <TrendingUp className="size-3.5" />
              ) : (
                <TrendingDown className="size-3.5" />
              )}
              {trend.value}
            </span>
          ) : null}
          {description ? <span>{description}</span> : null}
        </div>
      </CardContent>
    </Card>
  )
}
