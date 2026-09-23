// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { legacyLevels } from '../shared/legacy-levels';
import { Game } from './Game';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('public game lifecycle', () => {
  it('keeps exactly one timer through repeated resets and cleans it up', () => {
    const setIntervalSpy = vi.spyOn(window, 'setInterval');
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
    const view = render(
      <Game levels={[legacyLevels[0]]} tickInterval={100_000} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Start playing' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset level' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset level' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset level' }));

    expect(setIntervalSpy).toHaveBeenCalledTimes(1);

    view.unmount();
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
  });

  it('resets the current generation without adding handlers', () => {
    vi.useFakeTimers();
    render(<Game levels={[legacyLevels[0]]} tickInterval={1_000} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start playing' }));

    act(() => vi.advanceTimersByTime(1_000));
    expect(screen.getByLabelText('Generation 1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reset level' }));
    expect(screen.getByLabelText('Generation 0')).toBeInTheDocument();
  });

  it('has no actionable next button after the final level', () => {
    vi.useFakeTimers();
    const completedOnFirstTick = {
      ...legacyLevels[0],
      width: 2,
      height: 2,
      initialLiveCells: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ],
    };
    render(<Game levels={[completedOnFirstTick]} tickInterval={100} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start playing' }));

    act(() => vi.advanceTimersByTime(100));

    expect(
      screen.getByRole('button', { name: 'All levels complete' }),
    ).toBeDisabled();
  });
});
