import { describe, it, expect } from 'vitest';
import { exportStateToJson, parseImportedState } from './exportImport';
import { createSeedState } from '../../core';

describe('export/import', () => {
  it('round-trips a valid state', () => {
    const state = { ...createSeedState(), companyId: 'ml-heavy' };
    const result = parseImportedState(exportStateToJson(state));
    expect(result).toEqual({ ok: true, state });
  });
  it('export never contains an api key field', () => {
    const json = exportStateToJson(createSeedState());
    expect(JSON.parse(json)).not.toHaveProperty('apiKey');
  });
  it('rejects non-JSON', () => {
    expect(parseImportedState('nope{')).toEqual({ ok: false, error: expect.stringContaining('JSON') });
  });
  it('rejects valid JSON of the wrong shape', () => {
    const result = parseImportedState(JSON.stringify({ foo: 1 }));
    expect(result.ok).toBe(false);
  });
});
