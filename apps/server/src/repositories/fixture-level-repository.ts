import { randomUUID } from "node:crypto";
import {
  STARTER_LEVELS,
  adminLevelSchema,
  adminLevelsResponseSchema,
  levelInputSchema,
  levelsListResponseSchema,
  playableLevelSchema,
  type AdminLevel,
  type LevelInput,
  type PlayableLevel,
} from "@expand/contracts";
import {
  RepositoryError,
  type LevelRepository,
} from "./level-repository.js";

interface FixtureRepositoryOptions {
  levels?: PlayableLevel[];
  now?: () => Date;
  createId?: () => string;
}

function cloneLevel(level: AdminLevel): AdminLevel {
  return structuredClone(level);
}

export class FixtureLevelRepository implements LevelRepository {
  private readonly levels = new Map<string, AdminLevel>();
  private readonly now: () => Date;
  private readonly createId: () => string;

  constructor(options: FixtureRepositoryOptions = {}) {
    this.now = options.now ?? (() => new Date());
    this.createId = options.createId ?? randomUUID;
    const timestamp = this.now().toISOString();

    for (const level of options.levels ?? STARTER_LEVELS) {
      const adminLevel = adminLevelSchema.parse({
        ...structuredClone(level),
        status: "published",
        createdAt: timestamp,
        updatedAt: timestamp,
        publishedAt: timestamp,
      });
      this.levels.set(adminLevel.id, adminLevel);
    }
  }

  async listPublished() {
    const levels = [...this.levels.values()]
      .filter((level) => level.status === "published")
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((level) =>
        playableLevelSchema.parse({
          id: level.id,
          slug: level.slug,
          title: level.title,
          description: level.description,
          width: level.width,
          height: level.height,
          clickLimit: level.clickLimit,
          initialLiveCells: structuredClone(level.initialLiveCells),
          position: level.position,
          revision: level.revision,
        }),
      );

    return levelsListResponseSchema.parse({ levels });
  }

  async listAdmin(): Promise<AdminLevel[]> {
    return adminLevelsResponseSchema.parse({
      levels: [...this.levels.values()]
        .sort((a, b) => {
          if (a.status === "published" && b.status === "published") {
            return (a.position ?? 0) - (b.position ?? 0);
          }
          if (a.status === "published") return -1;
          if (b.status === "published") return 1;
          return b.updatedAt.localeCompare(a.updatedAt);
        })
        .map(cloneLevel),
    }).levels;
  }

  async getById(id: string): Promise<AdminLevel> {
    return cloneLevel(this.requireLevel(id));
  }

  async create(input: LevelInput, _actor: string): Promise<AdminLevel> {
    const parsed = levelInputSchema.parse(input);
    this.ensureSlugAvailable(parsed.slug);
    const timestamp = this.now().toISOString();
    const level = adminLevelSchema.parse({
      id: this.createId(),
      ...structuredClone(parsed),
      status: "draft",
      position: null,
      revision: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      publishedAt: null,
    });
    this.levels.set(level.id, level);
    return cloneLevel(level);
  }

  async update(id: string, input: LevelInput, _actor: string): Promise<AdminLevel> {
    const current = this.requireLevel(id);
    const parsed = levelInputSchema.parse(input);
    this.ensureSlugAvailable(parsed.slug, id);
    const updated = adminLevelSchema.parse({
      ...current,
      ...structuredClone(parsed),
      revision: current.revision + 1,
      updatedAt: this.now().toISOString(),
    });
    this.levels.set(id, updated);
    return cloneLevel(updated);
  }

  async publish(id: string, _actor: string): Promise<AdminLevel> {
    const current = this.requireLevel(id);
    if (current.status === "published") return cloneLevel(current);
    const positions = [...this.levels.values()]
      .filter((level) => level.status === "published")
      .map((level) => level.position ?? 0);
    const timestamp = this.now().toISOString();
    const updated = adminLevelSchema.parse({
      ...current,
      status: "published",
      position: Math.max(0, ...positions) + 1,
      revision: current.revision + 1,
      updatedAt: timestamp,
      publishedAt: timestamp,
    });
    this.levels.set(id, updated);
    return cloneLevel(updated);
  }

  async unpublish(id: string, _actor: string): Promise<AdminLevel> {
    const current = this.requireLevel(id);
    if (current.status !== "published") return cloneLevel(current);
    const updated = adminLevelSchema.parse({
      ...current,
      status: "draft",
      position: null,
      revision: current.revision + 1,
      updatedAt: this.now().toISOString(),
      publishedAt: null,
    });
    this.levels.set(id, updated);
    this.normalizePublishedPositions();
    return cloneLevel(updated);
  }

  async archive(id: string, _actor: string): Promise<AdminLevel> {
    const current = this.requireLevel(id);
    if (current.status === "archived") return cloneLevel(current);
    const updated = adminLevelSchema.parse({
      ...current,
      status: "archived",
      position: null,
      revision: current.revision + 1,
      updatedAt: this.now().toISOString(),
      publishedAt: null,
    });
    this.levels.set(id, updated);
    this.normalizePublishedPositions();
    return cloneLevel(updated);
  }

  async reorder(levelIds: string[], _actor: string): Promise<AdminLevel[]> {
    const published = [...this.levels.values()]
      .filter((level) => level.status === "published");
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

    const timestamp = this.now().toISOString();
    levelIds.forEach((id, index) => {
      const current = this.requireLevel(id);
      this.levels.set(
        id,
        adminLevelSchema.parse({
          ...current,
          position: index + 1,
          revision: current.revision + 1,
          updatedAt: timestamp,
        }),
      );
    });

    return Promise.all(levelIds.map((id) => this.getById(id)));
  }

  private requireLevel(id: string): AdminLevel {
    const level = this.levels.get(id);
    if (!level) {
      throw new RepositoryError("NOT_FOUND", `Level ${id} was not found`);
    }
    return level;
  }

  private ensureSlugAvailable(slug: string, exceptId?: string): void {
    const duplicate = [...this.levels.values()].find(
      (level) => level.slug === slug && level.id !== exceptId,
    );
    if (duplicate) {
      throw new RepositoryError("CONFLICT", `Slug "${slug}" is already in use`);
    }
  }

  private normalizePublishedPositions(): void {
    const published = [...this.levels.values()]
      .filter((level) => level.status === "published")
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    published.forEach((level, index) => {
      if (level.position !== index + 1) {
        this.levels.set(level.id, {
          ...level,
          position: index + 1,
        });
      }
    });
  }
}
