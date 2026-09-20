import { describe, expect, it } from 'vitest';

import { legacyLevels } from './legacy-levels';
import { playableLevelSchema } from './level-contract';

describe('playable level contract', () => {
  const validLevel = legacyLevels[0];

  it('accepts every validated legacy fixture', () => {
    expect(legacyLevels).toHaveLength(6);
    legacyLevels.forEach((level) => {
      expect(playableLevelSchema.parse(level)).toEqual(level);
    });
  });

  it.each([
    ['duplicate coordinates', { initialLiveCells: [{ x: 1, y: 0 }, { x: 1, y: 0 }] }],
    ['out-of-bounds coordinates', { initialLiveCells: [{ x: 4, y: 0 }] }],
    ['oversized boards', { width: 51 }],
    ['non-integer dimensions', { height: 4.5 }],
    ['excessive click limits', { clickLimit: 17 }],
    ['unknown fields', { legacyPattern: 'blinker' }],
  ])('rejects %s', (_case, update) => {
    expect(() => playableLevelSchema.parse({ ...validLevel, ...update })).toThrow();
  });
});

describe('legacy seed characterization', () => {
  it('preserves level ordering, dimensions, click limits, and cell counts', () => {
    expect(
      legacyLevels.map(
        ({ position, width, height, clickLimit, initialLiveCells }) => [
          position,
          width,
          height,
          clickLimit,
          initialLiveCells.length,
        ],
      ),
    ).toEqual([
      [1, 4, 4, 5, 3],
      [2, 8, 10, 30, 8],
      [3, 8, 6, 7, 6],
      [4, 12, 12, 25, 5],
      [5, 20, 20, 20, 48],
      [6, 20, 20, 13, 8],
    ]);
  });

  it('preserves exact legacy coordinates for representative patterns', () => {
    expect(legacyLevels[0].initialLiveCells).toEqual([
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ]);
    expect(legacyLevels[3].initialLiveCells).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ]);
    expect(legacyLevels[4].initialLiveCells).toHaveLength(48);
  });
});
