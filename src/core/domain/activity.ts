import type { ActivityDay, StreakInfo } from './types';

const DAY_MS = 86_400_000;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Fold event timestamps into per-day activity + current/longest streaks. Pure.
 * `effort` is the tier (floor 1 / normal 2 / strong 3+); a day counts for a
 * streak when effort >= 1. Current streak allows a grace day: today may be
 * empty as long as yesterday was active.
 */
export function activity(events: number[], now: number, windowDays = 365): StreakInfo {
  const counts = new Map<string, number>();
  for (const ts of events) {
    const key = dayKey(ts);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const days: ActivityDay[] = [];
  for (let i = windowDays - 1; i >= 0; i--) {
    const key = dayKey(now - i * DAY_MS);
    const count = counts.get(key) ?? 0;
    days.push({ date: key, count, effort: count === 0 ? 0 : Math.min(count, 3) });
  }

  let longest = 0;
  let run = 0;
  for (const d of days) {
    if (d.effort >= 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }

  const active = (key: string) => (counts.get(key) ?? 0) >= 1;
  let current = 0;
  const start = active(dayKey(now)) ? 0 : 1; // grace: today may be empty if yesterday was active
  for (let i = start; i < windowDays; i++) {
    if (active(dayKey(now - i * DAY_MS))) current += 1;
    else break;
  }

  return { current, longest, days };
}
