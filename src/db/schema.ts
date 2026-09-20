import { sql } from 'drizzle-orm';
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
} from 'drizzle-orm/pg-core';

import type { CellCoordinate } from '../shared/level-contract';

export const levelStatus = pgEnum('level_status', [
  'draft',
  'published',
  'archived',
]);

export const levels = pgTable(
  'levels',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: varchar('slug', { length: 64 }).notNull(),
    title: varchar('title', { length: 80 }).notNull(),
    description: varchar('description', { length: 500 }),
    width: smallint('width').notNull(),
    height: smallint('height').notNull(),
    clickLimit: integer('click_limit').notNull(),
    initialLiveCells: jsonb('initial_live_cells')
      .$type<CellCoordinate[]>()
      .notNull(),
    status: levelStatus('status').default('draft').notNull(),
    position: integer('position'),
    revision: integer('revision').default(1).notNull(),
    createdBy: text('created_by').notNull(),
    updatedBy: text('updated_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('levels_slug_unique').on(table.slug),
    index('levels_status_position_index').on(table.status, table.position),
    check('levels_width_range', sql`${table.width} between 2 and 50`),
    check('levels_height_range', sql`${table.height} between 2 and 50`),
    check(
      'levels_click_limit_range',
      sql`${table.clickLimit} > 0 and ${table.clickLimit} <= ${table.width} * ${table.height}`,
    ),
    check(
      'levels_position_status',
      sql`(${table.status} = 'published' and ${table.position} > 0) or (${table.status} <> 'published' and ${table.position} is null)`,
    ),
    check('levels_revision_positive', sql`${table.revision} > 0`),
    check(
      'levels_initial_cells_array',
      sql`jsonb_typeof(${table.initialLiveCells}) = 'array'`,
    ),
  ],
);
