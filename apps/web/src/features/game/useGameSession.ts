import { useCallback, useEffect, useRef, useState } from "react";
import type { PlayableLevel } from "@expand/contracts";
import {
  GENERATION_INTERVAL_MS,
  applyCellClick,
  clicksRemaining,
  createGridFromLevel,
  evaluateTerminalState,
  stepGeneration,
  type GridState,
} from "@expand/game-engine";

export type OverlayMessage = "win" | "lose" | null;

export interface GameSession {
  levelIndex: number;
  level: PlayableLevel;
  grid: GridState;
  overlay: OverlayMessage;
  isLastLevel: boolean;
  canAdvance: boolean;
  clicksLeft: number;
  squaresLeft: number;
  resetLevel: () => void;
  goToNextLevel: () => void;
  onCellClick: (x: number, y: number) => void;
}

export function useGameSession(
  levels: PlayableLevel[],
  paused: boolean,
): GameSession {
  const [levelIndex, setLevelIndex] = useState(0);
  const [grid, setGrid] = useState<GridState>(() => createGridFromLevel(levels[0]));
  const [overlay, setOverlay] = useState<OverlayMessage>(null);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const level = levels[levelIndex];
  const isLastLevel = levelIndex >= levels.length - 1;
  const canAdvance = overlay === "win" && !isLastLevel;

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRunning(false);
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setRunning(true);
    timerRef.current = setInterval(() => {
      setGrid((current) => {
        const next = stepGeneration(current);
        const terminal = evaluateTerminalState(next);
        if (terminal === "won") {
          stopTimer();
          setOverlay("win");
          return next;
        }
        if (terminal === "lost") {
          stopTimer();
          setOverlay("lose");
          return next;
        }
        return next;
      });
    }, GENERATION_INTERVAL_MS);
  }, [stopTimer]);

  const bootLevel = useCallback(
    (index: number) => {
      stopTimer();
      setLevelIndex(index);
      setGrid(createGridFromLevel(levels[index]));
      setOverlay(null);
    },
    [levels, stopTimer],
  );

  const resetLevel = useCallback(() => {
    bootLevel(levelIndex);
  }, [bootLevel, levelIndex]);

  const goToNextLevel = useCallback(() => {
    if (isLastLevel || overlay !== "win") return;
    bootLevel(levelIndex + 1);
  }, [bootLevel, isLastLevel, levelIndex, overlay]);

  const onCellClick = useCallback(
    (x: number, y: number) => {
      if (overlay !== null || paused) return;
      setGrid((current) => applyCellClick(current, x, y));
    },
    [overlay, paused],
  );

  useEffect(() => {
    if (paused) {
      stopTimer();
      return;
    }
    if (overlay === null && !running) {
      startTimer();
    }
  }, [paused, overlay, running, startTimer, stopTimer]);

  useEffect(() => () => stopTimer(), [stopTimer]);

  useEffect(() => {
    bootLevel(0);
  }, [levels, bootLevel]);

  return {
    levelIndex,
    level,
    grid,
    overlay,
    isLastLevel,
    canAdvance,
    clicksLeft: clicksRemaining(grid),
    squaresLeft: grid.unvisitedCount,
    resetLevel,
    goToNextLevel,
    onCellClick,
  };
}
