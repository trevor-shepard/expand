import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./apps/server/src/db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL }
    : undefined,
});
