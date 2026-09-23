import { describe, expect, it } from "vitest";
import { STARTER_LEVELS } from "@expand/contracts";
import {
  GENERATION_INTERVAL_MS,
  applyCellClick,
  createGridFromLevel,
  createLevelRuntime,
  evaluateTerminalState,
  isLost,
  isWon,
  legacyTupleToCoords,
  stepGeneration,
} from "./engine.js";

describe("game cadence", () => {
  it("advances generations once per second", () => {
    expect(GENERATION_INTERVAL_MS).toBe(1_000);
  });
});

function miniLevel(
  width: number,
  height: number,
  clickLimit: number,
  live: [number, number][],
) {
  return {
    id: "00000000-0000-4000-8000-00000000aaaa",
    slug: "test-level",
    title: "Test",
    description: null,
    width,
    height,
    clickLimit,
    initialLiveCells: legacyTupleToCoords(live),
    position: 1,
    revision: 1,
  };
}

describe("Conway generation", () => {
  it("preserves a still-life block", () => {
    const level = miniLevel(4, 4, 10, [[1, 1], [2, 1], [1, 2], [2, 2]]);
    let grid = createGridFromLevel(level);
    grid = stepGeneration(grid);
    expect(grid.cells[1][1].alive).toBe(true);
    expect(grid.cells[2][1].alive).toBe(true);
    expect(grid.cells[1][2].alive).toBe(true);
    expect(grid.cells[2][2].alive).toBe(true);
  });

  it("oscillates a blinker horizontally then vertically", () => {
    const level = miniLevel(5, 5, 10, [[2, 1], [2, 2], [2, 3]]);
    let grid = createGridFromLevel(level);
    grid = stepGeneration(grid);
    expect([
      grid.cells[2][1].alive,
      grid.cells[2][2].alive,
      grid.cells[2][3].alive,
    ]).toEqual([true, true, true]);
    grid = stepGeneration(grid);
    expect([
      grid.cells[1][2].alive,
      grid.cells[2][2].alive,
      grid.cells[3][2].alive,
    ]).toEqual([true, true, true]);
  });
});

describe("visited / click semantics (legacy characterization)", () => {
  it("marks initial live cells as visited and reduces unvisited count", () => {
    const level = STARTER_LEVELS[0];
    const grid = createGridFromLevel(level);
    expect(grid.unvisitedCount).toBe(level.width * level.height - level.initialLiveCells.length);
    for (const { x, y } of level.initialLiveCells) {
      expect(grid.cells[y][x].visited).toBe(true);
      expect(grid.cells[y][x].alive).toBe(true);
    }
  });

  it("ignores clicks on unvisited cells", () => {
    const level = miniLevel(3, 3, 5, []);
    const grid = createGridFromLevel(level);
    const next = applyCellClick(grid, 0, 0);
    expect(next).toBe(grid);
  });

  it("charges a click when waking a visited dead cell", () => {
    const level = miniLevel(3, 3, 5, [[1, 1]]);
    let grid = createGridFromLevel(level);
    grid = stepGeneration(grid);
    const deadVisited = grid.cells[1][1];
    expect(deadVisited.visited).toBe(true);
    expect(deadVisited.alive).toBe(false);

    const clicked = applyCellClick(grid, 1, 1);
    expect(clicked.clickCount).toBe(1);
    expect(clicked.cells[1][1].alive).toBe(true);
  });

  it("does not charge cascade clicks on visited live cells", () => {
    const level = miniLevel(3, 3, 5, [[1, 1]]);
    const grid = createGridFromLevel(level);
    const clicked = applyCellClick(grid, 1, 1);
    expect(clicked.clickCount).toBe(0);
    expect(clicked.cells[1][1].pendingForceAlive).toBe(true);
    const afterGen = stepGeneration(clicked);
    expect(afterGen.clickCount).toBe(0);
    expect(afterGen.cells[1][1].alive).toBe(true);
  });

  it("newly born live cells become visited", () => {
    const level = miniLevel(5, 5, 10, [[2, 1], [2, 2], [2, 3]]);
    let grid = createGridFromLevel(level);
    grid = stepGeneration(grid);
    const visitedAlive = grid.cells.flat().filter((c) => c.visited && c.alive);
    expect(visitedAlive.length).toBeGreaterThan(1);
  });
});

describe("win, loss, and precedence", () => {
  it("wins when every cell has been visited", () => {
    const level = miniLevel(2, 2, 10, [[0, 0], [1, 0], [0, 1], [1, 1]]);
    const grid = createGridFromLevel(level);
    expect(isWon(grid)).toBe(true);
  });

  it("loses when click budget is exhausted", () => {
    const level = miniLevel(3, 3, 1, [[1, 1]]);
    let grid = createGridFromLevel(level);
    grid = { ...grid, clickCount: 1 };
    expect(isLost(grid)).toBe(true);
  });

  it("loses when no cells remain alive", () => {
    const level = miniLevel(3, 3, 10, []);
    const grid = createGridFromLevel(level);
    expect(isLost(grid)).toBe(true);
  });

  it("resolves simultaneous terminal states as a win", () => {
    const grid = createGridFromLevel(miniLevel(2, 2, 0, [[0, 0], [1, 0], [0, 1], [1, 1]]));
    const terminal = evaluateTerminalState({ ...grid, clickCount: 0 });
    expect(terminal).toBe("won");
  });
});

describe("starter level fixtures", () => {
  it("bootstraps each legacy level without error", () => {
    for (const level of STARTER_LEVELS) {
      const runtime = createLevelRuntime(level);
      expect(runtime.grid.width).toBe(level.width);
      expect(runtime.grid.height).toBe(level.height);
      expect(runtime.grid.clickLimit).toBe(level.clickLimit);
    }
  });
});
