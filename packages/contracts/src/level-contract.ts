import { z } from "zod";

export const cellCoordinateSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
});

export type CellCoordinate = z.infer<typeof cellCoordinateSchema>;

const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case")
  .min(3)
  .max(64);

export const playableLevelSchema = z
  .object({
    id: z.string().uuid(),
    slug: slugSchema,
    title: z.string().trim().min(1).max(80),
    description: z.string().trim().max(500).nullable(),
    width: z.number().int().min(2).max(50),
    height: z.number().int().min(2).max(50),
    clickLimit: z.number().int().min(1),
    initialLiveCells: z.array(cellCoordinateSchema).min(1),
    position: z.number().int().positive(),
    revision: z.number().int().positive(),
  })
  .strict()
  .superRefine((level, ctx) => {
    const area = level.width * level.height;
    if (level.clickLimit > area) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "clickLimit cannot exceed board area",
        path: ["clickLimit"],
      });
    }

    const seen = new Set<string>();
    for (const cell of level.initialLiveCells) {
      if (cell.x < 0 || cell.x >= level.width || cell.y < 0 || cell.y >= level.height) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "initial live cell out of bounds",
          path: ["initialLiveCells"],
        });
        return;
      }
      const key = `${cell.x},${cell.y}`;
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "duplicate initial live cell coordinates",
          path: ["initialLiveCells"],
        });
        return;
      }
      seen.add(key);
    }
  });

export type PlayableLevel = z.infer<typeof playableLevelSchema>;

export const levelsListResponseSchema = z.object({
  levels: z.array(playableLevelSchema),
});

export type LevelsListResponse = z.infer<typeof levelsListResponseSchema>;
