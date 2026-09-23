import { z } from 'zod';

export const cellCoordinateSchema = z
  .object({
    x: z.number().int().nonnegative(),
    y: z.number().int().nonnegative(),
  })
  .strict();

export const playableLevelSchema = z
  .object({
    id: z.string().uuid(),
    slug: z
      .string()
      .min(3)
      .max(64)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().trim().min(1).max(80),
    description: z.string().trim().max(500).nullable(),
    width: z.number().int().min(2).max(50),
    height: z.number().int().min(2).max(50),
    clickLimit: z.number().int().positive(),
    initialLiveCells: z.array(cellCoordinateSchema).min(1),
    position: z.number().int().positive(),
    revision: z.number().int().positive(),
  })
  .strict()
  .superRefine((level, context) => {
    if (level.clickLimit > level.width * level.height) {
      context.addIssue({
        code: 'custom',
        path: ['clickLimit'],
        message: 'Click limit cannot exceed the number of cells',
      });
    }

    const coordinates = new Set<string>();
    level.initialLiveCells.forEach((coordinate, index) => {
      if (coordinate.x >= level.width) {
        context.addIssue({
          code: 'custom',
          path: ['initialLiveCells', index, 'x'],
          message: 'Coordinate must be inside the board',
        });
      }
      if (coordinate.y >= level.height) {
        context.addIssue({
          code: 'custom',
          path: ['initialLiveCells', index, 'y'],
          message: 'Coordinate must be inside the board',
        });
      }

      const key = `${coordinate.x}:${coordinate.y}`;
      if (coordinates.has(key)) {
        context.addIssue({
          code: 'custom',
          path: ['initialLiveCells', index],
          message: 'Coordinates must be unique',
        });
      }
      coordinates.add(key);
    });
  });

export const levelsResponseSchema = z
  .object({
    levels: z.array(playableLevelSchema),
  })
  .strict();

export type CellCoordinate = z.infer<typeof cellCoordinateSchema>;
export type PlayableLevel = z.infer<typeof playableLevelSchema>;
export type LevelsResponse = z.infer<typeof levelsResponseSchema>;
