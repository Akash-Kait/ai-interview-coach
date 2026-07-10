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
  it("'recordAsked' prepends the question and caps at 6", () => {
    const seed = { ...createSeedState(), topics: [{ id: 't', label: 'L', competency: 'be' as const, best: 0, asked: ['a', 'b', 'c', 'd', 'e', 'f'] }] };
    expect(appReducer(seed, { type: 'recordAsked', topicId: 't', question: 'new' }).topics[0].asked).toEqual(['new', 'a', 'b', 'c', 'd', 'e']);
  });
  it("'recordQuiz' raises best to the max", () => {
    const seed = { ...createSeedState(), topics: [{ id: 't', label: 'L', competency: 'be' as const, best: 50, asked: [] }] };
    expect(appReducer(seed, { type: 'recordQuiz', topicId: 't', score: 80 }).topics[0].best).toBe(80);
    expect(appReducer(seed, { type: 'recordQuiz', topicId: 't', score: 30 }).topics[0].best).toBe(50);
  });
  it("'addEval' prepends the record", () => {
    const rec = { id: 'e', competency: 'sd' as const, prompt: 'P', score: 70, summary: 's', at: 0 };
    expect(appReducer(createSeedState(), { type: 'addEval', record: rec }).evals[0]).toBe(rec);
  });
  it("'setGoal' sets and clears the goal", () => {
    const g = { targetReadiness: 80, targetDate: 123 };
    expect(appReducer(createSeedState(), { type: 'setGoal', goal: g }).goal).toEqual(g);
    expect(appReducer({ ...createSeedState(), goal: g }, { type: 'setGoal', goal: undefined }).goal).toBeUndefined();
  });
  it("'recordReadiness' appends, replaces the same-day point, then appends the next day", () => {
    const t = new Date(2026, 0, 1, 9).getTime();
    const a = appReducer(createSeedState(), { type: 'recordReadiness', at: t, value: 10 });
    expect(a.history).toEqual([{ at: t, value: 10 }]);
    const b = appReducer(a, { type: 'recordReadiness', at: t + 3_600_000, value: 12 });
    expect(b.history).toHaveLength(1);
    expect(b.history?.[0].value).toBe(12);
    const c = appReducer(b, { type: 'recordReadiness', at: t + 86_400_000, value: 15 });
    expect(c.history).toHaveLength(2);
  });
});
