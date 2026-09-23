import { describe, expect, it } from "vitest";
import { levelsListResponseSchema } from "@expand/contracts";
import { listPublishedLevels } from "./levels-service.js";

describe("listPublishedLevels", () => {
  it("returns six ordered published starter levels", () => {
    const body = listPublishedLevels();
    expect(() => levelsListResponseSchema.parse(body)).not.toThrow();
    expect(body.levels).toHaveLength(6);
    expect(body.levels.map((l) => l.position)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(body.levels[0].slug).toBe("starter-01-blinker");
    expect(body.levels[5].slug).toBe("starter-06-beacon-large");
  });
});
