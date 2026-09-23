import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineProject, mergeConfig } from "vitest/config";
import rootConfig from "../../vitest.config.js";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default mergeConfig(rootConfig, defineProject({
  resolve: {
    alias: {
      "@expand/contracts": path.resolve(rootDir, "../contracts/src/index.ts"),
    },
  },
  test: {
    name: "game-engine",
    include: ["src/**/*.test.ts"],
  },
}));
