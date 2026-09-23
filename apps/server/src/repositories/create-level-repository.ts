import { z } from "zod";
import { FixtureLevelRepository } from "./fixture-level-repository.js";
import type { LevelRepository } from "./level-repository.js";
import { PostgresLevelRepository } from "./postgres-level-repository.js";

const repositoryEnvironmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LEVEL_REPOSITORY: z.enum(["fixture", "postgres"]).optional(),
  DATABASE_URL: z.string().url().optional(),
}).passthrough();

export function createLevelRepository(
  environment: NodeJS.ProcessEnv = process.env,
): LevelRepository {
  const env = repositoryEnvironmentSchema.parse(environment);
  const mode = env.LEVEL_REPOSITORY ?? (env.DATABASE_URL ? "postgres" : "fixture");

  if (env.NODE_ENV === "production" && mode !== "postgres") {
    throw new Error(
      "Production requires DATABASE_URL and LEVEL_REPOSITORY=postgres",
    );
  }
  if (mode === "postgres") {
    if (!env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required for the PostgreSQL repository");
    }
    return PostgresLevelRepository.connect(env.DATABASE_URL);
  }

  return new FixtureLevelRepository();
}
