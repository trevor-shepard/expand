import { z } from "zod";

export const cellCoordinateSchema = z.object({
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
}).strict();

export type CellCoordinate = z.infer<typeof cellCoordinateSchema>;

export const levelSlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case")
  .min(3)
  .max(64);

const editableLevelFields = {
  slug: levelSlugSchema,
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).nullable(),
  width: z.number().int().min(2).max(50),
  height: z.number().int().min(2).max(50),
  clickLimit: z.number().int().min(1),
  initialLiveCells: z.array(cellCoordinateSchema).min(1),
};

function validateBoard(
  level: {
    width: number;
    height: number;
    clickLimit: number;
    initialLiveCells: CellCoordinate[];
  },
  ctx: z.RefinementCtx,
): void {
  if (level.clickLimit > level.width * level.height) {
    ctx.addIssue({
      code: "custom",
      message: "clickLimit cannot exceed board area",
      path: ["clickLimit"],
    });
  }

  const seen = new Set<string>();
  for (const cell of level.initialLiveCells) {
    if (cell.x >= level.width || cell.y >= level.height) {
      ctx.addIssue({
        code: "custom",
        message: "initial live cell out of bounds",
        path: ["initialLiveCells"],
      });
      continue;
    }

    const key = `${cell.x},${cell.y}`;
    if (seen.has(key)) {
      ctx.addIssue({
        code: "custom",
        message: "duplicate initial live cell coordinates",
        path: ["initialLiveCells"],
      });
    }
    seen.add(key);
  }
}

export const levelInputSchema = z
  .object(editableLevelFields)
  .strict()
  .superRefine(validateBoard);

export type LevelInput = z.infer<typeof levelInputSchema>;

export const playableLevelSchema = z
  .object({
    id: z.string().uuid(),
    ...editableLevelFields,
    position: z.number().int().positive(),
    revision: z.number().int().positive(),
  })
  .strict()
  .superRefine(validateBoard);

export type PlayableLevel = z.infer<typeof playableLevelSchema>;

export const levelsListResponseSchema = z.object({
  levels: z.array(playableLevelSchema),
}).strict();

export type LevelsListResponse = z.infer<typeof levelsListResponseSchema>;

export const levelStatusSchema = z.enum(["draft", "published", "archived"]);
export type LevelStatus = z.infer<typeof levelStatusSchema>;

export const adminLevelSchema = z
  .object({
    id: z.string().uuid(),
    ...editableLevelFields,
    status: levelStatusSchema,
    position: z.number().int().positive().nullable(),
    revision: z.number().int().positive(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    publishedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .strict()
  .superRefine(validateBoard)
  .superRefine((level, ctx) => {
    if (level.status === "published" && level.position === null) {
      ctx.addIssue({
        code: "custom",
        message: "published levels require a position",
        path: ["position"],
      });
    }
    if (level.status !== "published" && level.position !== null) {
      ctx.addIssue({
        code: "custom",
        message: "only published levels may have a position",
        path: ["position"],
      });
    }
  });

export type AdminLevel = z.infer<typeof adminLevelSchema>;

export const adminLevelsResponseSchema = z.object({
  levels: z.array(adminLevelSchema),
}).strict();

export const adminLevelResponseSchema = z.object({
  level: adminLevelSchema,
}).strict();

export const reorderLevelsSchema = z
  .object({
    levelIds: z.array(z.string().uuid()).min(1),
  })
  .strict()
  .superRefine(({ levelIds }, ctx) => {
    if (new Set(levelIds).size !== levelIds.length) {
      ctx.addIssue({
        code: "custom",
        message: "levelIds must be unique",
        path: ["levelIds"],
      });
    }
  });

export type ReorderLevelsInput = z.infer<typeof reorderLevelsSchema>;

export const adminLoginSchema = z.object({
  password: z.string().min(1).max(1_024),
}).strict();

export const adminSessionResponseSchema = z.object({
  authenticated: z.literal(true),
}).strict();

export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    issues: z.array(z.object({
      path: z.array(z.union([z.string(), z.number()])),
      message: z.string(),
    }).strict()).optional(),
  }).strict(),
}).strict();
