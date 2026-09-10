import { redirect } from "next/navigation"

/** Ancienne URL — redirige vers l'espace membre unifié. */
export default function MesVersementsRedirect() {
  redirect("/mon-espace")
}
