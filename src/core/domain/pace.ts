import type { Goal, PaceInfo, ReadinessPoint } from './types';

const DAY = 86_400_000;
const WEEK = 7 * DAY;

/**
 * Pure pacing math (SPEC §4). Advisory only — it never produces a "failure"
 * state: with thin history it gives the benefit of the doubt ('on-track'), and
 * "behind" is a path-forward signal, not a red flag. `history` is the ordered
 * (oldest → newest) list of overall-readiness snapshots.
 */
export function pace(goal: Goal | undefined, history: ReadinessPoint[], now: number): PaceInfo {
  if (!goal) {
    return { status: 'no-goal', daysLeft: 0, requiredPerWeek: 0, actualPerWeek: 0, projectedDate: null, neededDailyEffort: 0 };
  }

  const current = history.length ? history[history.length - 1].value : 0;
  const daysLeft = Math.ceil((goal.targetDate - now) / DAY);
  const remaining = goal.targetReadiness - current;

  if (remaining <= 0) {
    return { status: 'done', daysLeft, requiredPerWeek: 0, actualPerWeek: 0, projectedDate: now, neededDailyEffort: 0 };
  }

  const weeksLeft = daysLeft > 0 ? daysLeft / 7 : 0;
  const requiredPerWeek = weeksLeft > 0 ? remaining / weeksLeft : remaining;
  const neededDailyEffort = Math.round((requiredPerWeek / 7) * 10) / 10;

  // Observed pace over the last ~3 weeks.
  const recent = history.filter((p) => p.at >= now - 3 * WEEK);
  let actualPerWeek = 0;
  let hasEstimate = false;
  if (recent.length >= 2) {
    const first = recent[0];
    const last = recent[recent.length - 1];
    const spanWeeks = (last.at - first.at) / WEEK;
    if (spanWeeks >= 0.5) {
      actualPerWeek = Math.max(0, (last.value - first.value) / spanWeeks);
      hasEstimate = true;
    }
  }

  const projectedDate = actualPerWeek > 0 ? now + (remaining / actualPerWeek) * WEEK : null;

  let status: PaceInfo['status'];
  if (!hasEstimate) status = 'on-track'; // not enough data to judge — never shame
  else if (actualPerWeek >= requiredPerWeek * 1.15) status = 'ahead';
  else if (actualPerWeek >= requiredPerWeek * 0.85) status = 'on-track';
  else status = 'behind';

  return {
    status,
    daysLeft,
    requiredPerWeek: Math.round(requiredPerWeek * 10) / 10,
    actualPerWeek: Math.round(actualPerWeek * 10) / 10,
    projectedDate,
    neededDailyEffort,
  };
}
