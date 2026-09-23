import { useEffect, useMemo, useState } from "react";
import {
  playableLevelSchema,
  type LevelInput,
  type PlayableLevel,
} from "@expand/contracts";
import {
  applyCellClick,
  clicksRemaining,
  createGridFromLevel,
  stepGeneration,
  type GridState,
} from "@expand/game-engine";
import { GameBoard } from "../game/GameBoard";

interface PlaytestPreviewProps {
  input: LevelInput | null;
}

function makePreviewLevel(input: LevelInput): PlayableLevel {
  return playableLevelSchema.parse({
    id: "00000000-0000-4000-8000-000000000000",
    ...input,
    position: 1,
    revision: 1,
  });
}

export function PlaytestPreview({ input }: PlaytestPreviewProps) {
  const level = useMemo(
    () => (input ? makePreviewLevel(input) : null),
    [input],
  );
  const [grid, setGrid] = useState<GridState | null>(
    level ? createGridFromLevel(level) : null,
  );

  useEffect(() => {
    setGrid(level ? createGridFromLevel(level) : null);
  }, [level]);

  if (!level || !grid) {
    return (
      <p className="admin-hint">
        Enter a valid level with at least one live cell to enable the preview.
      </p>
    );
  }

  return (
    <div className="playtest-preview">
      <div className="admin-actions">
        <button type="button" onClick={() => setGrid(stepGeneration(grid))}>
          Step generation
        </button>
        <button
          type="button"
          onClick={() => setGrid(createGridFromLevel(level))}
        >
          Reset preview
        </button>
      </div>
      <p>
        Clicks remaining: {clicksRemaining(grid)} · Squares remaining:{" "}
        {grid.unvisitedCount}
      </p>
      <div className="preview-board">
        <GameBoard
          grid={grid}
          onCellClick={(x, y) => setGrid(applyCellClick(grid, x, y))}
        />
      </div>
    </div>
  );
}
