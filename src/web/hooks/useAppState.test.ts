import { describe, it, expect } from 'vitest';
import { appReducer } from './useAppState';
import { createSeedState } from '../../core';

describe('appReducer', () => {
  it("'replace' swaps in the given state", () => {
    const seed = createSeedState();
    const next = { ...seed, companyId: 'ml-heavy' };
    expect(appReducer(seed, { type: 'replace', state: next })).toBe(next);
  });
  it("'reset' returns a fresh seed state (new reference)", () => {
    const dirty = { ...createSeedState(), companyId: 'backend-infra' };
    const result = appReducer(dirty, { type: 'reset' });
    expect(result).toEqual(createSeedState());
    expect(result).not.toBe(dirty);
  });
  it("'setCompany' updates companyId only", () => {
    const seed = createSeedState();
    const result = appReducer(seed, { type: 'setCompany', companyId: 'backend-infra' });
    expect(result.companyId).toBe('backend-infra');
    expect(result.topics).toBe(seed.topics); // untouched
  });
  it("'addDsaEntry' prepends the entry", () => {
    const entry = { id: '1', name: 'Two Sum', pattern: 'Hashing', difficulty: 'easy' as const, result: 'clean' as const, at: 0 };
    const result = appReducer(createSeedState(), { type: 'addDsaEntry', entry });
    expect(result.dsa.entries[0]).toBe(entry);
    expect(result.dsa.entries).toHaveLength(1);
  });
  it("'deleteDsaEntry' removes by id", () => {
    const entry = { id: 'x', name: 'A', pattern: 'P', difficulty: 'easy' as const, result: 'clean' as const, at: 0 };
    const seed = { ...createSeedState(), dsa: { targetPoints: 100, entries: [entry] } };
    expect(appReducer(seed, { type: 'deleteDsaEntry', id: 'x' }).dsa.entries).toEqual([]);
  });
});
