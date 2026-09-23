import { describe, expect, it, vi } from "vitest";
import type { LevelRow } from "../db/schema.js";
import { PostgresLevelRepository } from "./postgres-level-repository.js";

const archivedRow: LevelRow = {
  id: "00000000-0000-4000-8000-000000000099",
  slug: "archived-level",
  title: "Archived level",
  description: null,
  width: 4,
  height: 4,
  clickLimit: 4,
  initialLiveCells: [{ x: 1, y: 1 }],
  status: "archived",
  position: null,
  revision: 3,
  createdBy: "admin",
  updatedBy: "admin",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  publishedAt: null,
};

describe("PostgresLevelRepository lifecycle", () => {
  it("does not restore an archived level when asked to unpublish it", async () => {
    const execute = vi.fn();
    const update = vi.fn();
    const transaction = vi.fn(async (
      callback: (transaction: object) => Promise<unknown>,
    ) => callback({
      execute,
      select: () => ({
        from: () => ({
          where: () => ({
            for: () => [archivedRow],
          }),
        }),
      }),
      update,
    }));
    const repository = PostgresLevelRepository.fromDatabase({
      transaction,
    } as never);

    const result = await repository.unpublish(archivedRow.id, "admin");

    expect(result.status).toBe("archived");
    expect(result.revision).toBe(archivedRow.revision);
    expect(execute).toHaveBeenCalledOnce();
    expect(update).not.toHaveBeenCalled();
  });
});
