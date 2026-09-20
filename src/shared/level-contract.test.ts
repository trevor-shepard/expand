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

  it('preserves every legacy coordinate in source order', () => {
    expect(
      legacyLevels.map((level) =>
        level.initialLiveCells.map(({ x, y }) => `${x},${y}`).join('|'),
      ),
    ).toEqual([
      '1,0|1,1|1,2',
      '0,0|0,1|1,0|1,1|2,2|2,3|3,2|3,3',
      '0,2|1,2|2,2|1,1|2,1|3,1',
      '0,0|1,1|2,1|0,2|1,2',
      '3,1|4,1|5,1|9,1|10,1|11,1|3,6|4,6|5,6|9,6|10,6|11,6|3,8|4,8|5,8|9,8|10,8|11,8|3,13|4,13|5,13|9,13|10,13|11,13|1,3|1,4|1,5|6,3|6,4|6,5|8,3|8,4|8,5|13,3|13,4|13,5|1,9|1,10|1,11|6,9|6,10|6,11|8,9|8,10|8,11|13,9|13,10|13,11',
      '0,0|0,1|1,0|1,1|2,2|2,3|3,2|3,3',
    ]);
  });
});
