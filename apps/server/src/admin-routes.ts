import {
  adminLevelResponseSchema,
  adminLevelsResponseSchema,
  levelInputSchema,
  reorderLevelsSchema,
} from "@expand/contracts";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AdminAuth } from "./admin-auth.js";
import type { LevelRepository } from "./repositories/level-repository.js";

const levelParamsSchema = z.object({
  id: z.string().uuid(),
}).strict();

const ADMIN_ACTOR = "admin";

export function registerAdminLevelRoutes(
  app: FastifyInstance,
  repository: LevelRepository,
  auth: AdminAuth,
): void {
  const readGuards = { preHandler: auth.requireAdmin };
  const writeGuards = {
    preHandler: [auth.requireAdmin, auth.requireSameOrigin],
  };

  app.get("/api/v1/admin/levels", readGuards, async () =>
    adminLevelsResponseSchema.parse({
      levels: await repository.listAdmin(),
    }));

  app.get("/api/v1/admin/levels/:id", readGuards, async (request) => {
    const { id } = levelParamsSchema.parse(request.params);
    return adminLevelResponseSchema.parse({
      level: await repository.getById(id),
    });
  });

  app.post("/api/v1/admin/levels", writeGuards, async (request, reply) => {
    const input = levelInputSchema.parse(request.body);
    const level = await repository.create(input, ADMIN_ACTOR);
    return reply.code(201).send(adminLevelResponseSchema.parse({ level }));
  });

  app.put("/api/v1/admin/levels/:id", writeGuards, async (request) => {
    const { id } = levelParamsSchema.parse(request.params);
    const input = levelInputSchema.parse(request.body);
    return adminLevelResponseSchema.parse({
      level: await repository.update(id, input, ADMIN_ACTOR),
    });
  });

  app.post(
    "/api/v1/admin/levels/:id/publish",
    writeGuards,
    async (request) => {
      const { id } = levelParamsSchema.parse(request.params);
      return adminLevelResponseSchema.parse({
        level: await repository.publish(id, ADMIN_ACTOR),
      });
    },
  );

  app.post(
    "/api/v1/admin/levels/:id/unpublish",
    writeGuards,
    async (request) => {
      const { id } = levelParamsSchema.parse(request.params);
      return adminLevelResponseSchema.parse({
        level: await repository.unpublish(id, ADMIN_ACTOR),
      });
    },
  );

  app.post(
    "/api/v1/admin/levels/:id/archive",
    writeGuards,
    async (request) => {
      const { id } = levelParamsSchema.parse(request.params);
      return adminLevelResponseSchema.parse({
        level: await repository.archive(id, ADMIN_ACTOR),
      });
    },
  );

  app.delete(
    "/api/v1/admin/levels/:id",
    writeGuards,
    async (request) => {
      const { id } = levelParamsSchema.parse(request.params);
      return adminLevelResponseSchema.parse({
        level: await repository.archive(id, ADMIN_ACTOR),
      });
    },
  );

  app.patch(
    "/api/v1/admin/levels/reorder",
    writeGuards,
    async (request) => {
      const { levelIds } = reorderLevelsSchema.parse(request.body);
      return adminLevelsResponseSchema.parse({
        levels: await repository.reorder(levelIds, ADMIN_ACTOR),
      });
    },
  );
}
