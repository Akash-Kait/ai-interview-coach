import { useMemo, useState } from 'react';
import type { ActivityDay, AppState } from '../../core';
import { activity } from '../../core';

const WINDOW = 182; // ~6 months
const EFFORT_COLOR = ['bg-slate-800', 'bg-emerald-900', 'bg-emerald-700', 'bg-emerald-400'];

function activities(count: number): string {
  return count === 1 ? '1 activity' : `${count} activities`;
}

export default function ActivityGraph({ state, now = Date.now() }: { state: AppState; now?: number }) {
  const events = useMemo(
    () => [...state.dsa.entries.map((e) => e.at), ...state.evals.map((e) => e.at)],
    [state],
  );
  const { current, longest, days } = useMemo(() => activity(events, now, WINDOW), [events, now]);
  const [selected, setSelected] = useState<ActivityDay | null>(null);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-100">Activity</h2>

      <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        <p aria-label="Streaks" className="text-sm text-slate-200">
          Current streak: <span className="font-semibold text-emerald-400">{current}</span> days · Longest:{' '}
          <span className="font-semibold text-slate-100">{longest}</span> days
        </p>

        <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto">
          {days.map((d) => (
            <button
              key={d.date}
              type="button"
              onClick={() => setSelected(d)}
              title={`${d.date}: ${activities(d.count)}`}
              aria-label={`${d.date}: ${activities(d.count)}`}
              className={`h-3 w-3 rounded-sm ${EFFORT_COLOR[d.effort]} focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400/60`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{selected ? `${selected.date} — ${activities(selected.count)}` : 'Tap a day for details.'}</span>
          <span className="flex items-center gap-1">
            Less
            {EFFORT_COLOR.map((c) => <span key={c} className={`h-3 w-3 rounded-sm ${c}`} />)}
            More
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-500">Counts DSA problems and design evaluations you log. Keep the streak alive.</p>
    </div>
  );
}
