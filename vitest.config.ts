import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@expand/contracts": path.resolve(rootDir, "packages/contracts/src/index.ts"),
      "@expand/game-engine": path.resolve(rootDir, "packages/game-engine/src/index.ts"),
    },
  },
  test: {
    projects: [
      "packages/contracts",
      "packages/game-engine",
      "apps/server",
    ],
  },
});
