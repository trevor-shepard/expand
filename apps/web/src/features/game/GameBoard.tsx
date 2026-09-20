import type { GridState } from "@expand/game-engine";

interface GameBoardProps {
  grid: GridState;
  onCellClick: (x: number, y: number) => void;
  disabled?: boolean;
}

function cellClassName(cell: GridState["cells"][number][number]): string {
  const classes = ["cell"];
  if (cell.visited) classes.push("visited");
  if (cell.alive) classes.push("alive");
  if (!cell.visited) classes.push("unvisited");
  return classes.join(" ");
}

export function GameBoard({ grid, onCellClick, disabled }: GameBoardProps) {
  return (
    <div
      className="board"
      style={{
        gridTemplateColumns: `repeat(${grid.width}, 1fr)`,
        gridTemplateRows: `repeat(${grid.height}, 1fr)`,
      }}
      role="grid"
      aria-label={`Game board ${grid.width} by ${grid.height}`}
    >
      {grid.cells.flatMap((row, y) =>
        row.map((cell, x) => (
          <button
            key={`${x}-${y}`}
            type="button"
            className={cellClassName(cell)}
            disabled={disabled || !cell.visited}
            aria-label={`Row ${y + 1} column ${x + 1}, ${cell.alive ? "alive" : "dead"}, ${cell.visited ? "visited" : "unvisited"}`}
            onClick={() => onCellClick(x, y)}
          />
        )),
      )}
    </div>
  );
}
