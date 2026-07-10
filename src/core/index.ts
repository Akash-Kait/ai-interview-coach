// Public core API. Framework-agnostic: no React, DOM, window, fetch, or web imports.
export type {
  CompetencyId,
  CompanyProfile,
  DsaEntry,
  Topic,
  EvalRecord,
  Goal,
  AppState,
  QuizResult,
  TranscriptResult,
  ActivityDay,
  StreakInfo,
  PaceInfo,
} from './domain/types';
export type { LlmClient, AssessmentProvider } from './assessment/provider';
export type { Store } from './storage/store';

export { AnthropicAssessmentProvider } from './assessment/anthropic';

export * from './domain/scoring';
export * from './domain/seed';
export * from './domain/activity';
