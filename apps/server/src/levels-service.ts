import {
  STARTER_LEVELS,
  levelsListResponseSchema,
  type LevelsListResponse,
} from "@expand/contracts";

/** Phase 1: validated legacy fixture. Phase 2 swaps in Drizzle repository. */
export function listPublishedLevels(): LevelsListResponse {
  const levels = [...STARTER_LEVELS].sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return a.slug.localeCompare(b.slug);
  });

  return levelsListResponseSchema.parse({ levels });
}

export function levelsEtag(levels: LevelsListResponse): string {
  const payload = levels.levels.map((l) => `${l.id}:${l.revision}`).join(",");
  return `"${Buffer.from(payload).toString("base64url")}"`;
}
