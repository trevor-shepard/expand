import type { PlayableLevel } from "@expand/contracts";
import { GameBoard } from "./GameBoard";
import { useGameSession } from "./useGameSession";

interface GameScreenProps {
  levels: PlayableLevel[];
  pausedForInstructions: boolean;
}

export function GameScreen({ levels, pausedForInstructions }: GameScreenProps) {
  const session = useGameSession(levels, pausedForInstructions);
  const boardRatio = session.grid.width / session.grid.height;
  const resultTitle = session.overlay === "win" ? "Level complete" : "Pattern faded";

  return (
    <section className="game-screen" aria-labelledby="current-level-title">
      <div className="hud">
        <div className="level-heading">
          <div>
            <p className="level-kicker">
              Level {session.levelIndex + 1}
              <span aria-hidden="true"> / </span>
              <span className="sr-only">of</span> {levels.length}
            </p>
            <h1 id="current-level-title">{session.level.title}</h1>
            {session.level.description && <p>{session.level.description}</p>}
          </div>
          <div className="hud-actions">
            <button type="button" className="pill-button button-quiet" onClick={session.resetLevel}>
              <span aria-hidden="true">↻</span>
              Reset
            </button>
            <button
              type="button"
              className="pill-button"
              onClick={session.goToNextLevel}
              disabled={!session.canAdvance}
            >
              Next level
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
        <dl className="hud-stats" aria-label="Current level progress">
          <div>
            <dt>Clicks left</dt>
            <dd>{session.clicksLeft}</dd>
          </div>
          <div>
            <dt>Squares left</dt>
            <dd>{session.squaresLeft}</dd>
          </div>
          <div className="cadence-stat">
            <dt>Evolution</dt>
            <dd><span className="pulse-dot" aria-hidden="true" /> 1 sec</dd>
          </div>
        </dl>
      </div>

      <div
        className="board-wrap"
        style={{
          aspectRatio: `${session.grid.width} / ${session.grid.height}`,
          maxWidth: `min(100%, calc(66dvh * ${boardRatio}))`,
        }}
      >
        <GameBoard
          grid={session.grid}
          onCellClick={session.onCellClick}
          disabled={pausedForInstructions || session.overlay !== null}
        />
        {session.overlay && (
          <div className={`overlay-message ${session.overlay}`} role="status" aria-live="assertive">
            <span aria-hidden="true">{session.overlay === "win" ? "✓" : "×"}</span>
            <strong>{resultTitle}</strong>
            <small>
              {session.overlay === "win"
                ? session.isLastLevel
                  ? "Every level cleared."
                  : "The next puzzle is ready."
                : "Reset and try a new pattern."}
            </small>
          </div>
        )}
      </div>

      {session.isLastLevel && session.overlay === "win" && (
        <p className="completion-note">
          <span aria-hidden="true">✦</span>
          You cleared every published level. Beautiful work.
        </p>
      )}
    </section>
  );
}
