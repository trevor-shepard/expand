import { describe, expect, it } from "vitest";
import {
  adminLevelSchema,
  levelInputSchema,
  reorderLevelsSchema,
} from "./level-contract.js";

const validInput = {
  slug: "small-cross",
  title: "Small cross",
  description: null,
  width: 3,
  height: 3,
  clickLimit: 4,
  initialLiveCells: [
    { x: 1, y: 0 },
    { x: 1, y: 1 },
  ],
};

describe("admin level contracts", () => {
  it("accepts a valid editable level", () => {
    expect(levelInputSchema.parse(validInput)).toEqual(validInput);
  });

  it("rejects out-of-bounds and duplicate initial cells", () => {
    const result = levelInputSchema.safeParse({
      ...validInput,
      initialLiveCells: [
        { x: 3, y: 0 },
        { x: 1, y: 1 },
        { x: 1, y: 1 },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toEqual(
        expect.arrayContaining([
          "initial live cell out of bounds",
          "duplicate initial live cell coordinates",
        ]),
      );
    }
  });

  it("enforces status and position consistency", () => {
    const result = adminLevelSchema.safeParse({
      id: "00000000-0000-4000-8000-000000000001",
      ...validInput,
      status: "draft",
      position: 1,
      revision: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      publishedAt: null,
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate reorder IDs", () => {
    const id = "00000000-0000-4000-8000-000000000001";
    expect(reorderLevelsSchema.safeParse({ levelIds: [id, id] }).success).toBe(false);
  });
});
