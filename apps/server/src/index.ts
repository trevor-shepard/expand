import { buildApp } from "./app.js";
import { loadAdminAuthConfig } from "./admin-auth.js";
import { createLevelRepository } from "./repositories/create-level-repository.js";

const port = Number(process.env.PORT ?? 8080);
const host = process.env.HOST ?? "0.0.0.0";
const isProduction = process.env.NODE_ENV === "production";
const app = await buildApp({
  repository: createLevelRepository(),
  auth: loadAdminAuthConfig(),
  logger: true,
  serveStatic: isProduction,
});

try {
  await app.listen({ port, host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
