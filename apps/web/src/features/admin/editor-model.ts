import {
  levelInputSchema,
  type AdminLevel,
  type CellCoordinate,
  type LevelInput,
} from "@expand/contracts";

export interface LevelEditorState {
  slug: string;
  title: string;
  description: string;
  width: string;
  height: string;
  clickLimit: string;
  initialLiveCells: CellCoordinate[];
}

export const EMPTY_LEVEL_EDITOR: LevelEditorState = {
  slug: "",
  title: "",
  description: "",
  width: "8",
  height: "8",
  clickLimit: "10",
  initialLiveCells: [{ x: 3, y: 3 }],
};

export function coordinateKey(cell: CellCoordinate): string {
  return `${cell.x}:${cell.y}`;
}

export function levelToEditorState(level: AdminLevel): LevelEditorState {
  return {
    slug: level.slug,
    title: level.title,
    description: level.description ?? "",
    width: String(level.width),
    height: String(level.height),
    clickLimit: String(level.clickLimit),
    initialLiveCells: structuredClone(level.initialLiveCells),
  };
}

export function editorStateToInput(state: LevelEditorState): LevelInput {
  return levelInputSchema.parse({
    slug: state.slug,
    title: state.title,
    description: state.description.trim() || null,
    width: Number(state.width),
    height: Number(state.height),
    clickLimit: Number(state.clickLimit),
    initialLiveCells: state.initialLiveCells,
  });
}

export function resizeEditorGrid(
  state: LevelEditorState,
  width: number,
  height: number,
): LevelEditorState {
  return {
    ...state,
    width: String(width),
    height: String(height),
    initialLiveCells: state.initialLiveCells.filter(
      (cell) => cell.x < width && cell.y < height,
    ),
  };
}

export function toggleInitialCell(
  cells: CellCoordinate[],
  target: CellCoordinate,
): CellCoordinate[] {
  const targetKey = coordinateKey(target);
  const existing = new Set(cells.map(coordinateKey));
  if (existing.has(targetKey)) {
    return cells.filter((cell) => coordinateKey(cell) !== targetKey);
  }
  return [...cells, target].sort((a, b) => a.y - b.y || a.x - b.x);
}
