// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActivityGraph from './ActivityGraph';
import { createSeedState } from '../../core';
import type { AppState } from '../../core';

const DAY = 86_400_000;
const NOW = new Date(2026, 5, 15, 12, 0, 0).getTime();

function dsaOn(offsets: number[]): AppState {
  return {
    ...createSeedState(),
    dsa: {
      targetPoints: 100,
      entries: offsets.map((o, i) => ({
        id: String(i), name: 'n', pattern: 'p', difficulty: 'easy' as const, result: 'clean' as const, at: NOW - o * DAY,
      })),
    },
  };
}

describe('ActivityGraph', () => {
  it('shows current and longest streaks', () => {
    render(<ActivityGraph state={dsaOn([0, 1, 2])} now={NOW} />);
    expect(screen.getByLabelText('Streaks')).toHaveTextContent('Current streak: 3 days · Longest: 3 days');
  });

  it('shows a day readout when a cell is tapped', async () => {
    render(<ActivityGraph state={dsaOn([0, 0, 0])} now={NOW} />); // 3 today
    const cells = screen.getAllByRole('button');
    await userEvent.click(cells[cells.length - 1]); // today is the last cell
    expect(screen.getByText(/3 activit/i)).toBeInTheDocument();
  });
});
