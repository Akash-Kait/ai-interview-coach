import { describe, it, expect } from 'vitest';
import { activity } from '../domain/activity';

const DAY = 86_400_000;
const NOW = new Date(2026, 5, 15, 12, 0, 0).getTime(); // local noon, avoids midnight/DST edges
const ago = (days: number) => NOW - days * DAY;

describe('activity', () => {
  it('is empty with no events', () => {
    const r = activity([], NOW, 30);
    expect(r.current).toBe(0);
    expect(r.longest).toBe(0);
    expect(r.days).toHaveLength(30);
    expect(r.days.every((d) => d.effort === 0 && d.count === 0)).toBe(true);
  });

  it('buckets effort into tiers (1 / 2 / 3+) and caps at 3', () => {
    const r = activity([ago(0), ago(0), ago(0), ago(0)], NOW, 7); // 4 events today
    const today = r.days[r.days.length - 1];
    expect(today.count).toBe(4);
    expect(today.effort).toBe(3);
  });

  it('counts consecutive active days ending today', () => {
    expect(activity([ago(0), ago(1), ago(2)], NOW, 30).current).toBe(3);
  });

  it('grace: an empty today with an active yesterday keeps the streak', () => {
    expect(activity([ago(1), ago(2)], NOW, 30).current).toBe(2);
  });

  it('breaks the streak on a gap and reports the longest run', () => {
    const r = activity([ago(0), ago(2), ago(3), ago(4)], NOW, 30);
    expect(r.current).toBe(1); // yesterday (day 1) missing
    expect(r.longest).toBe(3); // days 2,3,4
  });

  it('window length matches windowDays', () => {
    expect(activity([], NOW, 90).days).toHaveLength(90);
  });
});
