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
      <div className="preview-empty">
        <span aria-hidden="true">◇</span>
        <div>
          <strong>Preview waiting</strong>
          <p>Enter valid details and select at least one live cell to begin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="playtest-preview">
      <div className="preview-toolbar">
        <dl className="preview-stats" aria-label="Preview progress">
          <div>
            <dt>Clicks left</dt>
            <dd>{clicksRemaining(grid)}</dd>
          </div>
          <div>
            <dt>Squares left</dt>
            <dd>{grid.unvisitedCount}</dd>
          </div>
        </dl>
        <div className="admin-actions">
          <button type="button" onClick={() => setGrid(stepGeneration(grid))}>
            <span aria-hidden="true">▶</span>
            Step once
          </button>
          <button
            className="button-secondary"
            type="button"
            onClick={() => setGrid(createGridFromLevel(level))}
          >
            <span aria-hidden="true">↻</span>
            Reset
          </button>
        </div>
      </div>
      <div
        className="preview-board"
        style={{ aspectRatio: `${grid.width} / ${grid.height}` }}
      >
        <GameBoard
          grid={grid}
          onCellClick={(x, y) => setGrid(applyCellClick(grid, x, y))}
        />
      </div>
      <p className="preview-note">
        <span className="pulse-dot" aria-hidden="true" />
        Manual preview—use “Step once” to advance a generation.
      </p>
    </div>
  );
}
