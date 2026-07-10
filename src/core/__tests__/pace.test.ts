import { describe, it, expect } from 'vitest';
import { pace } from '../domain/pace';
import type { ReadinessPoint } from '../domain/types';

const DAY = 86_400_000;
const WEEK = 7 * DAY;
const NOW = new Date(2026, 5, 15, 12, 0, 0).getTime();

const hist = (points: [number, number][]): ReadinessPoint[] => points.map(([weeksAgo, value]) => ({ at: NOW - weeksAgo * WEEK, value }));

describe('pace', () => {
  it('no goal → no-goal status', () => {
    expect(pace(undefined, [], NOW).status).toBe('no-goal');
  });

  it('at/above target → done', () => {
    const r = pace({ targetReadiness: 15, targetDate: NOW + 7 * DAY }, hist([[3, 10], [0, 20]]), NOW);
    expect(r.status).toBe('done');
  });

  it('thin history → on-track (never shames)', () => {
    const r = pace({ targetReadiness: 80, targetDate: NOW + 7 * DAY }, hist([[0, 5]]), NOW);
    expect(r.status).toBe('on-track');
    expect(r.projectedDate).toBeNull();
  });

  it('slow pace vs a near deadline → behind, with a projected date', () => {
    const r = pace({ targetReadiness: 80, targetDate: NOW + 7 * DAY }, hist([[3, 10], [0, 15]]), NOW);
    expect(r.status).toBe('behind');
    expect(r.daysLeft).toBe(7);
    expect(r.projectedDate).not.toBeNull();
    expect(r.requiredPerWeek).toBeGreaterThan(r.actualPerWeek);
  });

  it('fast pace vs a loose deadline → ahead', () => {
    const r = pace({ targetReadiness: 25, targetDate: NOW + 28 * DAY }, hist([[3, 10], [0, 20]]), NOW);
    expect(r.status).toBe('ahead');
  });
});
