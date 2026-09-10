import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    // Un seul fichier SQLite partagé par toute la suite — jamais deux
    // process/threads n'y écrivent en même temps (SQLite single-writer,
    // même contrainte qu'en production).
    fileParallelism: false,
    testTimeout: 15000,
    include: ["tests/**/*.test.ts"],
  },
})
