import { useCallback, useEffect, useState } from 'react';

import {
  levelsResponseSchema,
  type PlayableLevel,
} from '../shared/level-contract';
import { Game } from './Game';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; levels: PlayableLevel[] }
  | { status: 'error'; message: string };

export function App() {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [requestNumber, setRequestNumber] = useState(0);

  const retry = useCallback(() => {
    setLoadState({ status: 'loading' });
    setRequestNumber((current) => current + 1);
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadLevels() {
      try {
        const response = await fetch('/api/v1/levels', {
          signal: abortController.signal,
          headers: { accept: 'application/json' },
        });
        if (!response.ok) {
          throw new Error(`Levels request failed with ${response.status}`);
        }

        const payload = levelsResponseSchema.parse(await response.json());
        if (payload.levels.length === 0) {
          throw new Error('No playable levels are available');
        }

        setLoadState({ status: 'ready', levels: payload.levels });
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }
        console.error(error);
        setLoadState({
          status: 'error',
          message: 'Levels could not be loaded. Check your connection and retry.',
        });
      }
    }

    void loadLevels();
    return () => abortController.abort();
  }, [requestNumber]);

  if (loadState.status === 'loading') {
    return <LoadingScreen />;
  }

  if (loadState.status === 'error') {
    return (
      <main className="centered-state">
        <p className="eyebrow">Expand</p>
        <h1>We lost the signal.</h1>
        <p>{loadState.message}</p>
        <button className="primary-button" type="button" onClick={retry}>
          Retry
        </button>
      </main>
    );
  }

  return <Game levels={loadState.levels} />;
}

function LoadingScreen() {
  return (
    <main className="centered-state" aria-live="polite">
      <p className="eyebrow">Expand</p>
      <h1>Preparing the grid…</h1>
      <div className="loading-pulse" aria-hidden="true" />
    </main>
  );
}
