import { useMemo, useState } from 'react';
import type { AppState, AssessmentProvider, QuizResult, Topic } from '../../core';
import { AnthropicAssessmentProvider, COMPETENCIES, COMPETENCY_LABELS, PASS } from '../../core';
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

type Phase = 'idle' | 'loading' | 'answering' | 'grading' | 'graded' | 'error';

function styleFor(t: Topic): 'technical' | 'behavioral' {
  return t.competency === 'beh' ? 'behavioral' : 'technical';
}

const btn =
  'rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60';

export default function SkillQuiz({ state, dispatch, provider, apiKeyStore, llmConfigStore }: Props) {
  const keyStore = useMemo(() => apiKeyStore ?? createApiKeyStore(), [apiKeyStore]);
  const configStore = useMemo(() => llmConfigStore ?? createLlmConfigStore(), [llmConfigStore]);
  const [llmConfig] = useState(() => configStore.get());
  const engine = useMemo(
    () => provider ?? new AnthropicAssessmentProvider(createLlmClient(llmConfig, () => keyStore.get())),
    [provider, llmConfig, keyStore],
  );
  const [hasKey] = useState(() => keyStore.get() !== null);

  const [active, setActive] = useState<Topic | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState('');
  const [errorOp, setErrorOp] = useState<'question' | 'grade'>('question');

  async function startQuiz(topic: Topic) {
    setActive(topic);
    setResult(null);
    setAnswer('');
    setQuestion('');
    setError('');
    setPhase('loading');
    try {
      const q = await engine.generateQuestion({
        competencyLabel: COMPETENCY_LABELS[topic.competency],
        topicLabel: topic.label,
        style: styleFor(topic),
        avoid: topic.asked,
      });
      dispatch({ type: 'recordAsked', topicId: topic.id, question: q });
      setQuestion(q);
      setPhase('answering');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setErrorOp('question');
      setPhase('error');
    }
  }

  async function submit() {
    if (!active || answer.trim() === '') return;
    setError('');
    setPhase('grading');
    try {
      const r = await engine.gradeAnswer({ question, answer, style: styleFor(active) });
      dispatch({ type: 'recordQuiz', topicId: active.id, score: r.score });
      setResult(r);
      setPhase('graded');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setErrorOp('grade');
      setPhase('error');
    }
  }

  function retry() {
    if (errorOp === 'question' && active) void startQuiz(active);
    else void submit();
  }

  const groups = COMPETENCIES.filter((c) => c.id !== 'dsa').map((c) => ({
    ...c,
    topics: state.topics.filter((t) => t.competency === c.id),
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-100">Skill quizzes</h2>
      <p className="text-xs text-slate-500">Grading with {providerModelLabel(llmConfig)}</p>
      {!hasKey && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-300">
          Add your Anthropic API key in Settings to take quizzes.
        </p>
      )}

      {active && phase !== 'idle' && (
        <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-200">{active.label}</h3>
            <button type="button" onClick={() => { setActive(null); setPhase('idle'); }} className="text-xs text-slate-500 hover:text-slate-300">
              Close
            </button>
          </div>

          {phase === 'loading' && <p className="text-sm text-slate-400">Generating a question…</p>}

          {phase === 'error' && (
            <div className="space-y-2">
              <p className="text-sm text-rose-400">{error}</p>
              <button type="button" onClick={retry} className={btn}>Retry</button>
            </div>
          )}

          {(phase === 'answering' || phase === 'grading') && (
            <div className="space-y-3">
              <p className="text-sm text-slate-200">{question}</p>
              <label className="block text-sm text-slate-300">
                Your answer
                <textarea
                  className="mt-1 h-32 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus-visible:border-cyan-400 focus-visible:ring-1 focus-visible:ring-cyan-400/50"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
              </label>
              <button type="button" onClick={submit} disabled={phase === 'grading' || answer.trim() === ''} className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60">
                {phase === 'grading' ? 'Grading…' : 'Submit'}
              </button>
            </div>
          )}

          {phase === 'graded' && result && (
            <div className="space-y-2">
              <p className="text-sm text-slate-400">{question}</p>
              <p className="text-2xl font-semibold tabular-nums text-slate-100">
                {result.score} <span className="text-sm text-slate-400">/ 100</span>
              </p>
              <p className="text-sm font-medium text-cyan-300">{result.verdict}</p>
              <ResultList title="Strengths" items={result.strengths} color="text-emerald-400" />
              <ResultList title="Gaps" items={result.gaps} color="text-rose-400" />
              {result.modelAnswer && (
                <p className="text-xs text-slate-400">
                  <span className="text-slate-500">Model answer: </span>
                  {result.modelAnswer}
                </p>
              )}
              <button type="button" onClick={() => void startQuiz(active)} className={btn}>New quiz</button>
            </div>
          )}
        </div>
      )}

      {groups.map((g) => (
        <section key={g.id} aria-label={g.label} className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <h3 className="text-sm font-medium text-slate-200">{g.label}</h3>
          <ul className="mt-2 divide-y divide-slate-800">
            {g.topics.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2">
                <span className="flex-1 truncate text-sm text-slate-300">{t.label}</span>
                {t.best >= PASS && <span className="text-xs text-emerald-400">passed</span>}
                <span className="w-8 text-right text-sm tabular-nums text-slate-400">{t.best > 0 ? t.best : '—'}</span>
                <button type="button" disabled={!hasKey} onClick={() => void startQuiz(t)} className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60">
                  {t.best > 0 ? 'New quiz' : 'Take quiz'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
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
