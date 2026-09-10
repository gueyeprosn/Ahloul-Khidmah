module.exports = {
  apps: [
    {
      name: "ahloul-khidma",
      cwd: "/var/www/ahloul-khidma",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3000",
      // 1 instance : SQLite ne supporte pas bien plusieurs writers
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      kill_timeout: 5000,
      listen_timeout: 10000,
      exp_backoff_restart_delay: 200,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        NODE_OPTIONS: "--max-old-space-size=768",
      },
    },
  ],
}
