import type { ReactNode } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type SectionCardProps = {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
  flush?: boolean
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
  flush,
}: SectionCardProps) {
  return (
    <Card
      className={cn(
        "border-[#E6DCC0] bg-white shadow-none",
        className
      )}
    >
      {title || description || actions ? (
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div className="space-y-1">
            {title ? (
              <CardTitle className="text-base font-medium text-[var(--ak-emerald-deep)]">
                {title}
              </CardTitle>
            ) : null}
            {description ? (
              <CardDescription>{description}</CardDescription>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </CardHeader>
      ) : null}
      <CardContent className={cn(flush && "px-0", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}
