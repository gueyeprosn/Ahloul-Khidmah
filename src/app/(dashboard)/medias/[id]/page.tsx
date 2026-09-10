import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/db"
import { AlbumEditor } from "@/components/cms/album-editor"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const album = await prisma.album.findUnique({ where: { id } })
  return { title: album ? `Album · ${album.title}` : "Album" }
}

export default async function AlbumDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const album = await prisma.album.findUnique({
    where: { id },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  })
  if (!album) notFound()

  return (
    <>
      <PageHeader
        title={album.title}
        description={`Clé « ${album.key} » · ${album.photos.length} photo(s)`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/medias">
              <ArrowLeft className="size-3.5" />
              Albums
            </Link>
          </Button>
        }
      />
      <AlbumEditor
        album={{
          id: album.id,
          key: album.key,
          title: album.title,
          description: album.description,
          published: album.published,
        }}
        photos={album.photos.map((p) => ({
          id: p.id,
          src: p.src,
          alt: p.alt,
          caption: p.caption,
          published: p.published,
          sortOrder: p.sortOrder,
        }))}
      />
    </>
  )
}
