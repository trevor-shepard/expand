import { useEffect, useRef, type KeyboardEvent } from "react";

interface WelcomeModalProps {
  onPlay: () => void;
}

export function WelcomeModal({ onPlay }: WelcomeModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    playButtonRef.current?.focus();

    return () => {
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, []);

  function keepFocusInDialog(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab" || !panelRef.current) return;

    const focusable = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="modal-backdrop">
      <div
        ref={panelRef}
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        aria-describedby="welcome-intro"
        onKeyDown={keepFocusInDialog}
      >
        <div className="modal-heading">
          <span className="modal-step">Conway&apos;s Game of Life, reimagined</span>
          <h1 id="welcome-title">Make life <em>expand.</em></h1>
          <p id="welcome-intro">
            Grow your living pattern across every square before your moves run out.
          </p>
        </div>
        <div className="modal-body">
          <div className="directions" aria-label="How to play">
            <div className="direction-row">
              <span className="direction-number">01</span>
              <p><strong>Choose explored cells.</strong> Click a visited square to bring it to life.</p>
            </div>
            <div className="direction-row">
              <span className="direction-number">02</span>
              <p><strong>Watch the pattern evolve.</strong> The board advances once every second.</p>
            </div>
            <div className="direction-row">
              <span className="direction-number">03</span>
              <p><strong>Reach every square.</strong> Expand before you run out of life or clicks.</p>
            </div>
          </div>
          <div className="welcome-visual" aria-hidden="true">
            <div className="mini-board">
              {Array.from({ length: 25 }, (_, index) => (
                <i
                  key={index}
                  className={
                    [6, 7, 11, 12, 13, 17, 18].includes(index)
                      ? "mini-alive"
                      : [2, 8, 10, 14, 16, 22].includes(index)
                        ? "mini-visited"
                        : undefined
                  }
                />
              ))}
            </div>
            <span className="visual-caption">One small pattern. Endless possibilities.</span>
          </div>
        </div>
        <div className="modal-footer">
          <p>
            New to the rules?{" "}
            <a
              href="https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life"
              target="_blank"
              rel="noreferrer"
            >
              Meet Conway&apos;s Game of Life
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
          <button
            ref={playButtonRef}
            type="button"
            className="play-button"
            onClick={onPlay}
          >
            Start playing
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
