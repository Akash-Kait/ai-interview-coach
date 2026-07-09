export type CompetencyId = 'dsa' | 'mlsd' | 'mlf' | 'beh' | 'sd' | 'be' | 'de';

export interface CompanyProfile {
  id: string;
  name: string;
  weights: Record<CompetencyId, number>; // raw; normalized at compute time
}

export interface DsaEntry {
  id: string;
  name: string;
  pattern: string;
  difficulty: 'easy' | 'medium' | 'hard';
  result: 'clean' | 'hint' | 'failed';
  at: number; // epoch ms
}

export interface Topic {
  id: string;
  label: string;
  competency: CompetencyId;
  best: number; // best quiz score 0–100 (0 = never attempted)
  asked: string[]; // recent questions, to avoid repeats (cap ~6)
}

export interface EvalRecord {
  id: string;
  competency: 'mlsd' | 'sd';
  prompt: string;
  score: number; // 0–100
  summary?: string;
  at: number;
}

export interface Goal {
  targetReadiness: number; // e.g. 80 — the overall % to reach
  targetDate: number; // epoch ms; self-set and freely rebaseable
}

export interface AppState {
  companyId: string;
  dsa: { targetPoints: number; entries: DsaEntry[] };
  topics: Topic[];
  evals: EvalRecord[];
  goal?: Goal; // undefined = timeline feature dormant
}

// Assessment engine I/O
export interface QuizResult {
  score: number; // 0–100
  verdict: string; // short phrase
  strengths: string[]; // ≤3
  gaps: string[]; // ≤3
  modelAnswer: string; // 2–3 sentences
}

export interface TranscriptResult {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  focus: string[]; // ≤2 next steps
}

// Derived, never stored — computed from dated events (+ goal)
export interface ActivityDay {
  date: string;
  count: number;
  effort: number; // effort: weighted tier value
}

export interface StreakInfo {
  current: number;
  longest: number;
  days: ActivityDay[];
}

export interface PaceInfo {
  status: 'no-goal' | 'ahead' | 'on-track' | 'behind' | 'done';
  daysLeft: number;
  requiredPerWeek: number; // readiness points/week needed from now
  actualPerWeek: number; // recent observed readiness points/week
  projectedDate: number | null; // when current pace would reach the goal
  neededDailyEffort: number; // encouraging "about this much/day" figure
}
