import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdminLevel } from "@expand/contracts";
import { InitialCellGrid } from "./InitialCellGrid";
import {
  editorStateToInput,
  levelToEditorState,
  resizeEditorGrid,
} from "./editor-model";

afterEach(cleanup);

const adminLevel: AdminLevel = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "mapped-level",
  title: "Mapped level",
  description: null,
  width: 4,
  height: 3,
  clickLimit: 5,
  initialLiveCells: [
    { x: 1, y: 1 },
    { x: 3, y: 2 },
  ],
  status: "draft",
  position: null,
  revision: 2,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  publishedAt: null,
};

describe("level editor mapping", () => {
  it("maps API levels to form strings and validated write input", () => {
    const editor = levelToEditorState(adminLevel);
    expect(editor).toMatchObject({
      width: "4",
      height: "3",
      clickLimit: "5",
      description: "",
    });

    expect(editorStateToInput(editor)).toEqual({
      slug: "mapped-level",
      title: "Mapped level",
      description: null,
      width: 4,
      height: 3,
      clickLimit: 5,
      initialLiveCells: adminLevel.initialLiveCells,
    });
  });

  it("clips initial cells when the grid shrinks", () => {
    const resized = resizeEditorGrid(levelToEditorState(adminLevel), 2, 2);
    expect(resized.initialLiveCells).toEqual([{ x: 1, y: 1 }]);
    expect(resized.width).toBe("2");
    expect(resized.height).toBe("2");
  });
});

describe("InitialCellGrid", () => {
  it("renders each coordinate and toggles cells through clicks", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <InitialCellGrid
        width={3}
        height={2}
        cells={[{ x: 1, y: 0 }]}
        onChange={onChange}
      />,
    );

    expect(screen.getAllByRole("button")).toHaveLength(6);
    expect(
      screen
        .getByRole("button", { name: "Row 1 column 2" })
        .getAttribute("aria-pressed"),
    ).toBe("true");

    await user.click(
      screen.getByRole("button", { name: "Row 2 column 3" }),
    );
    expect(onChange).toHaveBeenCalledWith([
      { x: 1, y: 0 },
      { x: 2, y: 1 },
    ]);
  });
});
