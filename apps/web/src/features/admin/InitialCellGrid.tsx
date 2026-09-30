import type { CellCoordinate } from "@expand/contracts";
import { useEffect, useState, type KeyboardEvent } from "react";
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
  const cellCount = width * height;
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    setFocusedIndex((current) => Math.min(current, cellCount - 1));
  }, [cellCount]);

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
    event.preventDefault();

    const nextIndex = index + offset;
    const staysInRow =
      (event.key !== "ArrowLeft" || index % width !== 0) &&
      (event.key !== "ArrowRight" || index % width !== width - 1);
    if (nextIndex < 0 || nextIndex >= width * height || !staysInRow) return;

    setFocusedIndex(nextIndex);
    const grid = event.currentTarget.closest(".initial-cell-grid");
    const buttons =
      grid?.querySelectorAll<HTMLButtonElement>(".initial-cell");
    buttons?.[nextIndex]?.focus();
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
                  tabIndex={focusedIndex === index ? 0 : -1}
                  onFocus={() => setFocusedIndex(index)}
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
