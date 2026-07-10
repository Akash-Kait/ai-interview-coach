import type {
  AppState,
  CompanyProfile,
  CompetencyId,
  DsaEntry,
  EvalRecord,
  Topic,
} from './types';

/** Quiz/topic pass threshold (SPEC §4). */
export const PASS = 75;

/** DSA difficulty → points (SPEC §4). */
export const DIFFICULTY_POINTS: Record<DsaEntry['difficulty'], number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

/** Runtime list of all seven competencies. */
export const ALL_COMPETENCIES: readonly CompetencyId[] = [
  'dsa', 'mlsd', 'mlf', 'beh', 'sd', 'be', 'de',
];
/** Topic mean blended with eval mean (SPEC §4). */
export const DESIGN_COMPETENCIES: readonly CompetencyId[] = ['mlsd', 'sd'];
/** Scored purely from topic bests (SPEC §4). */
export const TOPIC_ONLY_COMPETENCIES: readonly CompetencyId[] = ['mlf', 'be', 'de', 'beh'];

export type Bucket = 'strong' | 'push' | 'gap';
export type VerdictBand =
  | 'Foundations'
  | 'Building'
  | 'Interview-capable'
  | 'Strong — start applying'
  | 'Ready';

export function clamp(n: number, lo = 0, hi = 100): number {
  return Math.min(hi, Math.max(lo, n));
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

export function dsaPoints(entries: DsaEntry[]): number {
  return entries.reduce((sum, e) => sum + DIFFICULTY_POINTS[e.difficulty], 0);
}

export function dsaScore(dsa: AppState['dsa']): number {
  if (dsa.targetPoints <= 0) return 0;
  return clamp((dsaPoints(dsa.entries) / dsa.targetPoints) * 100);
}

function topicMean(topics: Topic[], competency: CompetencyId): number {
  return mean(topics.filter((t) => t.competency === competency).map((t) => t.best));
}

function evalMean(evals: EvalRecord[], competency: CompetencyId): number {
  return mean(evals.filter((e) => e.competency === competency).map((e) => e.score));
}

export function competencyScore(state: AppState, competency: CompetencyId): number {
  if (competency === 'dsa') return dsaScore(state.dsa);

  const t = topicMean(state.topics, competency);
  if (DESIGN_COMPETENCIES.includes(competency)) {
    const compEvals = state.evals.filter((e) => e.competency === competency);
    return compEvals.length ? 0.6 * t + 0.4 * evalMean(state.evals, competency) : t;
  }
  return t; // topic-only competency
}

export function competencyScores(state: AppState): Record<CompetencyId, number> {
  const out = {} as Record<CompetencyId, number>;
  for (const c of ALL_COMPETENCIES) out[c] = competencyScore(state, c);
  return out;
}

export function overallScore(state: AppState, company: CompanyProfile): number {
  const scores = competencyScores(state);
  let weighted = 0;
  let totalWeight = 0;
  for (const c of ALL_COMPETENCIES) {
    const w = company.weights[c];
    weighted += scores[c] * w;
    totalWeight += w;
  }
  return totalWeight > 0 ? weighted / totalWeight : 0;
}

export function verdict(overall: number): VerdictBand {
  if (overall < 30) return 'Foundations';
  if (overall < 55) return 'Building';
  if (overall < 75) return 'Interview-capable';
  if (overall < 88) return 'Strong — start applying';
  return 'Ready';
}

export function signalBucket(score: number): Bucket {
  if (score >= 75) return 'strong';
  if (score >= 45) return 'push';
  return 'gap';
}

export interface CompetencyBreakdown {
  id: CompetencyId;
  score: number;
  bucket: Bucket;
  weight: number;
}

/** Per-competency score + bucket + company weight, sorted by weight (desc), stable by ALL_COMPETENCIES order. */
export function competencyBreakdown(state: AppState, company: CompanyProfile): CompetencyBreakdown[] {
  const rows = ALL_COMPETENCIES.map((id) => {
    const score = competencyScore(state, id);
    return { id, score, bucket: signalBucket(score), weight: company.weights[id] };
  });
  const order = (id: CompetencyId) => ALL_COMPETENCIES.indexOf(id);
  return rows.sort((a, b) => b.weight - a.weight || order(a.id) - order(b.id));
}
