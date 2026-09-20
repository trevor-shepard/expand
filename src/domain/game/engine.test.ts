import { describe, expect, it } from 'vitest';

import type { PlayableLevel } from '../../shared/level-contract';
import {
  advanceGeneration,
  applyPlayerClick,
  clicksRemaining,
  countLivingNeighbors,
  createGameState,
  getNextLevelIndex,
} from './engine';

function level(
  initialLiveCells: PlayableLevel['initialLiveCells'],
  overrides: Partial<PlayableLevel> = {},
): PlayableLevel {
  return {
    id: '00000000-0000-4000-8000-000000000099',
    slug: 'test-level',
    title: 'Test level',
    description: null,
    width: 5,
    height: 5,
    clickLimit: 5,
    position: 1,
    revision: 1,
    initialLiveCells,
    ...overrides,
  };
}

function livingCoordinates(
  state: ReturnType<typeof createGameState>,
): string[] {
  return state.cells
    .flatMap((row, y) =>
      row.flatMap((cell, x) => (cell.alive ? [`${x}:${y}`] : [])),
    )
    .sort();
}

describe('legacy Conway behavior', () => {
  it('marks initial live cells alive and visited', () => {
    const state = createGameState(level([{ x: 2, y: 1 }]));

    expect(state.cells[1][2]).toMatchObject({ alive: true, visited: true });
    expect(state.cells[0][0]).toMatchObject({ alive: false, visited: false });
  });

  it('counts in-bounds neighbors without wrapping', () => {
    const state = createGameState(
      level([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
      ]),
    );

    expect(countLivingNeighbors(state.cells, 0, 0)).toBe(2);
    expect(countLivingNeighbors(state.cells, 4, 4)).toBe(0);
  });

  it('evolves a blinker oscillator', () => {
    const state = createGameState(
      level([
        { x: 2, y: 1 },
        { x: 2, y: 2 },
        { x: 2, y: 3 },
      ]),
    );

    const horizontal = advanceGeneration(state);
    const vertical = advanceGeneration(horizontal);

    expect(livingCoordinates(horizontal)).toEqual(['1:2', '2:2', '3:2']);
    expect(livingCoordinates(vertical)).toEqual(['2:1', '2:2', '2:3']);
  });

  it('applies underpopulation, overpopulation, survival, and birth rules', () => {
    const state = createGameState(
      level([
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
        { x: 2, y: 2 },
      ]),
    );

    const next = advanceGeneration(state);

    expect(next.cells[1][1].alive).toBe(true);
    expect(next.cells[1][2].alive).toBe(true);
    expect(next.cells[0][2].alive).toBe(true);
    expect(next.cells[2][2].alive).toBe(true);
    expect(next.cells[1][3].alive).toBe(true);
  });

  it('marks generated live cells visited', () => {
    const state = createGameState(
      level([
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 1, y: 2 },
      ]),
    );

    expect(advanceGeneration(state).cells[2][2]).toMatchObject({
      alive: true,
      visited: true,
    });
  });
});

describe('legacy click and terminal behavior', () => {
  it('ignores clicks on unvisited cells', () => {
    const state = createGameState(level([{ x: 1, y: 1 }]));

    expect(applyPlayerClick(state, 0, 0)).toBe(state);
  });

  it('wakes a visited dead cell immediately and spends one click', () => {
    const state = createGameState(level([{ x: 1, y: 1 }]));
    state.cells[1][1] = { alive: false, visited: true, forcedAlive: false };

    const clicked = applyPlayerClick(state, 1, 1);

    expect(clicked.cells[1][1].alive).toBe(true);
    expect(clicked.clicksUsed).toBe(1);
  });

  it('forces a visited live cell through the next generation for free', () => {
    const state = createGameState(level([{ x: 1, y: 1 }]));
    const clicked = applyPlayerClick(state, 1, 1);

    expect(clicked.clicksUsed).toBe(0);
    expect(advanceGeneration(clicked).cells[1][1].alive).toBe(true);
  });

  it('never spends beyond the click limit', () => {
    const state = createGameState(
      level([{ x: 1, y: 1 }], { clickLimit: 1 }),
    );
    state.cells[1][1] = { alive: false, visited: true, forcedAlive: false };
    state.cells[1][2] = { alive: false, visited: true, forcedAlive: false };

    const first = applyPlayerClick(state, 1, 1);
    const blocked = applyPlayerClick(first, 2, 1);

    expect(clicksRemaining(blocked)).toBe(0);
    expect(blocked.cells[1][2].alive).toBe(false);
    expect(blocked.clicksUsed).toBe(1);
  });

  it('gives a win precedence over simultaneous loss conditions', () => {
    const state = createGameState(
      level(
        [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
        ],
        { width: 2, height: 2, clickLimit: 1 },
      ),
    );
    state.clicksUsed = 1;

    expect(advanceGeneration(state).outcome).toBe('won');
  });

  it('stops progression after the final level', () => {
    expect(getNextLevelIndex(0, 2)).toBe(1);
    expect(getNextLevelIndex(1, 2)).toBeNull();
  });
});
