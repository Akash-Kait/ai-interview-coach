import type { AppState, CompanyProfile, Goal, PaceInfo, VerdictBand } from '../../core';
import { COMPETENCY_LABELS, competencyBreakdown, overallScore, pace, verdict } from '../../core';
import type { AppAction } from '../hooks/useAppState';
import Gauge from './Gauge';
import Bars from './Bars';
import Signals from './Signals';

const SUBTITLE: Record<VerdictBand, string> = {
  Foundations: 'Building the fundamentals.',
  Building: 'Filling the gaps.',
  'Interview-capable': 'Ready to practice hard.',
  'Strong — start applying': 'Start applying.',
  Ready: 'Cleared for takeoff.',
};

const STATUS: Record<PaceInfo['status'], { text: string; color: string }> = {
  'no-goal': { text: '', color: '' },
  ahead: { text: 'Ahead of pace', color: 'text-emerald-400' },
  'on-track': { text: 'On track', color: 'text-cyan-300' },
  behind: { text: "A bit behind — here's the path", color: 'text-amber-400' },
  done: { text: 'Goal reached', color: 'text-emerald-400' },
};

const DAY = 86_400_000;

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Dashboard({
  state,
  company,
  dispatch,
  now = Date.now(),
}: {
  state: AppState;
  company: CompanyProfile;
  dispatch?: React.Dispatch<AppAction>;
  now?: number;
}) {
  const overall = Math.round(overallScore(state, company));
  const band = verdict(overall);
  const rows = competencyBreakdown(state, company).map((r) => ({ ...r, label: COMPETENCY_LABELS[r.id] }));
  const paceInfo = pace(state.goal, state.history ?? [], now);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center">
        <Gauge value={overall} verdict={band} subtitle={SUBTITLE[band]} />
        <p className="mt-1 text-xs text-slate-500">Weighted for {company.name}</p>
      </div>
      {state.goal && <PacePanel pace={paceInfo} goal={state.goal} dispatch={dispatch} />}
      <Bars items={rows} />
      <Signals items={rows} />
    </div>
  );
}

function PacePanel({ pace, goal, dispatch }: { pace: PaceInfo; goal: Goal; dispatch?: React.Dispatch<AppAction> }) {
  const s = STATUS[pace.status];
  return (
    <section aria-label="Pace" className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-slate-200">
          Goal: {goal.targetReadiness}% by {fmtDate(goal.targetDate)}
        </h3>
        <span className={`text-sm font-medium ${s.color}`}>{s.text}</span>
      </div>
      <p className="text-xs text-slate-400">
        {pace.daysLeft >= 0 ? `${pace.daysLeft} days left` : `${-pace.daysLeft} days past your date`}
        {pace.projectedDate && pace.status !== 'done' ? ` · projected ${fmtDate(pace.projectedDate)}` : ''}
      </p>
      {pace.status === 'behind' && (
        <div className="space-y-2">
          <p className="text-xs text-amber-300">
            Aim for about {pace.neededDailyEffort} readiness points/day to still hit your date — or give yourself more room:
          </p>
          {dispatch && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'setGoal', goal: { ...goal, targetDate: goal.targetDate + 14 * DAY } })}
              className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
            >
              Move date +2 weeks
            </button>
          )}
        </div>
      )}
    </section>
  );
}
