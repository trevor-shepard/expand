import {
  adminLevelSchema,
  levelsListResponseSchema,
  playableLevelSchema,
  type AdminLevel,
  type LevelInput,
} from "@expand/contracts";
import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "../db/schema.js";
import { levels, type LevelRow } from "../db/schema.js";
import {
  RepositoryError,
  type LevelRepository,
} from "./level-repository.js";

function toAdminLevel(row: LevelRow): AdminLevel {
  return adminLevelSchema.parse({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    width: row.width,
    height: row.height,
    clickLimit: row.clickLimit,
    initialLiveCells: row.initialLiveCells,
    status: row.status,
    position: row.position,
    revision: row.revision,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    publishedAt: row.publishedAt?.toISOString() ?? null,
  });
}

function toPlayableLevel(row: LevelRow) {
  return playableLevelSchema.parse({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    width: row.width,
    height: row.height,
    clickLimit: row.clickLimit,
    initialLiveCells: row.initialLiveCells,
    position: row.position,
    revision: row.revision,
  });
}

function translateDatabaseError(error: unknown): never {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  ) {
    throw new RepositoryError("CONFLICT", "A level with that slug already exists");
  }
  throw error;
}

export class PostgresLevelRepository implements LevelRepository {
  private constructor(
    private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly client?: Sql,
  ) {}

  static connect(databaseUrl: string): PostgresLevelRepository {
    const client = postgres(databaseUrl, {
      max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
      idle_timeout: 20,
      connect_timeout: 10,
    });
    return new PostgresLevelRepository(drizzle(client, { schema }), client);
  }

  static fromDatabase(
    db: PostgresJsDatabase<typeof schema>,
  ): PostgresLevelRepository {
    return new PostgresLevelRepository(db);
  }

  async close(): Promise<void> {
    await this.client?.end();
  }

  async listPublished() {
    const rows = await this.db
      .select()
      .from(levels)
      .where(eq(levels.status, "published"))
      .orderBy(asc(levels.position), asc(levels.slug));
    return levelsListResponseSchema.parse({
      levels: rows.map(toPlayableLevel),
    });
  }

  async listAdmin(): Promise<AdminLevel[]> {
    const rows = await this.db
      .select()
      .from(levels)
      .orderBy(
        sql`case when ${levels.status} = 'published' then 0 else 1 end`,
        asc(levels.position),
        desc(levels.updatedAt),
      );
    return rows.map(toAdminLevel);
  }

  async getById(id: string): Promise<AdminLevel> {
    const [row] = await this.db.select().from(levels).where(eq(levels.id, id));
    if (!row) {
      throw new RepositoryError("NOT_FOUND", `Level ${id} was not found`);
    }
    return toAdminLevel(row);
  }

  async create(input: LevelInput, actor: string): Promise<AdminLevel> {
    try {
      const [row] = await this.db
        .insert(levels)
        .values({
          ...input,
          status: "draft",
          position: null,
          createdBy: actor,
          updatedBy: actor,
        })
        .returning();
      return toAdminLevel(row);
    } catch (error) {
      translateDatabaseError(error);
    }
  }

  async update(
    id: string,
    input: LevelInput,
    actor: string,
  ): Promise<AdminLevel> {
    try {
      const [row] = await this.db
        .update(levels)
        .set({
          ...input,
          updatedBy: actor,
          updatedAt: new Date(),
          revision: sql`${levels.revision} + 1`,
        })
        .where(eq(levels.id, id))
        .returning();
      if (!row) {
        throw new RepositoryError("NOT_FOUND", `Level ${id} was not found`);
      }
      return toAdminLevel(row);
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      translateDatabaseError(error);
    }
  }

