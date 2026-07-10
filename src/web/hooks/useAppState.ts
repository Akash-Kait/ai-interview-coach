import { useEffect, useMemo, useReducer } from 'react';
import type { AppState, DsaEntry, EvalRecord, Goal, Store } from '../../core';
import { createSeedState } from '../../core';
import { createLocalStore } from '../lib/localStore';

export type AppAction =
  | { type: 'replace'; state: AppState }
  | { type: 'reset' }
  | { type: 'setCompany'; companyId: string }
  | { type: 'addDsaEntry'; entry: DsaEntry }
  | { type: 'deleteDsaEntry'; id: string }
  | { type: 'recordAsked'; topicId: string; question: string }
  | { type: 'recordQuiz'; topicId: string; score: number }
  | { type: 'addEval'; record: EvalRecord }
  | { type: 'setGoal'; goal: Goal | undefined }
  | { type: 'recordReadiness'; at: number; value: number };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'replace':
      return action.state;
    case 'reset':
      return createSeedState();
    case 'setCompany':
      return { ...state, companyId: action.companyId };
    case 'addDsaEntry':
      return { ...state, dsa: { ...state.dsa, entries: [action.entry, ...state.dsa.entries] } };
    case 'deleteDsaEntry':
      return { ...state, dsa: { ...state.dsa, entries: state.dsa.entries.filter((e) => e.id !== action.id) } };
    case 'recordAsked':
      return {
        ...state,
        topics: state.topics.map((t) =>
          t.id === action.topicId ? { ...t, asked: [action.question, ...t.asked].slice(0, 6) } : t,
        ),
      };
    case 'recordQuiz':
      return {
        ...state,
        topics: state.topics.map((t) =>
          t.id === action.topicId ? { ...t, best: Math.max(t.best, action.score) } : t,
        ),
      };
    case 'addEval':
      return { ...state, evals: [action.record, ...state.evals] };
    case 'setGoal':
      return { ...state, goal: action.goal };
    case 'recordReadiness': {
      const hist = state.history ?? [];
      const sameDay =
        hist.length > 0 && new Date(hist[hist.length - 1].at).toDateString() === new Date(action.at).toDateString();
      const point = { at: action.at, value: action.value };
      const next = sameDay ? [...hist.slice(0, -1), point] : [...hist, point];
      return { ...state, history: next.slice(-400) };
    }
    default:
      return state;
  }
}

export function useAppState(storeArg?: Store) {
  const store = useMemo(() => storeArg ?? createLocalStore(), [storeArg]);
  const [state, dispatch] = useReducer(
    appReducer,
    undefined,
    () => store.load() ?? createSeedState(),
  );

  useEffect(() => {
    store.save(state);
  }, [store, state]);

  return { state, dispatch };
}
