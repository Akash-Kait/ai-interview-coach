import { describe, it, expect } from 'vitest';
import type { AppState, CompanyProfile } from '../domain/types';
import {
  clamp,
  dsaPoints,
  dsaScore,
  competencyScore,
  competencyScores,
  overallScore,
  verdict,
  signalBucket,
  PASS,
  ALL_COMPETENCIES,
  type Bucket,
  type VerdictBand,
} from '../domain/scoring';

const dsa = (difficulty: 'easy' | 'medium' | 'hard') => ({
  id: Math.random().toString(), name: 'p', pattern: 'x', difficulty, result: 'clean' as const, at: 0,
});

function state(partial: Partial<AppState> = {}): AppState {
  return { companyId: 'x', dsa: { targetPoints: 100, entries: [] }, topics: [], evals: [], ...partial };
}

describe('clamp', () => {
  it('clamps to [0,100] by default', () => {
    expect(clamp(-5)).toBe(0);
    expect(clamp(50)).toBe(50);
    expect(clamp(150)).toBe(100);
  });
  it('honors custom bounds', () => {
    expect(clamp(5, 1, 3)).toBe(3);
  });
});

describe('dsaPoints / dsaScore', () => {
  it('sums difficulty points (easy1/medium2/hard3)', () => {
    expect(dsaPoints([dsa('easy'), dsa('medium'), dsa('hard')])).toBe(6);
  });
  it('is 0 with no entries', () => {
    expect(dsaScore({ targetPoints: 100, entries: [] })).toBe(0);
  });
  it('is points/target*100', () => {
    expect(dsaScore({ targetPoints: 10, entries: [dsa('hard'), dsa('hard')] })).toBe(60);
  });
  it('clamps above target to 100', () => {
    expect(dsaScore({ targetPoints: 3, entries: [dsa('hard'), dsa('hard')] })).toBe(100);
  });
  it('guards targetPoints <= 0', () => {
    expect(dsaScore({ targetPoints: 0, entries: [] })).toBe(0);
  });
});

describe('competencyScore — topic-only', () => {
  it('is the mean of topic bests (untried = 0)', () => {
    const s = state({
      topics: [
        { id: 't1', label: 'A', competency: 'be', best: 80, asked: [] },
        { id: 't2', label: 'B', competency: 'be', best: 40, asked: [] },
        { id: 't3', label: 'C', competency: 'be', best: 0, asked: [] },
      ],
    });
    expect(competencyScore(s, 'be')).toBe(40);
  });
  it('is 0 when the competency has no topics', () => {
    expect(competencyScore(state(), 'mlf')).toBe(0);
  });
});

describe('competencyScore — design (topic + eval blend)', () => {
  const topics = [
    { id: 't1', label: 'A', competency: 'sd' as const, best: 60, asked: [] },
    { id: 't2', label: 'B', competency: 'sd' as const, best: 90, asked: [] },
  ];
  it('equals topic mean when there are no evals', () => {
    expect(competencyScore(state({ topics }), 'sd')).toBe(75);
  });
  it('blends 0.6*topics + 0.4*evals when evals exist', () => {
    const s = state({ topics, evals: [{ id: 'e1', competency: 'sd', prompt: 'p', score: 50, at: 0 }] });
    expect(competencyScore(s, 'sd')).toBeCloseTo(65); // 0.6*75 + 0.4*50
  });
  it('ignores evals of a different design competency', () => {
    const s = state({ topics, evals: [{ id: 'e1', competency: 'mlsd', prompt: 'p', score: 0, at: 0 }] });
    expect(competencyScore(s, 'sd')).toBe(75);
  });
});

describe('competencyScore — dsa dispatch', () => {
  it('routes dsa to dsaScore', () => {
    const s = state({ dsa: { targetPoints: 10, entries: [dsa('medium')] } });
    expect(competencyScore(s, 'dsa')).toBe(20); // 2/10*100
  });
});

describe('competencyScores', () => {
  it('returns a score for every competency', () => {
    expect(Object.keys(competencyScores(state())).sort()).toEqual([...ALL_COMPETENCIES].sort());
  });
});

describe('overallScore', () => {
  const company: CompanyProfile = {
    id: 'c', name: 'C', weights: { dsa: 2, mlsd: 0, mlf: 1, beh: 0, sd: 0, be: 0, de: 0 },
  };
  it('is the weight-normalized mean of competency scores', () => {
    const s = state({
      dsa: { targetPoints: 10, entries: [dsa('medium')] }, // dsa score 20, weight 2
      topics: [{ id: 't', label: 'A', competency: 'mlf', best: 100, asked: [] }], // mlf 100, weight 1
    });
    expect(overallScore(s, company)).toBeCloseTo(46.6667, 3); // (20*2 + 100*1)/3
  });
  it('is 0 when total weight is 0', () => {
    const zero: CompanyProfile = { id: 'z', name: 'Z', weights: { dsa: 0, mlsd: 0, mlf: 0, beh: 0, sd: 0, be: 0, de: 0 } };
    expect(overallScore(state(), zero)).toBe(0);
  });
});

const bands: [number, VerdictBand][] = [
  [0, 'Foundations'], [29, 'Foundations'], [30, 'Building'], [54, 'Building'],
  [55, 'Interview-capable'], [74, 'Interview-capable'],
  [75, 'Strong — start applying'], [87, 'Strong — start applying'], [88, 'Ready'], [100, 'Ready'],
];
describe('verdict bands', () => {
  it.each(bands)('%d → %s', (score, label) => {
    expect(verdict(score)).toBe(label);
  });
});

const buckets: [number, Bucket][] = [
  [0, 'gap'], [44, 'gap'], [45, 'push'], [74, 'push'], [75, 'strong'], [100, 'strong'],
];
describe('signalBucket', () => {
  it.each(buckets)('%d → %s', (score, bucket) => {
    expect(signalBucket(score)).toBe(bucket);
  });
  it('PASS is the strong boundary', () => {
    expect(signalBucket(PASS)).toBe('strong');
  });
});
