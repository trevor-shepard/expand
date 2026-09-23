import path from "node:path";
import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";
import { apiErrorResponseSchema, levelsListResponseSchema } from "@expand/contracts";
import Fastify, { type FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { AdminAuth, type AdminAuthConfig } from "./admin-auth.js";
import { registerAdminLevelRoutes } from "./admin-routes.js";
import { levelsEtag, listPublishedLevels } from "./levels-service.js";
import {
  RepositoryError,
  type LevelRepository,
} from "./repositories/level-repository.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface BuildAppOptions {
  repository: LevelRepository;
  auth: AdminAuthConfig;
  logger?: boolean;
  serveStatic?: boolean;
  webDist?: string;
}

export async function buildApp(
  options: BuildAppOptions,
): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? false });
  const auth = new AdminAuth(options.auth);

  await auth.register(app);
  registerAdminLevelRoutes(app, options.repository, auth);

  app.get("/health", async () => ({ status: "ok" }));

  app.get("/api/v1/levels", async (request, reply) => {
    const body = await listPublishedLevels(options.repository);
    const etag = levelsEtag(body);
    const ifNoneMatch = request.headers["if-none-match"];

    reply.header("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    reply.header("ETag", etag);

    if (ifNoneMatch === etag) {
      return reply.code(304).send();
    }

    return levelsListResponseSchema.parse(body);
  });

  if (options.serveStatic) {
    await app.register(fastifyStatic, {
      root: options.webDist ?? path.resolve(__dirname, "../../web/dist"),
      prefix: "/",
    });

    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith("/api/")) {
        return reply.code(404).send({
          error: { code: "NOT_FOUND", message: "Not found" },
        });
      }
      return reply.sendFile("index.html");
    });
  }

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send(
        apiErrorResponseSchema.parse({
          error: {
            code: "VALIDATION_ERROR",
            message: "Request validation failed",
            issues: error.issues.map((issue) => ({
              path: issue.path.map((segment) =>
                typeof segment === "symbol" ? String(segment) : segment),
              message: issue.message,
            })),
          },
        }),
      );
    }

    if (error instanceof RepositoryError) {
      const statusCode = error.code === "NOT_FOUND" ? 404 : 409;
      return reply.code(statusCode).send({
        error: { code: error.code, message: error.message },
      });
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      error.statusCode === 429
    ) {
      return reply.code(429).send({
        error: {
          code: "RATE_LIMITED",
          message: "Too many login attempts; try again later",
        },
      });
    }

    app.log.error(error);
    return reply.code(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    });
  });

  if (options.repository.close) {
    app.addHook("onClose", async () => {
      await options.repository.close?.();
    });
  }

  return app;
}
