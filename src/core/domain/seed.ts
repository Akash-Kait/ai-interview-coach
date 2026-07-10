import type { AppState, CompanyProfile, CompetencyId, Topic } from './types';

/** Ordered competency list with display labels (single source of truth for labels). */
export const COMPETENCIES: readonly { id: CompetencyId; label: string }[] = [
  { id: 'dsa', label: 'Data Structures & Algorithms' },
  { id: 'mlf', label: 'ML Fundamentals' },
  { id: 'mlsd', label: 'ML System Design' },
  { id: 'sd', label: 'System Design' },
  { id: 'be', label: 'Backend Engineering' },
  { id: 'de', label: 'Data Engineering' },
  { id: 'beh', label: 'Behavioral' },
];

export const COMPETENCY_LABELS: Record<CompetencyId, string> = Object.fromEntries(
  COMPETENCIES.map((c) => [c.id, c.label]),
) as Record<CompetencyId, string>;

const topic = (competency: CompetencyId, id: string, label: string): Topic => ({
  id, label, competency, best: 0, asked: [],
});

// dsa has no quiz topics — its competency score comes from the DSA log (SPEC §4).
export const SEED_TOPICS: Topic[] = [
  topic('mlf', 'mlf-bias-variance', 'Bias–variance tradeoff'),
  topic('mlf', 'mlf-regularization', 'Regularization (L1/L2, dropout)'),
  topic('mlf', 'mlf-gradient-descent', 'Gradient descent & optimizers'),
  topic('mlf', 'mlf-eval-metrics', 'Evaluation metrics (PR/ROC, F1)'),

  topic('mlsd', 'mlsd-recsys', 'Design a recommendation system'),
  topic('mlsd', 'mlsd-feature-store', 'Feature store & train/serve skew'),
  topic('mlsd', 'mlsd-monitoring', 'Model monitoring & drift'),

  topic('sd', 'sd-rate-limiter', 'Design a rate limiter'),
  topic('sd', 'sd-caching', 'Caching & CDN strategy'),
  topic('sd', 'sd-partitioning', 'Data partitioning & replication'),

  topic('be', 'be-caching', 'Caching strategies & invalidation'),
  topic('be', 'be-db-indexing', 'Database indexing & query plans'),
  topic('be', 'be-concurrency', 'Concurrency, locking & idempotency'),

  topic('de', 'de-batch-streaming', 'Batch vs streaming pipelines'),
  topic('de', 'de-modeling', 'Data modeling & warehousing'),
  topic('de', 'de-orchestration', 'Pipeline orchestration & backfills'),

  topic('beh', 'beh-conflict', 'Resolving team conflict (STAR)'),
  topic('beh', 'beh-impact', 'Driving impact / leadership (STAR)'),
  topic('beh', 'beh-failure', 'A failure & what you learned (STAR)'),
];

export const SEED_COMPANIES: CompanyProfile[] = [
  {
    id: 'generalist',
    name: 'Big-Tech Generalist',
    weights: { dsa: 3, sd: 3, be: 2, beh: 2, mlf: 1, mlsd: 1, de: 1 },
  },
  {
    id: 'ml-heavy',
    name: 'ML-Heavy (AI product)',
    weights: { mlf: 3, mlsd: 3, dsa: 2, sd: 2, beh: 1, be: 1, de: 1 },
  },
  {
    id: 'backend-infra',
    name: 'Backend / Infra',
    weights: { be: 3, sd: 3, dsa: 2, de: 2, beh: 2, mlf: 1, mlsd: 1 },
  },
];

export interface DesignProblem {
  id: string;
  kind: 'mlsd' | 'sd';
  title: string;
  prompt: string; // interviewer prompt to run in another chat
}

export const SEED_DESIGN_PROBLEMS: DesignProblem[] = [
  {
    id: 'sd-url',
    kind: 'sd',
    title: 'Design a URL shortener',
    prompt:
      'You are a senior system-design interviewer. Run a 45-minute interview on: "Design a URL shortener (like bit.ly)". Ask clarifying questions first, then push on requirements, API, data model, storage and scaling, and key tradeoffs. Keep me talking — do not hand me the answer.',
  },
  {
    id: 'sd-ratelimiter',
    kind: 'sd',
    title: 'Design a distributed rate limiter',
    prompt:
      'You are a senior system-design interviewer. Run a 45-minute interview on: "Design a distributed rate limiter". Ask clarifying questions, then probe algorithms (token bucket, sliding window), where it lives, consistency across nodes, and failure modes.',
  },
  {
    id: 'sd-chat',
    kind: 'sd',
    title: 'Design a real-time chat system',
    prompt:
      'You are a senior system-design interviewer. Run a 45-minute interview on: "Design a real-time chat/messaging system". Ask clarifying questions, then probe delivery guarantees, fan-out, presence, storage, and scaling.',
  },
  {
    id: 'mlsd-feed',
    kind: 'mlsd',
    title: 'Design a news-feed ranking system',
    prompt:
      'You are a senior ML-system-design interviewer. Run a 45-minute interview on: "Design the ranking system for a social news feed". Ask clarifying questions, then probe problem framing, features, candidate generation vs ranking, training data, metrics, serving, and monitoring.',
  },
  {
    id: 'mlsd-recsys',
    kind: 'mlsd',
    title: 'Design a video recommendation system',
    prompt:
      'You are a senior ML-system-design interviewer. Run a 45-minute interview on: "Design video recommendations for a streaming platform". Ask clarifying questions, then probe objectives, candidate generation, ranking models, cold start, evaluation, and online serving.',
  },
  {
    id: 'mlsd-fraud',
    kind: 'mlsd',
    title: 'Design a fraud-detection system',
    prompt:
      'You are a senior ML-system-design interviewer. Run a 45-minute interview on: "Design a real-time payment fraud-detection system". Ask clarifying questions, then probe labels, features, class imbalance, latency, thresholds, and feedback loops.',
  },
];

export const DEFAULT_COMPANY_ID = 'generalist';
export const DEFAULT_DSA_TARGET = 100;

/** Fresh default AppState (independent copy each call). goal is dormant (undefined). */
export function createSeedState(): AppState {
  return {
    companyId: DEFAULT_COMPANY_ID,
    dsa: { targetPoints: DEFAULT_DSA_TARGET, entries: [] },
    topics: SEED_TOPICS.map((t) => ({ ...t, asked: [...t.asked] })),
    evals: [],
  };
}
