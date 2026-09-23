CREATE TYPE "public"."level_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(64) NOT NULL,
	"title" varchar(80) NOT NULL,
	"description" varchar(500),
	"width" smallint NOT NULL,
	"height" smallint NOT NULL,
	"click_limit" integer NOT NULL,
	"initial_live_cells" jsonb NOT NULL,
	"status" "level_status" DEFAULT 'draft' NOT NULL,
	"position" integer,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "levels_width_check" CHECK ("levels"."width" between 2 and 50),
	CONSTRAINT "levels_height_check" CHECK ("levels"."height" between 2 and 50),
	CONSTRAINT "levels_click_limit_check" CHECK ("levels"."click_limit" >= 1 and "levels"."click_limit" <= "levels"."width" * "levels"."height"),
	CONSTRAINT "levels_revision_check" CHECK ("levels"."revision" >= 1),
	CONSTRAINT "levels_position_status_check" CHECK (("levels"."status" = 'published' and "levels"."position" >= 1) or ("levels"."status" <> 'published' and "levels"."position" is null)),
	CONSTRAINT "levels_initial_cells_check" CHECK (jsonb_typeof("levels"."initial_live_cells") = 'array' and jsonb_array_length("levels"."initial_live_cells") >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "levels_slug_unique" ON "levels" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "levels_published_position_unique" ON "levels" USING btree ("position") WHERE "levels"."status" = 'published';--> statement-breakpoint
CREATE INDEX "levels_status_position_idx" ON "levels" USING btree ("status","position");