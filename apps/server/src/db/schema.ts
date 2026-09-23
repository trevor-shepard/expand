import type { CellCoordinate } from "@expand/contracts";
import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const levelStatusEnum = pgEnum("level_status", [
  "draft",
  "published",
  "archived",
]);

export const levels = pgTable(
  "levels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 64 }).notNull(),
    title: varchar("title", { length: 80 }).notNull(),
    description: varchar("description", { length: 500 }),
    width: smallint("width").notNull(),
    height: smallint("height").notNull(),
    clickLimit: integer("click_limit").notNull(),
    initialLiveCells: jsonb("initial_live_cells")
      .$type<CellCoordinate[]>()
      .notNull(),
    status: levelStatusEnum("status").notNull().default("draft"),
    position: integer("position"),
    revision: integer("revision").notNull().default(1),
    createdBy: text("created_by").notNull(),
    updatedBy: text("updated_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("levels_slug_unique").on(table.slug),
    uniqueIndex("levels_published_position_unique")
      .on(table.position)
      .where(sql`${table.status} = 'published'`),
    index("levels_status_position_idx").on(table.status, table.position),
    check("levels_width_check", sql`${table.width} between 2 and 50`),
    check("levels_height_check", sql`${table.height} between 2 and 50`),
    check(
      "levels_click_limit_check",
      sql`${table.clickLimit} >= 1 and ${table.clickLimit} <= ${table.width} * ${table.height}`,
    ),
    check("levels_revision_check", sql`${table.revision} >= 1`),
    check(
      "levels_position_status_check",
      sql`(${table.status} = 'published' and ${table.position} >= 1) or (${table.status} <> 'published' and ${table.position} is null)`,
    ),
    check(
      "levels_initial_cells_check",
      sql`jsonb_typeof(${table.initialLiveCells}) = 'array' and jsonb_array_length(${table.initialLiveCells}) >= 1`,
    ),
  ],
);

export type LevelRow = typeof levels.$inferSelect;
export type NewLevelRow = typeof levels.$inferInsert;
