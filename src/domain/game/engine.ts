import type { PlayableLevel } from '../../shared/level-contract';

export const GENERATION_INTERVAL_MS = 100;

export type GameOutcome = 'playing' | 'won' | 'lost';

export type GameCell = {
  alive: boolean;
  visited: boolean;
  forcedAlive: boolean;
};

export type GameState = {
  level: PlayableLevel;
  cells: GameCell[][];
  clicksUsed: number;
  generation: number;
  outcome: GameOutcome;
};

export function createGameState(level: PlayableLevel): GameState {
  const initialCells = new Set(
    level.initialLiveCells.map(({ x, y }) => coordinateKey(x, y)),
  );

  return {
    level,
    cells: Array.from({ length: level.height }, (_, y) =>
      Array.from({ length: level.width }, (_, x) => {
        const alive = initialCells.has(coordinateKey(x, y));
        return { alive, visited: alive, forcedAlive: false };
      }),
    ),
    clicksUsed: 0,
    generation: 0,
    outcome: 'playing',
  };
}

export function applyPlayerClick(
  state: GameState,
  x: number,
  y: number,
): GameState {
  if (
    state.outcome !== 'playing' ||
    x < 0 ||
    x >= state.level.width ||
    y < 0 ||
    y >= state.level.height
  ) {
    return state;
  }

  const cell = state.cells[y][x];
  if (!cell.visited) {
    return state;
  }

  if (cell.alive) {
    return updateCell(state, x, y, { ...cell, forcedAlive: true });
  }

  if (state.clicksUsed >= state.level.clickLimit) {
    return state;
  }

  return {
    ...updateCell(state, x, y, { ...cell, alive: true }),
    clicksUsed: state.clicksUsed + 1,
  };
}

export function advanceGeneration(state: GameState): GameState {
  if (state.outcome !== 'playing') {
    return state;
  }

  const cells = state.cells.map((row, y) =>
    row.map((cell, x) => {
      const neighbors = countLivingNeighbors(state.cells, x, y);
      const alive =
        cell.forcedAlive ||
        (cell.alive ? neighbors === 2 || neighbors === 3 : neighbors === 3);

      return {
        alive,
        visited: cell.visited || alive,
        forcedAlive: false,
      };
    }),
  );

  const nextState: GameState = {
    ...state,
    cells,
    generation: state.generation + 1,
  };

  return { ...nextState, outcome: resolveOutcome(nextState) };
}

export function countLivingNeighbors(
  cells: ReadonlyArray<ReadonlyArray<GameCell>>,
  x: number,
  y: number,
): number {
  let total = 0;

  for (let yDelta = -1; yDelta <= 1; yDelta += 1) {
    for (let xDelta = -1; xDelta <= 1; xDelta += 1) {
      if (xDelta === 0 && yDelta === 0) {
        continue;
      }
      if (cells[y + yDelta]?.[x + xDelta]?.alive) {
        total += 1;
      }
    }
  }

  return total;
}

export function countUnvisited(state: GameState): number {
  return state.cells.reduce(
    (total, row) =>
      total + row.reduce((rowTotal, cell) => rowTotal + Number(!cell.visited), 0),
    0,
  );
}

export function clicksRemaining(state: GameState): number {
  return Math.max(0, state.level.clickLimit - state.clicksUsed);
}

export function getNextLevelIndex(
  currentLevelIndex: number,
  levelCount: number,
): number | null {
  const nextLevelIndex = currentLevelIndex + 1;
  return nextLevelIndex < levelCount ? nextLevelIndex : null;
}

function resolveOutcome(state: GameState): GameOutcome {
  if (countUnvisited(state) === 0) {
    return 'won';
  }

  if (
    state.clicksUsed >= state.level.clickLimit ||
    !state.cells.some((row) => row.some((cell) => cell.alive))
  ) {
    return 'lost';
  }

  return 'playing';
}

function updateCell(
  state: GameState,
  x: number,
  y: number,
  cell: GameCell,
): GameState {
  return {
    ...state,
    cells: state.cells.map((row, rowIndex) =>
      rowIndex === y
        ? row.map((currentCell, columnIndex) =>
            columnIndex === x ? cell : currentCell,
          )
        : row,
    ),
  };
}

function coordinateKey(x: number, y: number): string {
  return `${x}:${y}`;
}
