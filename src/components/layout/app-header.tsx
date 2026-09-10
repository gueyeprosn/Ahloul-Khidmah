"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Search } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

type Crumb = {
  label: string
  href?: string
}

type AppHeaderProps = {
  breadcrumbs?: Crumb[]
  title?: string
}

export function AppHeader({ breadcrumbs = [], title }: AppHeaderProps) {
  const router = useRouter()
  const [q, setQ] = useState("")
  const [mobileOpen, setMobileOpen] = useState(false)

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    const query = q.trim()
    router.push(query ? `/adherents?q=${encodeURIComponent(query)}` : "/adherents")
    setMobileOpen(false)
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-[#E6DCC0] bg-[var(--ak-ivory)]/90 px-4 backdrop-blur-md md:px-6">
      <SidebarTrigger className="-ml-1 text-[var(--ak-emerald-deep)]" />
      <Separator orientation="vertical" className="mr-1 hidden h-4 bg-[#E6DCC0] sm:block" />

      <div className="flex min-w-0 flex-1 items-center gap-3">
        {breadcrumbs.length > 0 ? (
          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              {breadcrumbs.map((crumb, i) => {
                const isLast = i === breadcrumbs.length - 1
                return (
                  <div key={`${crumb.label}-${i}`} className="contents">
                    <BreadcrumbItem>
                      {isLast || !crumb.href ? (
                        <BreadcrumbPage className="text-[var(--ak-emerald-deep)]">
                          {crumb.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={crumb.href}>
                          {crumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator />}
                  </div>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
        ) : title ? (
          <p className="truncate text-sm font-medium text-[var(--ak-emerald-deep)]">
            {title}
          </p>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          <form
            onSubmit={onSearch}
            className="relative hidden w-56 lg:block xl:w-72"
          >
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un adhérent…"
              className="h-8 border-[#DED2AE] bg-white pl-8 text-sm"
            />
          </form>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <Search className="size-4" />
            <span className="sr-only">Rechercher</span>
          </Button>
        </div>
      </div>

      {mobileOpen ? (
        <form
          onSubmit={onSearch}
          className="absolute inset-x-0 top-full border-b border-[#E6DCC0] bg-[var(--ak-ivory)] p-3 lg:hidden"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un adhérent…"
              className="h-9 border-[#DED2AE] bg-white pl-8"
            />
          </div>
        </form>
      ) : null}
    </header>
  )
}
