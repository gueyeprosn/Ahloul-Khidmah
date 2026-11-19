import { PageHeader } from "@/components/shared/page-header"
import { SendPushForm } from "@/components/notifications/send-push-form"
import { prisma } from "@/lib/db"
import { pushConfigured } from "@/lib/push"

export const metadata = { title: "Notifications" }
export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const [total, members, byPlatform] = await Promise.all([
    prisma.deviceToken.count(),
    prisma.deviceToken.count({ where: { adherentId: { not: null } } }),
    prisma.deviceToken.groupBy({ by: ["platform"], _count: true }),
  ])
  const platforms = Object.fromEntries(byPlatform.map((p) => [p.platform, p._count]))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Envoyez une notification aux membres qui l'ont activée (application mobile et site installé)."
      />
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Appareils", total],
          ["Reliés à un membre", members],
          ["Android", platforms.android ?? 0],
          ["iPhone", platforms.ios ?? 0],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Navigateurs (PWA) : {platforms.web ?? 0}</p>
      <SendPushForm configured={pushConfigured()} devices={total} />
    </div>
  )
}
