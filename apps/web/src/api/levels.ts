import {
  levelsListResponseSchema,
  STARTER_LEVELS,
  type PlayableLevel,
} from "@expand/contracts";

export async function fetchPublishedLevels(): Promise<PlayableLevel[]> {
  if (import.meta.env.VITE_STATIC_LEVELS === "true") {
    return STARTER_LEVELS;
  }

  const response = await fetch("/api/v1/levels");
  if (!response.ok) {
    throw new Error(`Failed to load levels (${response.status})`);
  }
  const json = await response.json();
  const parsed = levelsListResponseSchema.parse(json);
  return parsed.levels;
}
