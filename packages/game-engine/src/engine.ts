import type { CellCoordinate, PlayableLevel } from "@expand/contracts";
import type { CellState, GridState, LevelRuntime } from "./types.js";

export const GENERATION_INTERVAL_MS = 1_000;

function emptyCells(width: number, height: number): CellState[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({
      alive: false,
      visited: false,
      pendingForceAlive: false,
    })),
  );
}

function cloneGrid(grid: GridState): GridState {
  return {
    ...grid,
    cells: grid.cells.map((row) => row.map((cell) => ({ ...cell }))),
  };
}

function wakeCell(grid: GridState, x: number, y: number): void {
  const cell = grid.cells[y][x];
  if (!cell.visited) {
    grid.unvisitedCount -= 1;
  }
  cell.alive = true;
  cell.visited = true;
}

function killCell(grid: GridState, x: number, y: number): void {
  grid.cells[y][x].alive = false;
}

function outOfBounds(grid: GridState, x: number, y: number): boolean {
  return x < 0 || x >= grid.width || y < 0 || y >= grid.height;
}

function countNeighbors(grid: GridState, x: number, y: number): number {
  let count = 0;
  for (const yDelta of [-1, 0, 1]) {
    for (const xDelta of [-1, 0, 1]) {
      if (xDelta === 0 && yDelta === 0) continue;
      const nx = x + xDelta;
      const ny = y + yDelta;
      if (outOfBounds(grid, nx, ny)) continue;
      if (grid.cells[ny][nx].alive) count += 1;
    }
  }
  return count;
}

export function createGridFromLevel(level: PlayableLevel): GridState {
  const grid: GridState = {
    width: level.width,
    height: level.height,
    clickLimit: level.clickLimit,
    clickCount: 0,
    unvisitedCount: level.width * level.height,
    cells: emptyCells(level.width, level.height),
  };

  for (const coord of level.initialLiveCells) {
    wakeCell(grid, coord.x, coord.y);
  }

  return grid;
}

export function createLevelRuntime(level: PlayableLevel): LevelRuntime {
  return { level, grid: createGridFromLevel(level) };
}

export function clicksRemaining(grid: GridState): number {
  return grid.clickLimit - grid.clickCount;
}

export function applyCellClick(grid: GridState, x: number, y: number): GridState {
  if (outOfBounds(grid, x, y)) return grid;

  const next = cloneGrid(grid);
  const cell = next.cells[y][x];

  if (!cell.visited) {
    return grid;
  }

  if (cell.alive) {
    cell.pendingForceAlive = true;
    return next;
  }

  wakeCell(next, x, y);
  next.clickCount += 1;
  return next;
}

function makeMirror(grid: GridState): boolean[][] {
  const mirror: boolean[][] = [];

  for (let y = 0; y < grid.height; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < grid.width; x++) {
      const cell = grid.cells[y][x];
      const neighborCount = countNeighbors(grid, x, y);
      const alive = cell.alive;

      if (cell.pendingForceAlive) {
        if (!cell.alive) {
          grid.clickCount += 1;
        }
        row.push(true);
        cell.pendingForceAlive = false;
      } else if (alive && (neighborCount < 2 || neighborCount > 3)) {
        row.push(false);
      } else if (!alive && neighborCount === 3) {
        row.push(true);
      } else {
        row.push(alive);
      }
    }
    mirror.push(row);
  }

  return mirror;
}

function paintMirror(grid: GridState, mirror: boolean[][]): void {
  mirror.forEach((mirrorRow, y) => {
    mirrorRow.forEach((alive, x) => {
      if (alive) {
        wakeCell(grid, x, y);
      } else {
        killCell(grid, x, y);
      }
    });
  });
}

export function stepGeneration(grid: GridState): GridState {
  const next = cloneGrid(grid);
  const mirror = makeMirror(next);
  paintMirror(next, mirror);
  return next;
}

export function isWon(grid: GridState): boolean {
  return grid.unvisitedCount === 0;
}

export function isLost(grid: GridState): boolean {
  if (grid.clickCount === grid.clickLimit) {
    return true;
  }

  for (const row of grid.cells) {
    for (const cell of row) {
      if (cell.alive) return false;
    }
  }
  return true;
}

/** Win is evaluated before loss, matching legacy `game.js` interval order. */
export function evaluateTerminalState(grid: GridState): "won" | "lost" | null {
  if (isWon(grid)) return "won";
  if (isLost(grid)) return "lost";
  return null;
}

export function legacyTupleToCoords(
  tuples: readonly (readonly [number, number])[],
): CellCoordinate[] {
  return tuples.map(([x, y]) => ({ x, y }));
}
