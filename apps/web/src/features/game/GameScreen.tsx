import type { PlayableLevel } from "@expand/contracts";
import { GameBoard } from "./GameBoard";
import { useGameSession } from "./useGameSession";

interface GameScreenProps {
  levels: PlayableLevel[];
  pausedForInstructions: boolean;
}

export function GameScreen({ levels, pausedForInstructions }: GameScreenProps) {
  const session = useGameSession(levels, pausedForInstructions);

  return (
    <section className="game-screen" aria-live="polite">
      <div className="hud">
        <div className="hud-actions">
          <button type="button" className="pill-button" onClick={session.resetLevel}>
            Reset
          </button>
          <button
            type="button"
            className="pill-button"
            onClick={session.goToNextLevel}
            disabled={!session.canAdvance}
          >
            Next
          </button>
        </div>
        <p className="hud-stats">
          Clicks remaining: <strong>{session.clicksLeft}</strong>
          <span className="sep">·</span>
          Squares remaining: <strong>{session.squaresLeft}</strong>
        </p>
        <p className="level-label">
          Level {session.levelIndex + 1} of {levels.length}: {session.level.title}
        </p>
      </div>

      <div className="board-wrap">
        <GameBoard
          grid={session.grid}
          onCellClick={session.onCellClick}
          disabled={pausedForInstructions || session.overlay !== null}
        />
        {session.overlay === "win" && (
          <p className="overlay-message win" role="status">Win</p>
        )}
        {session.overlay === "lose" && (
          <p className="overlay-message lose" role="status">Lose</p>
        )}
      </div>

      {session.isLastLevel && session.overlay === "win" && (
        <p className="completion-note">You cleared every starter level.</p>
      )}
    </section>
  );
}
