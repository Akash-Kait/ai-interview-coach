// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DsaLog from './DsaLog';
import { createSeedState } from '../../core';
import type { AppState } from '../../core';

function withEntries(): AppState {
  return {
    ...createSeedState(),
    dsa: {
      targetPoints: 100,
      entries: [
        { id: 'a', name: 'Two Sum', pattern: 'Two Pointers', difficulty: 'easy', result: 'clean', at: 0 },
        { id: 'b', name: 'Word Ladder', pattern: 'Graphs', difficulty: 'hard', result: 'failed', at: 0 },
      ],
    },
  };
}

describe('DsaLog', () => {
  it('pattern is a native select of the 17 canonical patterns, default Arrays & Hashing', () => {
    render(<DsaLog state={createSeedState()} dispatch={vi.fn()} />);
    const select = screen.getByLabelText(/pattern/i);
    expect(select.tagName).toBe('SELECT');
    expect(within(select).getAllByRole('option')).toHaveLength(17);
    expect(select).toHaveValue('Arrays & Hashing');
  });

  it('adds an entry via the form', async () => {
    const dispatch = vi.fn();
    render(<DsaLog state={createSeedState()} dispatch={dispatch} />);
    await userEvent.type(screen.getByLabelText(/problem name/i), 'Two Sum');
    await userEvent.selectOptions(screen.getByLabelText(/pattern/i), 'Two Pointers');
    await userEvent.selectOptions(screen.getByLabelText(/difficulty/i), 'medium');
    await userEvent.selectOptions(screen.getByLabelText(/result/i), 'hint');
    await userEvent.click(screen.getByRole('button', { name: /add problem/i }));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'addDsaEntry',
      entry: expect.objectContaining({ name: 'Two Sum', pattern: 'Two Pointers', difficulty: 'medium', result: 'hint' }),
    });
  });

  it('lists entries and deletes one', async () => {
    const dispatch = vi.fn();
    render(<DsaLog state={withEntries()} dispatch={dispatch} />);
    const list = screen.getByRole('region', { name: /logged problems/i });
    expect(within(list).getByText('Two Sum')).toBeInTheDocument();
    await userEvent.click(within(list).getAllByRole('button', { name: /delete/i })[0]);
    expect(dispatch).toHaveBeenCalledWith({ type: 'deleteDsaEntry', id: 'a' });
  });

  it('shows stats including the weakest pattern', () => {
    render(<DsaLog state={withEntries()} dispatch={vi.fn()} />);
    const stats = screen.getByRole('region', { name: /stats/i });
    expect(within(stats).getByText(/Graphs/)).toBeInTheDocument();
  });
});
