import type { CellCoordinate, PlayableLevel } from "@expand/contracts";

export interface CellState {
  alive: boolean;
  visited: boolean;
  /** Player forced-alive on the next generation (legacy `clicked`). */
  pendingForceAlive: boolean;
}

export interface GridState {
  width: number;
  height: number;
  clickLimit: number;
  clickCount: number;
  /** Count of cells not yet visited (legacy `score`). */
  unvisitedCount: number;
  cells: CellState[][];
}

export interface LevelRuntime {
  level: PlayableLevel;
  grid: GridState;
}

export type { CellCoordinate, PlayableLevel };
