import { useCallback, useEffect, useState } from "react";
import type { PlayableLevel } from "@expand/contracts";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { fetchPublishedLevels } from "./api/levels";
import { AdminApp } from "./features/admin/AdminApp";
import { GameScreen } from "./features/game/GameScreen";
import { WelcomeModal } from "./features/game/WelcomeModal";

const isStaticBuild = import.meta.env.VITE_STATIC_LEVELS === "true";

function PublicGame() {
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
        <Link className="public-brand" to="/" aria-label="Expand home">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span>
            <strong>expand</strong>
            <small>Life, one move at a time</small>
          </span>
        </Link>
        {!showInstructions && (
          <button
            type="button"
            className="instructions-button"
            onClick={() => setShowInstructions(true)}
          >
            <span aria-hidden="true">?</span>
            How to play
          </button>
        )}
      </header>

      <main className="public-main">
        {loading && (
          <div className="public-state" role="status">
            <span className="loading-orbit" aria-hidden="true" />
            <p className="state-kicker">Preparing the board</p>
            <h1>Loading levels…</h1>
            <p>Your next puzzle is almost ready.</p>
          </div>
        )}
        {error && (
          <div className="public-state public-state-error" role="alert">
            <span className="state-icon" aria-hidden="true">!</span>
            <p className="state-kicker">Connection interrupted</p>
            <h1>We couldn&apos;t load the levels.</h1>
            <p>{error}</p>
            <button className="public-primary-button" type="button" onClick={() => void load()}>
              Try again
            </button>
          </div>
        )}
        {levels?.length === 0 && (
          <div className="public-state">
            <span className="state-icon" aria-hidden="true">◇</span>
            <p className="state-kicker">Nothing to play yet</p>
            <h1>No levels are published.</h1>
            <p>Check back soon—the next puzzle is taking shape.</p>
          </div>
        )}
        {levels && levels.length > 0 && !loading && !error && (
          <GameScreen levels={levels} pausedForInstructions={showInstructions} />
        )}
      </main>

      {showInstructions && levels && levels.length > 0 && !loading && !error && (
        <WelcomeModal onPlay={() => setShowInstructions(false)} />
      )}
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicGame />} />
      {!isStaticBuild && <Route path="/admin/*" element={<AdminApp />} />}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
