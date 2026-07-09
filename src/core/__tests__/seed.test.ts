import { describe, it, expect } from 'vitest';
import {
  COMPETENCIES,
  COMPETENCY_LABELS,
  SEED_TOPICS,
  SEED_COMPANIES,
  DEFAULT_COMPANY_ID,
  DEFAULT_DSA_TARGET,
  createSeedState,
} from '../domain/seed';
import { ALL_COMPETENCIES } from '../domain/scoring';

describe('seed competencies', () => {
  it('labels all 7 competencies', () => {
    expect(Object.keys(COMPETENCY_LABELS).sort()).toEqual([...ALL_COMPETENCIES].sort());
    expect(COMPETENCIES).toHaveLength(7);
  });
});

describe('seed topics', () => {
  it('reference valid, non-dsa competencies and start untried', () => {
    for (const t of SEED_TOPICS) {
      expect(ALL_COMPETENCIES).toContain(t.competency);
      expect(t.competency).not.toBe('dsa');
      expect(t.best).toBe(0);
      expect(t.asked).toEqual([]);
    }
  });
  it('has unique topic ids', () => {
    const ids = SEED_TOPICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('seed companies', () => {
  it('each defines a weight for every competency', () => {
    for (const c of SEED_COMPANIES) {
      expect(Object.keys(c.weights).sort()).toEqual([...ALL_COMPETENCIES].sort());
    }
  });
  it('default company id exists', () => {
    expect(SEED_COMPANIES.map((c) => c.id)).toContain(DEFAULT_COMPANY_ID);
  });
});

describe('createSeedState', () => {
  it('builds a valid fresh AppState', () => {
    const s = createSeedState();
    expect(s.companyId).toBe(DEFAULT_COMPANY_ID);
    expect(s.dsa.targetPoints).toBe(DEFAULT_DSA_TARGET);
    expect(s.dsa.entries).toEqual([]);
    expect(s.topics).toHaveLength(SEED_TOPICS.length);
    expect(s.evals).toEqual([]);
    expect(s.goal).toBeUndefined();
  });
  it('returns an independent copy each call', () => {
    const a = createSeedState();
    const b = createSeedState();
    expect(a.topics).not.toBe(b.topics);
    a.topics[0].best = 99;
    expect(b.topics[0].best).toBe(0);
  });
});
