import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GridState } from "@expand/game-engine";
import { GameBoard } from "./GameBoard";
import { WelcomeModal } from "./WelcomeModal";

afterEach(cleanup);

describe("WelcomeModal", () => {
  it("labels the dialog, focuses the primary action, and keeps focus inside", async () => {
    const user = userEvent.setup();
    const onPlay = vi.fn();
    render(<WelcomeModal onPlay={onPlay} />);

    const dialog = screen.getByRole("dialog", {
      name: /Make life expand/,
    });
    const playButton = within(dialog).getByRole("button", {
      name: "Start playing",
    });
    const rulesLink = within(dialog).getByRole("link", {
      name: /Meet Conway's Game of Life/,
    });

    expect(document.activeElement).toBe(playButton);
    await user.tab();
    expect(document.activeElement).toBe(rulesLink);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(playButton);

    await user.click(playButton);
    expect(onPlay).toHaveBeenCalledOnce();
  });
});

describe("GameBoard", () => {
  it("exposes rows and descriptive cell controls", async () => {
    const user = userEvent.setup();
    const onCellClick = vi.fn();
    const grid: GridState = {
      width: 2,
      height: 2,
      clickLimit: 2,
      clickCount: 0,
      unvisitedCount: 3,
      cells: [
        [
          { alive: true, visited: true, pendingForceAlive: false },
          { alive: false, visited: false, pendingForceAlive: false },
        ],
        [
          { alive: false, visited: false, pendingForceAlive: false },
          { alive: false, visited: false, pendingForceAlive: false },
        ],
      ],
    };

    render(<GameBoard grid={grid} onCellClick={onCellClick} />);

    expect(screen.getAllByRole("row")).toHaveLength(2);
    const liveCell = screen.getByRole("button", {
      name: "Row 1 column 1, alive, visited",
    });
    expect(
      screen
        .getByRole("button", {
          name: "Row 1 column 2, dead, unvisited",
        })
        .hasAttribute("disabled"),
    ).toBe(true);

    await user.click(liveCell);
    expect(onCellClick).toHaveBeenCalledWith(0, 0);
  });

  it("uses arrow keys and one tab stop to navigate visited cells", async () => {
    const user = userEvent.setup();
    const grid: GridState = {
      width: 3,
      height: 1,
      clickLimit: 2,
      clickCount: 0,
      unvisitedCount: 1,
      cells: [[
        { alive: true, visited: true, pendingForceAlive: false },
        { alive: false, visited: false, pendingForceAlive: false },
        { alive: false, visited: true, pendingForceAlive: false },
      ]],
    };

    render(<GameBoard grid={grid} onCellClick={vi.fn()} />);
    const first = screen.getByRole("button", {
      name: "Row 1 column 1, alive, visited",
    });
    const last = screen.getByRole("button", {
      name: "Row 1 column 3, dead, visited",
    });

    expect(first.tabIndex).toBe(0);
    expect(last.tabIndex).toBe(-1);
    first.focus();
    await user.keyboard("{ArrowRight}");

    expect(document.activeElement).toBe(last);
    expect(first.tabIndex).toBe(-1);
    expect(last.tabIndex).toBe(0);
  });
});
