"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SectionCard } from "@/components/shared/section-card"
import { InlineMessage } from "@/components/shared/inline-message"
import { PhoneInput } from "@/components/shared/phone-input"
import { CelluleCombobox } from "@/components/adhesion/cellule-combobox"
import { MONTANTS } from "@/features/adherents/constants"
import { cn } from "@/lib/utils"

type Props = {
  adherent: {
    id: string
    nom: string
    prenoms: string
    tel: string
    whatsapp: string | null
    email: string | null
    profession: string
    autreProfession: string | null
    celluleLocale: string
    zoneRegion: string
    montant: string
    montantAutre: string | null
  }
}

export function AdminEditProfileForm({ adherent }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{
    type: "error" | "success"
    text: string
  } | null>(null)

  const [nom, setNom] = useState(adherent.nom)
  const [prenoms, setPrenoms] = useState(adherent.prenoms)
  const [tel, setTel] = useState(adherent.tel)
  const [whatsapp, setWhatsapp] = useState(adherent.whatsapp || "")
  const [email, setEmail] = useState(adherent.email || "")
  const [profession, setProfession] = useState(
    adherent.profession === "À préciser" ? "" : adherent.profession
  )
  const [autreProfession, setAutreProfession] = useState(
    adherent.autreProfession || ""
  )
  const [celluleLocale, setCelluleLocale] = useState(adherent.celluleLocale)
  const [zoneRegion, setZoneRegion] = useState(adherent.zoneRegion)
  const [montant, setMontant] = useState(
    ["1400", "14000", "140000", "autre"].includes(adherent.montant)
      ? adherent.montant
      : "autre"
  )
  const [montantAutre, setMontantAutre] = useState(
    adherent.montantAutre ||
      (["1400", "14000", "140000", "autre"].includes(adherent.montant)
        ? ""
        : adherent.montant)
  )

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/adhesions/${adherent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          nom,
          prenoms,
          tel,
          whatsapp: whatsapp || tel,
          email,
          profession,
          autreProfession,
          celluleLocale,
          zoneRegion,
          montant,
          montantAutre,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg({
          type: "error",
          text: data.error || "Échec de la mise à jour",
        })
        return
      }
      setMsg({ type: "success", text: "Profil mis à jour." })
      router.refresh()
    } catch {
      setMsg({ type: "error", text: "Erreur réseau" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <SectionCard
      title="Modifier le profil"
      description="Corrigez les erreurs de saisie (téléphone, nom, cellule, cotisation…)."
    >
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="edit-nom">Nom</Label>
          <Input
            id="edit-nom"
            className="mt-1.5"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="edit-prenoms">Prénom(s)</Label>
          <Input
            id="edit-prenoms"
            className="mt-1.5"
            value={prenoms}
            onChange={(e) => setPrenoms(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="edit-tel">Téléphone</Label>
          <PhoneInput
            id="edit-tel"
            value={tel}
            onChange={setTel}
            required
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="edit-whatsapp">WhatsApp</Label>
          <PhoneInput
            id="edit-whatsapp"
            value={whatsapp}
            onChange={setWhatsapp}
            className="mt-1.5"
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="edit-email">Email</Label>
          <Input
            id="edit-email"
            type="email"
            className="mt-1.5"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="edit-cellule">Cellule</Label>
          <CelluleCombobox
            id="edit-cellule"
            value={celluleLocale}
            onChange={setCelluleLocale}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="edit-zone">Zone / région</Label>
          <Input
            id="edit-zone"
            className="mt-1.5"
            value={zoneRegion}
            onChange={(e) => setZoneRegion(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="edit-pro">Profession</Label>
          <Input
            id="edit-pro"
            className="mt-1.5"
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="edit-autre">Autre expertise</Label>
          <Input
            id="edit-autre"
            className="mt-1.5"
            value={autreProfession}
            onChange={(e) => setAutreProfession(e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <Label>Cotisation prévue</Label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {MONTANTS.map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 text-sm transition-all",
                  montant === option.value
                    ? "border-[var(--ak-emerald-mid)] bg-[#E7F0EA]"
                    : "border-[#E6DCC0] bg-[var(--ak-ivory)] hover:border-[var(--ak-gold)]"
                )}
              >
                <input
                  type="radio"
                  name="edit-montant"
                  value={option.value}
                  checked={montant === option.value}
                  onChange={() => setMontant(option.value)}
                  className="accent-[var(--ak-emerald-deep)]"
                />
                <span>
                  <span className="block font-semibold text-[var(--ak-emerald-deep)]">
                    {option.label}
                  </span>
                  <span className="block text-xs text-[var(--ak-ink-soft)]">
                    {option.sub}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {montant === "autre" ? (
            <Input
              className="mt-2"
              placeholder="Montant en FCFA"
              value={montantAutre}
              onChange={(e) => setMontantAutre(e.target.value)}
              required
            />
          ) : null}
        </div>

        {msg ? (
          <div className="sm:col-span-2">
            <InlineMessage message={msg.text} variant={msg.type} />
          </div>
        ) : null}

        <div className="sm:col-span-2">
          <Button type="submit" disabled={loading} className="ak-cta-solid">
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </SectionCard>
  )
}
