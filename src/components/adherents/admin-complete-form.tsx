"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SectionCard } from "@/components/shared/section-card"
import { InlineMessage } from "@/components/shared/inline-message"

type Props = {
  adherent: {
    id: string
    nom: string
    prenoms: string
    tel: string
    whatsapp: string | null
    profession: string
    email: string | null
  }
}

export function AdminCompleteForm({ adherent }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(
    null
  )
  const [nom, setNom] = useState(adherent.nom)
  const [prenoms, setPrenoms] = useState(adherent.prenoms)
  const [profession, setProfession] = useState(
    adherent.profession === "À préciser" ? "" : adherent.profession
  )
  const [whatsapp, setWhatsapp] = useState(adherent.whatsapp || "")
  const [email, setEmail] = useState(adherent.email || "")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/adhesions/${adherent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          nom,
          prenoms,
          tel: adherent.tel,
          profession,
          whatsapp: whatsapp || adherent.tel,
          email,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg({ type: "error", text: data.error || "Échec de la complétion" })
        return
      }
      setMsg({ type: "success", text: "Fiche complétée avec succès." })
      router.refresh()
    } catch {
      setMsg({ type: "error", text: "Erreur réseau" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <SectionCard
      title="Compléter la fiche (admin)"
      description="Finalisez le dossier membre directement depuis le dashboard."
    >
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="adm-nom">Nom</Label>
          <Input
            id="adm-nom"
            className="mt-1.5"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="adm-prenoms">Prénom(s)</Label>
          <Input
            id="adm-prenoms"
            className="mt-1.5"
            value={prenoms}
            onChange={(e) => setPrenoms(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="adm-whatsapp">WhatsApp</Label>
          <Input
            id="adm-whatsapp"
            type="tel"
            className="mt-1.5"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="adm-email">Email</Label>
          <Input
            id="adm-email"
            type="email"
            className="mt-1.5"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="adm-pro">Profession</Label>
          <Input
            id="adm-pro"
            className="mt-1.5"
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            required
          />
        </div>

        {msg ? <InlineMessage message={msg.text} variant={msg.type} /> : null}

        <div className="sm:col-span-2">
          <Button type="submit" disabled={loading} className="ak-cta-solid">
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Enregistrer la fiche complète
          </Button>
        </div>
      </form>
    </SectionCard>
  )
}
