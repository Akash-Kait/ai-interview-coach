import { useMemo, useState } from 'react';
import type { AppState, AssessmentProvider, EvalRecord, TranscriptResult } from '../../core';
import { AnthropicAssessmentProvider, SEED_DESIGN_PROBLEMS, competencyScore } from '../../core';
import type { AppAction } from '../hooks/useAppState';
import { createApiKeyStore, type ApiKeyStore } from '../lib/apiKey';
import { createLlmConfigStore, providerModelLabel, type LlmConfigStore } from '../lib/llmConfig';
import { createLlmClient } from '../lib/llm';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  provider?: AssessmentProvider;
  apiKeyStore?: ApiKeyStore;
  llmConfigStore?: LlmConfigStore;
}

type Mode = 'mlsd' | 'sd';
type Phase = 'idle' | 'evaluating' | 'done' | 'error';
const MIN_TRANSCRIPT = 200;

const selectField =
  'w-full appearance-none rounded-md border border-slate-700 bg-slate-950 py-2 pl-3 pr-9 text-sm text-slate-100 outline-none rw-chevron focus-visible:border-cyan-400 focus-visible:ring-1 focus-visible:ring-cyan-400/50';

export default function DesignCoach({ state, dispatch, provider, apiKeyStore, llmConfigStore }: Props) {
  const keyStore = useMemo(() => apiKeyStore ?? createApiKeyStore(), [apiKeyStore]);
  const configStore = useMemo(() => llmConfigStore ?? createLlmConfigStore(), [llmConfigStore]);
  const [llmConfig] = useState(() => configStore.get());
  const engine = useMemo(
    () => provider ?? new AnthropicAssessmentProvider(createLlmClient(llmConfig, () => keyStore.get())),
    [provider, llmConfig, keyStore],
  );
  const [hasKey] = useState(() => keyStore.get() !== null);

  const [mode, setMode] = useState<Mode>('sd');
  const [problemId, setProblemId] = useState('');
  const [transcript, setTranscript] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<TranscriptResult | null>(null);
  const [error, setError] = useState('');
  const [rejection, setRejection] = useState('');
  const [copied, setCopied] = useState(false);

  const problems = SEED_DESIGN_PROBLEMS.filter((p) => p.kind === mode);
  const problem = problems.find((p) => p.id === problemId) ?? problems[0];
  const past = state.evals.filter((e) => e.competency === mode);
  const score = Math.round(competencyScore(state, mode));

  function copyPrompt() {
    void navigator.clipboard?.writeText(problem.prompt).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function evaluate() {
    if (transcript.trim().length < MIN_TRANSCRIPT) {
      setRejection(`Paste a fuller transcript (at least ${MIN_TRANSCRIPT} characters) to evaluate.`);
      return;
    }
    setRejection('');
    setError('');
    setResult(null);
    setPhase('evaluating');
    try {
      const r = await engine.evaluateTranscript({ prompt: problem.prompt, transcript, kind: mode });
      const record: EvalRecord = {
        id: crypto.randomUUID(),
        competency: mode,
        prompt: problem.title,
        score: r.score,
        summary: r.summary,
        at: Date.now(),
      };
      dispatch({ type: 'addEval', record });
      setResult(r);
      setPhase('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setPhase('error');
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-100">Design coach</h2>
      <p className="text-xs text-slate-500">Grading with {providerModelLabel(llmConfig)}</p>
      {!hasKey && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-300">
          Add your Anthropic API key in Settings to evaluate transcripts.
        </p>
      )}

      <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        <div className="flex flex-wrap gap-3">
          <label className="text-sm text-slate-300">
            Mode
            <select
              className={`mt-1 ${selectField}`}
              value={mode}
              onChange={(e) => { setMode(e.target.value as Mode); setProblemId(''); setResult(null); setPhase('idle'); }}
            >
              <option value="sd">System design</option>
              <option value="mlsd">ML system design</option>
            </select>
          </label>
          <label className="flex-1 text-sm text-slate-300">
            Problem
            <select className={`mt-1 ${selectField}`} value={problem.id} onChange={(e) => setProblemId(e.target.value)}>
              {problems.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </label>
        </div>
        <button type="button" onClick={copyPrompt} className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60">
          {copied ? 'Copied!' : 'Copy interviewer prompt'}
        </button>
        <p className="text-xs text-slate-500">Run the prompt in another chat, then paste the full transcript below.</p>

        <label className="block text-sm text-slate-300">
          Transcript
          <textarea
            className="mt-1 h-40 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus-visible:border-cyan-400 focus-visible:ring-1 focus-visible:ring-cyan-400/50"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
          />
        </label>
        {rejection && <p className="text-sm text-amber-400">{rejection}</p>}
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <button
          type="button"
          onClick={evaluate}
          disabled={!hasKey || phase === 'evaluating'}
          className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
        >
          {phase === 'evaluating' ? 'Evaluating…' : 'Evaluate'}
        </button>
      </div>

      {phase === 'done' && result && (
        <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-2xl font-semibold tabular-nums text-slate-100">
            {result.score} <span className="text-sm text-slate-400">/ 100</span>
          </p>
          <p className="text-sm text-slate-200">{result.summary}</p>
          <ResultList title="Strengths" items={result.strengths} color="text-emerald-400" />
          <ResultList title="Gaps" items={result.gaps} color="text-rose-400" />
          <ResultList title="Next steps" items={result.focus} color="text-cyan-300" />
        </div>
      )}

      <section aria-label="Past sessions" className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-200">Past sessions</h3>
          <span className="text-xs text-slate-500">{mode.toUpperCase()} score {score}/100</span>
        </div>
        {past.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No evaluations yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-800">
            {past.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-2">
                <span className="flex-1 truncate text-sm text-slate-300">{e.prompt}</span>
                <span className="text-sm tabular-nums text-slate-400">{e.score}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ResultList({ title, items, color }: { title: string; items: string[]; color: string }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-medium text-slate-400">{title}</p>
      <ul className="mt-0.5 space-y-0.5">
        {items.map((it, i) => (
          <li key={i} className={`text-xs ${color}`}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
