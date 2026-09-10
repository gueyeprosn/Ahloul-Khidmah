import { mkdir } from "fs/promises"
import path from "path"
import Link from "next/link"
import { Plus, Images } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge } from "@/components/shared/status-badge"
import { SectionCard } from "@/components/shared/section-card"
import {
  DataTable,
  DataTableRoot,
  DataTableHead,
  DataTableBody,
  Th,
  Tr,
  Td,
} from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/db"
import { CreateAlbumForm } from "@/components/cms/create-album-form"
import { DeleteAlbumButton } from "@/components/cms/delete-album-button"

export const metadata = { title: "Médias" }

export default async function MediasPage() {
  // Assure le dossier uploads
  await mkdir(path.join(process.cwd(), "public", "uploads"), {
    recursive: true,
  }).catch(() => {})

  const albums = await prisma.album.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    include: { _count: { select: { photos: true } } },
  })

  return (
    <>
      <PageHeader
        title="Albums photo"
        description="Gérez le carousel Vision et la galerie du site public."
      />

      <CreateAlbumForm />

      {albums.length === 0 ? (
        <EmptyState
          icon={Images}
          title="Aucun album"
          description="Créez un album pour commencer."
        />
      ) : (
        <SectionCard title="Albums" flush>
          <DataTable className="rounded-none border-0">
            <DataTableRoot>
              <DataTableHead>
                <Th>Album</Th>
                <Th>Clé</Th>
                <Th>Photos</Th>
                <Th>Statut</Th>
                <Th />
              </DataTableHead>
              <DataTableBody>
                {albums.map((a) => (
                  <Tr key={a.id}>
                    <Td>
                      <div className="font-medium text-[var(--ak-emerald-deep)]">
                        {a.title}
                      </div>
                      {a.description ? (
                        <div className="text-xs text-muted-foreground">
                          {a.description}
                        </div>
                      ) : null}
                    </Td>
                    <Td className="font-mono text-xs">{a.key}</Td>
                    <Td className="tabular-nums">{a._count.photos}</Td>
                    <Td>
                      <StatusBadge
                        label={a.published ? "Publié" : "Brouillon"}
                        variant={a.published ? "success" : "neutral"}
                      />
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/medias/${a.id}`}>
                            <Plus className="size-3.5" />
                            Gérer
                          </Link>
                        </Button>
                        <DeleteAlbumButton albumId={a.id} albumKey={a.key} />
                      </div>
                    </Td>
                  </Tr>
                ))}
              </DataTableBody>
            </DataTableRoot>
          </DataTable>
        </SectionCard>
      )}
    </>
  )
}
