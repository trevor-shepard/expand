import { STARTER_LEVELS } from "@expand/contracts";
import { count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { levels } from "./schema.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed PostgreSQL");
}

const client = postgres(databaseUrl, { max: 1 });
const db = drizzle(client);

try {
  await db.transaction(async (tx) => {
    const [{ value }] = await tx.select({ value: count() }).from(levels);
    if (value > 0) {
      console.log(`Seed skipped: levels table already contains ${value} row(s).`);
      return;
    }

    await tx.insert(levels).values(
      STARTER_LEVELS.map((level) => ({
        id: level.id,
        slug: level.slug,
        title: level.title,
        description: level.description,
        width: level.width,
        height: level.height,
        clickLimit: level.clickLimit,
        initialLiveCells: level.initialLiveCells,
        status: "published" as const,
        position: level.position,
        revision: level.revision,
        createdBy: "seed",
        updatedBy: "seed",
        publishedAt: new Date(),
      })),
    );
    console.log(`Seeded ${STARTER_LEVELS.length} starter levels.`);
  });
} finally {
  await client.end();
}
