import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineProject } from "vitest/config";

const appDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineProject({
  resolve: {
    alias: {
      "@expand/contracts": path.resolve(
        appDirectory,
        "../../packages/contracts/src/index.ts",
      ),
      "@expand/game-engine": path.resolve(
        appDirectory,
        "../../packages/game-engine/src/index.ts",
      ),
    },
  },
  test: {
    name: "web",
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
