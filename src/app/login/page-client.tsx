"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InlineMessage } from "@/components/shared/inline-message"
import { safeInternalPath } from "@/lib/auth-shared"

export default function LoginPage() {
  const router = useRouter()
  const search = useSearchParams()
  const next = safeInternalPath(search.get("next"))

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Connexion impossible")
        return
      }
      router.replace(safeInternalPath(next))
      router.refresh()
    } catch {
      setError("Erreur réseau")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[var(--ak-ivory)] px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(11,58,37,0.12),transparent),radial-gradient(circle_at_90%_80%,rgba(201,162,76,0.15),transparent)]"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-[#E6DCC0] bg-white p-1 shadow-[0_20px_50px_rgba(11,58,37,0.12)]">
        <div className="rounded-xl px-6 py-8 md:px-8">
          <div className="flex flex-col items-center text-center">
            <Image
              src="/brand/logo.png"
              alt="Ahloul Khidmah"
              width={72}
              height={72}
              className="mb-3 size-16 rounded-full object-cover ring-2 ring-[var(--ak-gold)]/70"
            />
            <p className="text-xs font-semibold tracking-[0.25em] text-[var(--ak-emerald-mid)] uppercase">
              Administration
            </p>
            <h1 className="mt-2 font-serif text-2xl text-[var(--ak-emerald-deep)]">
              Ahloul Khidmah
            </h1>
            <p className="mt-2 text-sm text-[var(--ak-ink-soft)]">
              Connectez-vous pour gérer les adhérents et cotisations.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 border-[#DED2AE] bg-[var(--ak-ivory)]"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-[#DED2AE] bg-[var(--ak-ivory)] pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                  aria-pressed={showPassword}
                  className="absolute top-1/2 right-1 -translate-y-1/2 rounded-lg p-1.5 text-[var(--ak-ink-soft)] hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>
            {error ? <InlineMessage message={error} variant="error" /> : null}
            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-2xl bg-[var(--ak-emerald-deep)] text-base font-semibold text-white hover:bg-[var(--ak-emerald-mid)]"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Connexion…
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
