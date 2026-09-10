import { PageHeader } from "@/components/shared/page-header"
import { ParametresClient } from "@/components/parametres/parametres-client"
import { AdminsPanel } from "@/components/parametres/admins-panel"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { paydunyaConfigured, paydunyaMode } from "@/lib/paydunya"
import { isWhatsAppCloudConfigured } from "@/lib/whatsapp"
import { redirect } from "next/navigation"

export const metadata = { title: "Paramètres" }

export default async function ParametresPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const admins = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
    },
  })

  return (
    <>
      <PageHeader
        title="Paramètres"
        description="Profil administrateur, équipe et sécurité."
      />
      <ParametresClient
        user={{
          name: session.name,
          email: session.email,
          role: session.role,
        }}
        paydunya={{
          configured: paydunyaConfigured(),
          mode: paydunyaMode(),
        }}
        whatsapp={{
          configured: isWhatsAppCloudConfigured(),
        }}
      />
      <div className="mx-auto mt-6 max-w-3xl">
        <AdminsPanel currentUserId={session.id} initial={admins} />
      </div>
    </>
  )
}
