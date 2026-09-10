"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { useLocale } from "@/components/landing/locale-provider"
import { cn } from "@/lib/utils"

export function LandingFaq() {
  const { dict } = useLocale()
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section
      id="faq"
      className="scroll-mt-20 bg-[var(--ak-ivory)] px-5 py-12 text-[var(--ak-ink)] md:px-8 md:py-16"
    >
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.25em] text-[var(--ak-emerald-mid)] uppercase">
          {dict.faq.eyebrow}
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-amiri)] text-3xl leading-tight text-[var(--ak-emerald-deep)] md:text-4xl">
          {dict.faq.title}
        </h2>

        <div className="mt-8 divide-y divide-[#E6DCC0] rounded-xl border border-[#E6DCC0] bg-white">
          {dict.faq.items.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={item.q} className="px-5 md:px-6">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 py-5 text-start"
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span className="font-semibold text-[var(--ak-emerald-deep)]">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-5 shrink-0 text-[var(--ak-emerald-mid)] transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-300",
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="pb-5 text-sm leading-relaxed text-[var(--ak-ink-soft)]">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
