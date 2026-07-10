import type { AppState, Store } from '../../core';

export const STORAGE_KEY = 'runway.state.v1';

/** The subset of the Storage API this adapter needs (injectable for tests). */
type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function isAppState(v: unknown): v is AppState {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Record<string, unknown>;
  return (
    typeof s.companyId === 'string' &&
    typeof s.dsa === 'object' &&
    s.dsa !== null &&
    Array.isArray(s.topics) &&
    Array.isArray(s.evals)
  );
}

export function createLocalStore(storage: KeyValueStore = localStorage): Store {
  return {
    load() {
      try {
        const raw = storage.getItem(STORAGE_KEY);
        if (raw === null) return null;
        const parsed: unknown = JSON.parse(raw);
        return isAppState(parsed) ? parsed : null;
      } catch {
        return null; // unreadable / non-JSON → fall back to seed upstream
      }
    },
    save(state) {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // storage unavailable / quota exceeded — never crash the app on persist
      }
    },
    clear() {
      try {
        storage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    },
  };
}
