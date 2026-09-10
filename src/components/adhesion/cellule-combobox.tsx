"use client"

import { useEffect, useId, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type CelluleOption = { name: string; zone: string | null }

type Props = {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function CelluleCombobox({
  id,
  value,
  onChange,
  placeholder,
  className,
  disabled,
}: Props) {
  const listId = useId()
  const [options, setOptions] = useState<CelluleOption[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/cellules/public")
      .then((r) => r.json())
      .then((data: { cellules?: CelluleOption[] }) => {
        if (!cancelled && Array.isArray(data.cellules)) {
          setOptions(data.cellules)
        }
      })
      .catch(() => {
        /* silencieux : saisie libre toujours possible */
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase()
    if (!q) return options.slice(0, 12)
    return options
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.zone || "").toLowerCase().includes(q)
      )
      .slice(0, 12)
  }, [options, value])

  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        className={cn(className)}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // laisser le clic sur une option s'exécuter
          window.setTimeout(() => setOpen(false), 150)
        }}
      />
      {open && filtered.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-[#DED2AE] bg-white py-1 shadow-lg"
        >
          {filtered.map((c) => (
            <li key={c.name}>
              <button
                type="button"
                role="option"
                className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-[#E7F0EA]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(c.name)
                  setOpen(false)
                }}
              >
                <span className="font-medium text-[var(--ak-emerald-deep)]">
                  {c.name}
                </span>
                {c.zone ? (
                  <span className="text-xs text-[var(--ak-ink-soft)]">
                    {c.zone}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
