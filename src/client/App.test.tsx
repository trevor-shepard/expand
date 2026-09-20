// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { legacyLevels } from '../shared/legacy-levels';
import { App } from './App';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('public level loading', () => {
  it('loads levels from the shared-contract API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ levels: legacyLevels }),
      }),
    );

    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'First Spark' }),
    ).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/levels',
      expect.objectContaining({
        headers: { accept: 'application/json' },
      }),
    );
  });

  it('shows a retry state for invalid API data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ levels: [{ invalid: true }] }),
      }),
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'We lost the signal.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
