import { useEffect, useMemo, useReducer } from 'react';
import type { AppState, Store } from '../../core';
import { createSeedState } from '../../core';
import { createLocalStore } from '../lib/localStore';

export type AppAction =
  | { type: 'replace'; state: AppState }
  | { type: 'reset' }
  | { type: 'setCompany'; companyId: string };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'replace':
      return action.state;
    case 'reset':
      return createSeedState();
    case 'setCompany':
      return { ...state, companyId: action.companyId };
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
