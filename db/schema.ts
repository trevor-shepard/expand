import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/** Drizzle-ready schema for Phase 2 persistence (not wired in Phase 1). */
export const levelStatusEnum = pgEnum("level_status", ["draft", "published", "archived"]);

export const levels = pgTable("levels", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 80 }).notNull(),
  description: varchar("description", { length: 500 }),
  width: smallint("width").notNull(),
  height: smallint("height").notNull(),
  clickLimit: integer("click_limit").notNull(),
  initialLiveCells: jsonb("initial_live_cells").notNull(),
  status: levelStatusEnum("status").notNull().default("draft"),
  position: integer("position"),
  revision: integer("revision").notNull().default(1),
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

export type LevelRow = typeof levels.$inferSelect;
export type NewLevelRow = typeof levels.$inferInsert;
