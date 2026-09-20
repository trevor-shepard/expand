import { describe, expect, it } from "vitest";
import { STARTER_LEVELS, STARTER_LEVELS_RAW } from "./starter-levels.js";
import { playableLevelSchema } from "./level-contract.js";

describe("starter levels fixture", () => {
  it("validates all six legacy levels with the shared schema", () => {
    for (const level of STARTER_LEVELS_RAW) {
      expect(() => playableLevelSchema.parse(level)).not.toThrow();
    }
    expect(STARTER_LEVELS).toHaveLength(6);
  });

  it("matches legacy dimensions, click limits, and coordinate counts", () => {
    const expected = [
      { w: 4, h: 4, clicks: 5, cells: 3 },
      { w: 8, h: 10, clicks: 30, cells: 8 },
      { w: 8, h: 6, clicks: 7, cells: 6 },
      { w: 12, h: 12, clicks: 25, cells: 5 },
      { w: 20, h: 20, clicks: 20, cells: 48 },
      { w: 20, h: 20, clicks: 13, cells: 8 },
    ];
    STARTER_LEVELS.forEach((level, i) => {
      expect(level.width).toBe(expected[i].w);
      expect(level.height).toBe(expected[i].h);
      expect(level.clickLimit).toBe(expected[i].clicks);
      expect(level.initialLiveCells).toHaveLength(expected[i].cells);
      expect(level.position).toBe(i + 1);
    });
  });

  it("orders levels by position then slug", () => {
    const sorted = [...STARTER_LEVELS].sort((a, b) => {
      if (a.position !== b.position) return a.position - b.position;
      return a.slug.localeCompare(b.slug);
    });
    expect(sorted.map((l) => l.slug)).toEqual(STARTER_LEVELS.map((l) => l.slug));
  });
});
