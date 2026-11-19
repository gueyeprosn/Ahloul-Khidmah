// STAGING uniquement — ne jamais utiliser en production.
// Base anonymisée + .env isolé (voir /var/ahloulkhidmah-mobile/docs/PHASE_B_RESULTATS.md).
module.exports = {
  apps: [
    {
      name: "ahloul-khidma-staging",
      cwd: "/var/www/ahloul-khidma-staging",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3001",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "700M",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        HOSTNAME: "127.0.0.1",
        NODE_OPTIONS: "--max-old-space-size=512",
        ALLOW_INSECURE_COOKIES: "1",
      },
    },
  ],
}
