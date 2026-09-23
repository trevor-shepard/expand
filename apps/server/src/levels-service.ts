import {
  levelsListResponseSchema,
  type LevelsListResponse,
} from "@expand/contracts";
import type { LevelRepository } from "./repositories/level-repository.js";

export async function listPublishedLevels(
  repository: LevelRepository,
): Promise<LevelsListResponse> {
  return levelsListResponseSchema.parse(await repository.listPublished());
}

export function levelsEtag(levels: LevelsListResponse): string {
  const payload = levels.levels.map((l) => `${l.id}:${l.revision}`).join(",");
  return `"${Buffer.from(payload).toString("base64url")}"`;
}
