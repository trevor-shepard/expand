import type { GridState } from "@expand/game-engine";
import { useEffect, useState, type KeyboardEvent } from "react";

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
  const firstInteractiveIndex = grid.cells
    .flat()
    .findIndex((cell) => !disabled && cell.visited);
  const [focusedIndex, setFocusedIndex] = useState(firstInteractiveIndex);

  function isInteractive(index: number): boolean {
    const x = index % grid.width;
    const y = Math.floor(index / grid.width);
    return !disabled && Boolean(grid.cells[y]?.[x]?.visited);
  }

  useEffect(() => {
    setFocusedIndex((current) =>
      isInteractive(current) ? current : firstInteractiveIndex,
    );
  }, [firstInteractiveIndex, grid, disabled]);

  function moveGridFocus(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const directions: Partial<Record<string, { x: number; y: number }>> = {
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
    };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();

    let x = index % grid.width;
    let y = Math.floor(index / grid.width);
    while (true) {
      x += direction.x;
      y += direction.y;
      if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) return;

      const nextIndex = y * grid.width + x;
      if (isInteractive(nextIndex)) {
        setFocusedIndex(nextIndex);
        const board = event.currentTarget.closest(".board");
        const buttons =
          board?.querySelectorAll<HTMLButtonElement>(".cell");
        buttons?.[nextIndex]?.focus();
        return;
      }
    }
  }

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
      {grid.cells.map((row, y) => (
        <div className="grid-row" role="row" key={y}>
          {row.map((cell, x) => {
            const index = y * grid.width + x;
            return (
              <div className="grid-cell" role="gridcell" key={`${x}-${y}`}>
                <button
                  type="button"
                  className={cellClassName(cell)}
                  disabled={disabled || !cell.visited}
                  aria-label={`Row ${y + 1} column ${x + 1}, ${cell.alive ? "alive" : "dead"}, ${cell.visited ? "visited" : "unvisited"}`}
                  tabIndex={focusedIndex === index ? 0 : -1}
                  onFocus={() => setFocusedIndex(index)}
                  onKeyDown={(event) => moveGridFocus(event, index)}
                  onClick={() => onCellClick(x, y)}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
