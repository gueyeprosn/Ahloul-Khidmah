module.exports = {
  apps: [
    {
      name: "ahloul-khidma",
      cwd: "/var/www/ahloul-khidma",
      script: "node_modules/next/dist/bin/next",
      // Bind localhost only — Nginx is the public entrypoint
      args: "start -H 127.0.0.1 -p 3000",
      // 1 instance : SQLite ne gère pas bien plusieurs writers
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      kill_timeout: 5000,
      listen_timeout: 10000,
      exp_backoff_restart_delay: 200,
      // Secrets loaded from .env by Next.js — do not duplicate here
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "127.0.0.1",
        NODE_OPTIONS: "--max-old-space-size=768",
        ALLOW_INSECURE_COOKIES: "0",
      },
    },
  ],
}
