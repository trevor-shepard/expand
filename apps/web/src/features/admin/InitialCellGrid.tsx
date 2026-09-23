import type { CellCoordinate } from "@expand/contracts";
import type { KeyboardEvent } from "react";
import { coordinateKey, toggleInitialCell } from "./editor-model";

interface InitialCellGridProps {
  width: number;
  height: number;
  cells: CellCoordinate[];
  onChange: (cells: CellCoordinate[]) => void;
}

export function InitialCellGrid({
  width,
  height,
  cells,
  onChange,
}: InitialCellGridProps) {
  const active = new Set(cells.map(coordinateKey));

  function moveGridFocus(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const offsets: Partial<Record<string, number>> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -width,
      ArrowDown: width,
    };
    const offset = offsets[event.key];
    if (!offset) return;

    const nextIndex = index + offset;
    const staysInRow =
      (event.key !== "ArrowLeft" || index % width !== 0) &&
      (event.key !== "ArrowRight" || index % width !== width - 1);
    if (nextIndex < 0 || nextIndex >= width * height || !staysInRow) return;

    event.preventDefault();
    event.currentTarget
      .closest(".initial-cell-grid")
      ?.querySelectorAll<HTMLButtonElement>(".initial-cell")
      [nextIndex]?.focus();
  }

  return (
    <div
      className="initial-cell-grid"
      style={{ gridTemplateColumns: `repeat(${width}, minmax(1.5rem, 1fr))` }}
      role="grid"
      aria-label={`Initial live cells, ${width} by ${height}`}
    >
      {Array.from({ length: height }, (_, y) => (
        <div className="grid-row" role="row" key={y}>
          {Array.from({ length: width }, (_, x) => {
            const index = y * width + x;
            const selected = active.has(coordinateKey({ x, y }));
            return (
              <div className="grid-cell" role="gridcell" key={`${x}-${y}`}>
                <button
                  type="button"
                  className={`initial-cell${selected ? " selected" : ""}`}
                  aria-label={`Row ${y + 1} column ${x + 1}, ${selected ? "alive" : "empty"}`}
                  aria-pressed={selected}
                  onKeyDown={(event) => moveGridFocus(event, index)}
                  onClick={() => onChange(toggleInitialCell(cells, { x, y }))}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
