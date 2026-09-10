#!/usr/bin/env node
// Copie hors-serveur (Firebase Storage) de la sauvegarde SQLite déjà créée
// et déjà vérifiée par deploy/backup.sh. N'échoue jamais la sauvegarde
// locale : un problème ici n'est qu'une alerte, la sauvegarde locale reste
// la copie de référence.
//
// Usage : node deploy/backup-to-firebase.mjs <chemin-du-fichier-.backup>
//
// Variables d'environnement requises (voir .env.example) :
//   FIREBASE_STORAGE_BUCKET       - nom du bucket (pas secret)
//   FIREBASE_SERVICE_ACCOUNT_PATH - chemin vers le fichier JSON du compte
//                                   de service (le fichier lui-même est
//                                   secret, jamais son chemin)

import { existsSync } from "fs"
import path from "path"

const localFilePath = process.argv[2]

function fail(message) {
  console.error(`backup-to-firebase: ${message}`)
  process.exit(1)
}

if (!localFilePath) {
  fail("chemin du fichier de sauvegarde manquant (argument requis)")
}
if (!existsSync(localFilePath)) {
  fail(`fichier introuvable : ${localFilePath}`)
}

const bucketName = process.env.FIREBASE_STORAGE_BUCKET
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH

if (!bucketName || !serviceAccountPath) {
  fail(
    "FIREBASE_STORAGE_BUCKET et FIREBASE_SERVICE_ACCOUNT_PATH doivent être définis dans .env"
  )
}
if (!existsSync(serviceAccountPath)) {
  fail(
    `compte de service introuvable à ${serviceAccountPath} — voir la procédure de configuration Firebase`
  )
}

const { initializeApp, cert } = await import("firebase-admin/app")
const { getStorage } = await import("firebase-admin/storage")

try {
  const app = initializeApp({
    credential: cert(serviceAccountPath),
    storageBucket: bucketName,
  })

  const destination = `backups/${path.basename(localFilePath)}`
  await getStorage(app).bucket().upload(localFilePath, { destination })

  console.log(`backup-to-firebase: ok → gs://${bucketName}/${destination}`)
} catch (e) {
  fail(`échec de l'envoi vers Firebase : ${e instanceof Error ? e.message : String(e)}`)
}
