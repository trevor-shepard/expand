import type { CellCoordinate } from "@expand/contracts";
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

  return (
    <div
      className="initial-cell-grid"
      style={{ gridTemplateColumns: `repeat(${width}, minmax(1.5rem, 1fr))` }}
      role="grid"
      aria-label={`Initial live cells, ${width} by ${height}`}
    >
      {Array.from({ length: width * height }, (_, index) => {
        const x = index % width;
        const y = Math.floor(index / width);
        const selected = active.has(coordinateKey({ x, y }));
        return (
          <button
            key={`${x}-${y}`}
            type="button"
            className={`initial-cell${selected ? " selected" : ""}`}
            aria-label={`Row ${y + 1} column ${x + 1}`}
            aria-pressed={selected}
            onClick={() => onChange(toggleInitialCell(cells, { x, y }))}
          />
        );
      })}
    </div>
  );
}
