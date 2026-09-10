import { existsSync } from "node:fs"
import path from "node:path"

const envTestPath = path.resolve(process.cwd(), ".env.test")
if (existsSync(envTestPath)) {
  process.loadEnvFile(envTestPath)
}

// Garde-fou : ne jamais laisser la suite tourner contre la vraie base — une
// erreur de configuration ici pourrait sinon vider des données réelles de
// membres/commandes. On refuse de démarrer plutôt que de risquer ça.
const dbUrl = process.env.DATABASE_URL || ""
if (!dbUrl.includes("test")) {
  throw new Error(
    `DATABASE_URL ne contient pas "test" (${dbUrl}) — tests.setup.ts refuse de continuer pour ne jamais toucher une base réelle.`
  )
}
