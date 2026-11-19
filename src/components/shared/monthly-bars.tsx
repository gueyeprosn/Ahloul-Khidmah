import { formatCompact, formatFcfa } from "@/lib/format"
import { cn } from "@/lib/utils"

export type MonthlyBar = {
  label: string
  cotisations: number
  dons: number
  current?: boolean
}

export function MonthlyBars({ data }: { data: MonthlyBar[] }) {
  const max = Math.max(...data.map((d) => d.cotisations + d.dons), 1)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--ak-ink-soft)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-[var(--ak-emerald-mid)]" />
          Cotisations
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-[var(--ak-gold)]" />
          Dons
        </span>
      </div>
      <ul className="grid h-44 grid-cols-6 items-end gap-2 sm:gap-4">
        {data.map((d) => {
          const total = d.cotisations + d.dons
          const height = (total / max) * 100
          return (
            <li
              key={d.label}
              className="flex h-full min-w-0 flex-col justify-end gap-1.5"
              title={`${d.label} : ${formatFcfa(total)} (cotisations ${formatFcfa(d.cotisations)}, dons ${formatFcfa(d.dons)})`}
            >
              <span className="truncate text-center text-xs tabular-nums text-[var(--ak-ink-soft)]">
                {total > 0 ? formatCompact(total) : "—"}
              </span>
              <div
                className="flex w-full flex-col justify-end overflow-hidden rounded-t-md"
                style={{ height: `${Math.max(height, total > 0 ? 3 : 0)}%` }}
              >
                {d.dons > 0 ? (
                  <div
                    className="bg-[var(--ak-gold)]"
                    style={{ flexGrow: d.dons }}
                  />
                ) : null}
                {d.cotisations > 0 ? (
                  <div
                    className="bg-[var(--ak-emerald-mid)]"
                    style={{ flexGrow: d.cotisations }}
                  />
                ) : null}
              </div>
              <span
                className={cn(
                  "border-t border-[#E6DCC0] pt-1.5 text-center text-xs capitalize",
                  d.current
                    ? "font-semibold text-[var(--ak-emerald-deep)]"
                    : "text-muted-foreground"
                )}
              >
                {d.label}
              </span>
              <span className="sr-only">
                {formatFcfa(total)} encaissés, dont {formatFcfa(d.cotisations)}{" "}
                de cotisations et {formatFcfa(d.dons)} de dons
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
