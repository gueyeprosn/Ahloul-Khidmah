import { redirect } from "next/navigation"

/** Alias pratique : /admin → tableau de bord. */
export default function AdminIndexPage() {
  redirect("/dashboard")
}
