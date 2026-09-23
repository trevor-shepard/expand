import { useCallback, useEffect, useState } from "react";
import type { PlayableLevel } from "@expand/contracts";
import { fetchPublishedLevels } from "./api/levels";
import { GameScreen } from "./features/game/GameScreen";
import { WelcomeModal } from "./features/game/WelcomeModal";

export function App() {
  const [levels, setLevels] = useState<PlayableLevel[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPublishedLevels();
      setLevels(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load levels");
      setLevels(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>expand</h1>
        {!showInstructions && (
          <button
            type="button"
            className="instructions-button"
            onClick={() => setShowInstructions(true)}
          >
            Instructions
          </button>
        )}
      </header>

      {loading && <p className="status-banner">Loading levels…</p>}
      {error && (
        <div className="status-banner error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => void load()}>Retry</button>
        </div>
      )}

      {levels && levels.length > 0 && (
        <GameScreen levels={levels} pausedForInstructions={showInstructions} />
      )}

      {showInstructions && (
        <WelcomeModal onPlay={() => setShowInstructions(false)} />
      )}
    </div>
  );
}
