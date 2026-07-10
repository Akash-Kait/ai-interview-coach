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
});
