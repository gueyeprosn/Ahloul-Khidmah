import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type DataTableProps = {
  children: ReactNode
  className?: string
}

/** Conteneur table unifié (scroll mobile + bordure marque) */
export function DataTable({ children, className }: DataTableProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[#E6DCC0] bg-white",
        className
      )}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

export function DataTableRoot({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <table className={cn("w-full text-sm", className)}>{children}</table>
  )
}

export function DataTableHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-[#E6DCC0] text-left text-xs text-[var(--ak-ink-soft)]">
        {children}
      </tr>
    </thead>
  )
}

export function Th({
  children,
  className,
}: {
  children?: ReactNode
  className?: string
}) {
  return (
    <th className={cn("px-4 py-3 font-medium md:px-6", className)}>
      {children}
    </th>
  )
}

export function DataTableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>
}

export function Tr({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <tr
      className={cn(
        "border-b border-[#E6DCC0]/60 last:border-0 hover:bg-[var(--ak-ivory)]/80",
        className
      )}
    >
      {children}
    </tr>
  )
}

export function Td({
  children,
  className,
}: {
  children?: ReactNode
  className?: string
}) {
  return (
    <td className={cn("px-4 py-3.5 md:px-6", className)}>{children}</td>
  )
}
