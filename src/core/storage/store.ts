import type { AppState } from '../domain/types';

/**
 * Persistence port. v1's adapter is localStorage (web/lib/localStore.ts);
 * later surfaces (file, MCP) implement the same shape.
 * load() returns null when nothing is persisted (or the data is unreadable).
 * The API key is NOT part of AppState and is never handled here.
 */
export interface Store {
  load(): AppState | null;
  save(state: AppState): void;
  clear(): void;
}
