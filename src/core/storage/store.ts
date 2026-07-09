import type { AppState } from '../domain/types';

/**
 * Persistence port. v1's adapter is localStorage; later adapters (file, MCP)
 * implement the same shape. Provisional — finalized in build-sequence step 3.
 * The API key is NOT part of AppState and is never handled here.
 */
export interface Store {
  load(): AppState | null;
  save(state: AppState): void;
  clear(): void;
}
