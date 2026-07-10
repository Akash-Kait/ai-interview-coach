import type { AppState } from '../../core';
import { isAppState } from './localStore';

export function exportStateToJson(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export type ImportResult = { ok: true; state: AppState } | { ok: false; error: string };

export function parseImportedState(json: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "That file isn't valid JSON." };
  }
  if (!isAppState(parsed)) {
    return { ok: false, error: "That file isn't a valid Runway progress export." };
  }
  return { ok: true, state: parsed };
}
