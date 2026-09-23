import { act, cleanup, renderHook } from "@testing-library/react";
import { STARTER_LEVELS } from "@expand/contracts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGameSession } from "./useGameSession";

describe("useGameSession", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("pauses and resumes without resetting level progress", () => {
    const { result, rerender } = renderHook(
      ({ paused }) => useGameSession([STARTER_LEVELS[0]], paused),
      { initialProps: { paused: true } },
    );

    rerender({ paused: false });
    act(() => {
      vi.advanceTimersByTime(1_000);
      result.current.onCellClick(1, 0);
    });
    expect(result.current.clicksLeft).toBe(4);

    rerender({ paused: true });
    const pausedGrid = result.current.grid;
    act(() => {
      vi.advanceTimersByTime(3_000);
    });
    expect(result.current.clicksLeft).toBe(4);
    expect(result.current.grid).toBe(pausedGrid);

    rerender({ paused: false });
    expect(result.current.clicksLeft).toBe(4);
  });
});