  async publish(id: string, actor: string): Promise<AdminLevel> {
    return this.db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(levels)
        .where(eq(levels.id, id))
        .for("update");
      if (!current) {
        throw new RepositoryError("NOT_FOUND", `Level ${id} was not found`);
      }
      if (current.status === "published") return toAdminLevel(current);

      const [positionRow] = await tx
        .select({ max: sql<number>`coalesce(max(${levels.position}), 0)` })
        .from(levels)
        .where(eq(levels.status, "published"));
      const timestamp = new Date();
      const [row] = await tx
        .update(levels)
        .set({
          status: "published",
          position: Number(positionRow.max) + 1,
          publishedAt: timestamp,
          updatedAt: timestamp,
          updatedBy: actor,
          revision: sql`${levels.revision} + 1`,
        })
        .where(eq(levels.id, id))
        .returning();
      return toAdminLevel(row);
    });
  }

  async unpublish(id: string, actor: string): Promise<AdminLevel> {
    return this.setInactiveStatus(id, "draft", actor);
  }

  async archive(id: string, actor: string): Promise<AdminLevel> {
    return this.setInactiveStatus(id, "archived", actor);
  }

  async reorder(levelIds: string[], actor: string): Promise<AdminLevel[]> {
    return this.db.transaction(async (tx) => {
      const published = await tx
        .select()
        .from(levels)
        .where(eq(levels.status, "published"))
        .orderBy(asc(levels.position))
        .for("update");
      const expectedIds = new Set(published.map((level) => level.id));
      if (
        levelIds.length !== expectedIds.size ||
        levelIds.some((id) => !expectedIds.has(id)) ||
        new Set(levelIds).size !== levelIds.length
      ) {
        throw new RepositoryError(
          "INVALID_REORDER",
          "levelIds must contain every published level exactly once",
        );
      }

      const offset = levelIds.length + 1;
      await tx
        .update(levels)
        .set({ position: sql`${levels.position} + ${offset}` })
        .where(eq(levels.status, "published"));

      const timestamp = new Date();
      const reordered: AdminLevel[] = [];
      for (const [index, levelId] of levelIds.entries()) {
        const [row] = await tx
          .update(levels)
          .set({
            position: index + 1,
            updatedAt: timestamp,
            updatedBy: actor,
            revision: sql`${levels.revision} + 1`,
          })
          .where(eq(levels.id, levelId))
          .returning();
        reordered.push(toAdminLevel(row));
      }
      return reordered;
    });
  }

  private async setInactiveStatus(
    id: string,
    status: "draft" | "archived",
    actor: string,
  ): Promise<AdminLevel> {
    return this.db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(levels)
        .where(eq(levels.id, id))
        .for("update");
      if (!current) {
        throw new RepositoryError("NOT_FOUND", `Level ${id} was not found`);
      }
      if (current.status === status) return toAdminLevel(current);

      const timestamp = new Date();
      const [row] = await tx
        .update(levels)
        .set({
          status,
          position: null,
          publishedAt: null,
          updatedAt: timestamp,
          updatedBy: actor,
          revision: sql`${levels.revision} + 1`,
        })
        .where(eq(levels.id, id))
        .returning();

      if (current.status === "published") {
        const remaining = await tx
          .select({ id: levels.id, position: levels.position })
          .from(levels)
          .where(
            and(eq(levels.status, "published"), ne(levels.id, id)),
          )
          .orderBy(asc(levels.position))
          .for("update");
        const offset = remaining.length + 1;
        await tx
          .update(levels)
          .set({ position: sql`${levels.position} + ${offset}` })
          .where(eq(levels.status, "published"));
        for (const [index, remainingLevel] of remaining.entries()) {
          if (remainingLevel.position !== index + 1) {
            await tx
              .update(levels)
              .set({
                position: index + 1,
                updatedAt: timestamp,
                updatedBy: actor,
                revision: sql`${levels.revision} + 1`,
              })
              .where(eq(levels.id, remainingLevel.id));
          } else {
            await tx
              .update(levels)
              .set({ position: index + 1 })
              .where(eq(levels.id, remainingLevel.id));
          }
        }
      }

      return toAdminLevel(row);
    });
  }
}
