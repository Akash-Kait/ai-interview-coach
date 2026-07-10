// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import Dashboard from './Dashboard';
import { createSeedState, SEED_COMPANIES } from '../../core';
import type { AppState } from '../../core';

const company = (id: string) => SEED_COMPANIES.find((c) => c.id === id)!;

function barLabels(): string[] {
  const region = screen.getByRole('region', { name: /competency scores/i });
  return within(region).getAllByRole('listitem').map((li) => li.textContent ?? '');
}

describe('Dashboard', () => {
  it('shows overall %, verdict, and all 7 bars', () => {
    render(<Dashboard state={createSeedState()} company={company('generalist')} />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', expect.stringContaining('Readiness 0 percent'));
    expect(barLabels()).toHaveLength(7);
  });
  it('orders bars by the active company weight (re-weights per company)', () => {
    render(<Dashboard state={createSeedState()} company={company('generalist')} />);
    expect(barLabels()[0]).toMatch(/Data Structures/); // generalist weights dsa highest
  });
  it('re-weights when a different company is used', () => {
    render(<Dashboard state={createSeedState()} company={company('ml-heavy')} />);
    expect(barLabels()[0]).toMatch(/ML/); // ml-heavy weights mlsd/mlf highest
  });
  it('derives signal groups from buckets', () => {
    const s: AppState = {
      ...createSeedState(),
      topics: [{ id: 't', label: 'Caching', competency: 'be', best: 90, asked: [] }],
    };
    render(<Dashboard state={s} company={company('backend-infra')} />);
    const strong = within(screen.getByRole('region', { name: /signals/i })).getByText('Strong').closest('div')!;
    expect(within(strong).getByText('Backend Engineering')).toBeInTheDocument();
  });
});
