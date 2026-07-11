import { useState } from 'react';
import type { AppState, DsaEntry } from '../../core';
import { DSA_PATTERNS, dsaScore, dsaStats } from '../../core';
import type { AppAction } from '../hooks/useAppState';

const DIFFICULTIES: DsaEntry['difficulty'][] = ['easy', 'medium', 'hard'];
const RESULTS: DsaEntry['result'][] = ['clean', 'hint', 'failed'];

const panel = 'space-y-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4';
const field =
  'w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus-visible:border-cyan-400 focus-visible:ring-1 focus-visible:ring-cyan-400/50';
const selectField =
  'w-full appearance-none rounded-md border border-slate-700 bg-slate-950 py-2 pl-3 pr-9 text-sm text-slate-100 outline-none rw-chevron focus-visible:border-cyan-400 focus-visible:ring-1 focus-visible:ring-cyan-400/50';
const RESULT_COLOR: Record<DsaEntry['result'], string> = {
  clean: 'text-emerald-400',
  hint: 'text-amber-400',
  failed: 'text-rose-400',
};

export default function DsaLog({ state, dispatch }: { state: AppState; dispatch: React.Dispatch<AppAction> }) {
  const [name, setName] = useState('');
  const [pattern, setPattern] = useState(DSA_PATTERNS[0]);
  const [difficulty, setDifficulty] = useState<DsaEntry['difficulty']>('medium');
  const [result, setResult] = useState<DsaEntry['result']>('clean');

  const stats = dsaStats(state.dsa.entries);
  const score = Math.round(dsaScore(state.dsa));
  const canAdd = name.trim() !== '' && pattern.trim() !== '';

  function add() {
    if (!canAdd) return;
    const entry: DsaEntry = {
      id: crypto.randomUUID(),
      name: name.trim(),
      pattern: pattern.trim(),
      difficulty,
      result,
      at: Date.now(),
    };
    dispatch({ type: 'addDsaEntry', entry });
    setName('');
    setPattern(DSA_PATTERNS[0]);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-100">DSA log</h2>

      <div className={panel}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm text-slate-300">
            Problem name
            <input className={`mt-1 ${field}`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Two Sum" />
          </label>
          <label className="block text-sm text-slate-300">
            Pattern
            <select className={`mt-1 ${selectField}`} value={pattern} onChange={(e) => setPattern(e.target.value)}>
              {DSA_PATTERNS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="block text-sm text-slate-300">
            Difficulty
            <select className={`mt-1 ${selectField}`} value={difficulty} onChange={(e) => setDifficulty(e.target.value as DsaEntry['difficulty'])}>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label className="block text-sm text-slate-300">
            Result
            <select className={`mt-1 ${selectField}`} value={result} onChange={(e) => setResult(e.target.value as DsaEntry['result'])}>
              {RESULTS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={!canAdd}
          className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
        >
          Add problem
        </button>
      </div>

      <section aria-label="Stats" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Solved" value={String(stats.solved)} />
        <Stat label="Points" value={`${stats.points}/${state.dsa.targetPoints}`} />
        <Stat label="Clean rate" value={`${stats.cleanRate}%`} />
        <Stat label="Weakest pattern" value={stats.weakestPattern ?? '—'} />
      </section>
      <p className="text-xs text-slate-500">DSA competency score: {score}/100 (points toward your target).</p>

      <section aria-label="Logged problems" className={panel}>
        {state.dsa.entries.length === 0 ? (
          <p className="text-sm text-slate-500">No problems logged yet.</p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {state.dsa.entries.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-2">
                <span className="flex-1 truncate text-sm text-slate-200">{e.name}</span>
                <span className="text-xs text-slate-500">{e.pattern}</span>
                <span className="text-xs text-slate-400">{e.difficulty}</span>
                <span className={`text-xs ${RESULT_COLOR[e.result]}`}>{e.result}</span>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'deleteDsaEntry', id: e.id })}
                  aria-label={`Delete ${e.name}`}
                  className="rounded px-2 text-xs text-slate-500 hover:text-rose-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400/60"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
      <div className="truncate text-lg font-semibold tabular-nums text-slate-100" title={value}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
