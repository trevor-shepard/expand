import {
  type CSSProperties,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  GENERATION_INTERVAL_MS,
  advanceGeneration,
  applyPlayerClick,
  clicksRemaining,
  countUnvisited,
  createGameState,
  getNextLevelIndex,
} from '../domain/game/engine';
import type { PlayableLevel } from '../shared/level-contract';

type GameProps = {
  levels: PlayableLevel[];
  tickInterval?: number;
};

export function Game({
  levels,
  tickInterval = GENERATION_INTERVAL_MS,
}: GameProps) {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [game, setGame] = useState(() => createGameState(levels[0]));
  const [instructionsOpen, setInstructionsOpen] = useState(true);
  const instructionsButtonRef = useRef<HTMLButtonElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);

  const nextLevelIndex = useMemo(
    () => getNextLevelIndex(currentLevelIndex, levels.length),
    [currentLevelIndex, levels.length],
  );

  useEffect(() => {
    if (instructionsOpen || game.outcome !== 'playing') {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setGame((current) => advanceGeneration(current));
    }, tickInterval);

    return () => window.clearInterval(timer);
  }, [game.outcome, instructionsOpen, tickInterval]);

  useEffect(() => {
    if (instructionsOpen) {
      startButtonRef.current?.focus();
    } else {
      instructionsButtonRef.current?.focus();
    }
  }, [instructionsOpen]);

  const closeInstructions = () => {
    setInstructionsOpen(false);
  };

  const reset = () => {
    setGame(createGameState(levels[currentLevelIndex]));
  };

  const goToNextLevel = () => {
    if (game.outcome !== 'won' || nextLevelIndex === null) {
      return;
    }

    setCurrentLevelIndex(nextLevelIndex);
    setGame(createGameState(levels[nextLevelIndex]));
  };

  const unvisited = countUnvisited(game);
  const remainingClicks = clicksRemaining(game);
  const boardStyle = {
    '--grid-width': game.level.width,
    '--grid-height': game.level.height,
    '--board-ratio': `${game.level.width} / ${game.level.height}`,
  } as CSSProperties;

  return (
    <main className="game-shell">
      <header
        className="game-header"
        inert={instructionsOpen ? true : undefined}
      >
        <div>
          <p className="eyebrow">
            Level {currentLevelIndex + 1} of {levels.length}
          </p>
          <h1>expand</h1>
        </div>
        <button
          ref={instructionsButtonRef}
          className="quiet-button"
          type="button"
          onClick={() => setInstructionsOpen(true)}
        >
          How to play
        </button>
      </header>

      <section
        className="level-heading"
        aria-labelledby="level-title"
        inert={instructionsOpen ? true : undefined}
      >
        <div>
          <h2 id="level-title">{game.level.title}</h2>
          <p>{game.level.description}</p>
        </div>
        <p className="generation" aria-label={`Generation ${game.generation}`}>
          Gen {game.generation}
        </p>
      </section>

      <section
        className="stats"
        aria-label="Game status"
        inert={instructionsOpen ? true : undefined}
      >
        <div>
          <span>Clicks left</span>
          <strong>{remainingClicks}</strong>
        </div>
        <div>
          <span>Squares left</span>
          <strong>{unvisited}</strong>
        </div>
      </section>

      <div
        className="board-wrap"
        inert={instructionsOpen ? true : undefined}
      >
        <div
          className="game-board"
          style={boardStyle}
          role="grid"
          aria-label={`${game.level.title} game board`}
        >
          {game.cells.flatMap((row, y) =>
            row.map((cell, x) => {
              const blockedByLimit =
                !cell.alive && game.clicksUsed >= game.level.clickLimit;
              const disabled =
                game.outcome !== 'playing' ||
                !cell.visited ||
                blockedByLimit;
              const state = cell.alive
                ? 'alive'
                : cell.visited
                  ? 'visited'
                  : 'unvisited';

              return (
                <button
                  key={`${x}:${y}`}
                  className={`game-cell game-cell--${state}`}
                  type="button"
                  role="gridcell"
                  aria-label={`Row ${y + 1}, column ${x + 1}: ${state}`}
                  aria-pressed={cell.alive}
                  disabled={disabled}
                  onClick={() =>
                    setGame((current) => applyPlayerClick(current, x, y))
                  }
                />
              );
            }),
          )}
        </div>

        {game.outcome !== 'playing' ? (
          <div className={`outcome outcome--${game.outcome}`} role="status">
            <strong>{game.outcome === 'won' ? 'Expanded!' : 'Try again'}</strong>
            <span>
              {game.outcome === 'won'
                ? 'Every square has been reached.'
                : 'Life ended before the board was explored.'}
            </span>
          </div>
        ) : null}
      </div>

      <div
        className="game-actions"
        inert={instructionsOpen ? true : undefined}
      >
        <button className="secondary-button" type="button" onClick={reset}>
          Reset level
        </button>
        <button
          className="primary-button"
          type="button"
          disabled={game.outcome !== 'won' || nextLevelIndex === null}
          onClick={goToNextLevel}
        >
          {game.outcome === 'won' && nextLevelIndex === null
            ? 'All levels complete'
            : 'Next level'}
        </button>
      </div>

      {instructionsOpen ? (
        <Instructions buttonRef={startButtonRef} onClose={closeInstructions} />
      ) : null}
    </main>
  );
}

function Instructions({
  buttonRef,
  onClose,
}: {
  buttonRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop">
      <section
        className="instructions-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="instructions-title"
      >
        <p className="eyebrow">Conway’s Game of Life</p>
        <h2 id="instructions-title">Welcome to expand</h2>
        <p>
          Grow life into every square. Conway’s rules move the dark cells
          automatically, one generation at a time.
        </p>
        <ul className="legend">
          <li>
            <span className="legend-swatch legend-swatch--alive" />
            Alive and visited
          </li>
          <li>
            <span className="legend-swatch legend-swatch--visited" />
            Visited and ready to wake
          </li>
          <li>
            <span className="legend-swatch legend-swatch--unvisited" />
            Not reached yet
          </li>
        </ul>
        <p className="instruction-note">
          Tap a pink square to wake it and spend a click. Tap a living square
          to keep it alive through the next generation without spending one.
        </p>
        <button
          ref={buttonRef}
          className="primary-button full-width"
          type="button"
          onClick={onClose}
        >
          Start playing
        </button>
      </section>
    </div>
  );
}
