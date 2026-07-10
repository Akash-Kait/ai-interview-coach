# Runway — Interview Readiness Tracker · Design Spec

**Status:** Draft · **Created:** 2026-07-09 · **Updated:** 2026-07-10 (added timeline + activity graph) · **Owner:** Akash
**Stack (assumed):** React + Vite + TypeScript + Tailwind. LLM calls: bring-your-own-key (client-side).

---

## 0 · Summary

**One-liner.** A local-first web app that turns interview prep into a single visible readiness number, earned through AI-graded quizzes and a design-interview evaluator — not self-ticked checkboxes.

**Why now.** The prototype works but is trapped inside the Claude artifact runtime (its LLM calls and storage are platform-specific). Moving to a real repo makes it deployable, testable, and a legitimate GenAI portfolio project.

**Who it's for.** v1 is a single-user tool (me). It must be usable by anyone with a browser and an Anthropic API key, with zero server to run.

**Success looks like.** A deployed static site where a user picks a target company and a readiness goal by a date, logs DSA problems, takes AI-graded skill quizzes, pastes a system-design transcript for evaluation, and watches a weighted readiness gauge move — while a streak heatmap and an encouraging pace status keep them showing up daily, with all progress persisted locally across sessions.

---

## 1 · Scope

### In scope (v1)
1. Readiness dashboard: weighted gauge, per-competency bars, auto-derived strengths / push / gaps.
2. DSA log (manual, no AI): points by difficulty toward a target.
3. Skill quizzes (AI): fresh interview-level question per attempt → open written answer → 0–100 grade with feedback → best-of per topic feeds the score.
4. Design coach (AI): paste a full system-design transcript → 0–100 evaluation with strengths/gaps/next steps.
5. Settings: choose target company (re-weights scoring); set a readiness goal + target date; enter/store the API key locally.
6. Local persistence + import/export of progress as JSON.
7. Timeline & pacing: a self-set readiness goal by a target date, with an adaptive "on track / behind / ahead" status and easy date rebasing (see the design rule in §7).
8. Activity graph & streak: a GitHub-style contribution heatmap of daily activity, shaded by effort, with current + longest streak counters.

### Non-goals (explicitly out of v1 — do not build these)
- **Books / reading + comprehension quizzes.** First thing after v1; reuses the assessment engine. Deferred to keep v1 tight.
- Accounts, auth, cloud sync, multi-device.
- A hosted LLM proxy or any backend. (v1 is static + BYO-key.)
- MCP server or Claude Skill wrappers. (Enabled later by the core module; not built now.)
- Spaced-repetition scheduling, reminders, push notifications. (The activity heatmap and pacing status *are* in scope; reminders/notifications are not — the heatmap motivates without them and avoids OS-permission complexity.)
- More than a small set of seeded companies.
- Mobile-native app. (Responsive web only.)
- Editing the seeded topic/company data through the UI.

> Rule: if a request isn't in "In scope (v1)", it goes to a backlog note — it does not get built in this pass.

---

## 2 · Architecture

**Pattern: ports and adapters (hexagonal).** The value and the reusability both live in a framework-agnostic core. Every surface (this web app, and later an MCP server or a Claude Skill) is a thin adapter over the same core.

**Hard rule:** nothing in `src/core/**` may import React, the DOM, `window`, `fetch` directly, or anything from `src/web/**`. The core talks to the outside world only through two interfaces it defines: `LlmClient` (transport) and `Store` (persistence). This is what keeps "which surface" a wrapper, not a rewrite — and it is the property that makes the scoring logic unit-testable in isolation.

### Repo layout
```
/
  CLAUDE.md
  SPEC.md
  package.json  vite.config.ts  tsconfig.json
  README.md
  src/
    core/                    # framework-agnostic, pure TS, no DOM/network/UI
      domain/
        types.ts             # all shared types
        scoring.ts           # pure competency + overall scoring (heavily tested)
        pace.ts              # pure pacing math: required vs actual, status, projected date (tested)
        activity.ts          # pure aggregation of dated events → per-day activity + streaks (tested)
        seed.ts              # default competencies, topics, company profiles
      assessment/
        provider.ts          # AssessmentProvider + LlmClient interfaces
        anthropic.ts         # AnthropicAssessmentProvider (takes an LlmClient)
        prompts.ts           # question-gen + grading + transcript-eval prompts
      storage/
        store.ts             # Store interface
      index.ts               # public core API
      __tests__/
        scoring.test.ts
    web/                     # React adapter over core
      lib/
        browserLlmClient.ts  # LlmClient impl: fetch → Anthropic, using the user's key
        localStore.ts        # Store impl over localStorage
      components/            # Dashboard, Gauge, Bars, Signals, Timeline, ActivityGraph, DsaLog, SkillQuiz, DesignCoach, Settings
      hooks/                 # useAppState
      App.tsx  main.tsx  index.css
```

### Tech decisions
- **TypeScript everywhere.** The core's types are the contract.
- **Vitest** for unit tests; scoring functions must be covered.
- **Tailwind v4** for styling (via the `@tailwindcss/vite` plugin + CSS `@theme`; no `tailwind.config.js`); keep the existing dark "instrument panel" look (deep slate base, indigo→cyan accent, emerald/amber/rose for strong/push/gap).
- **No state library** in v1; a single `useAppState` hook + reducer over the core state is enough.

---

## 3 · Data model (`core/domain/types.ts`)

```ts
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
  best: number;        // best quiz score 0–100 (0 = never attempted)
  asked: string[];     // recent questions, to avoid repeats (cap ~6)
}

export interface EvalRecord {
  id: string;
  competency: 'mlsd' | 'sd';
  prompt: string;
  score: number;       // 0–100
  summary?: string;
  at: number;
}

export interface Goal {
  targetReadiness: number; // e.g. 80 — the overall % to reach
  targetDate: number;      // epoch ms; self-set and freely rebaseable
}

export interface ReadinessPoint {
  at: number;              // epoch ms
  value: number;           // overall readiness 0–100 at that time
}

export interface AppState {
  companyId: string;
  dsa: { targetPoints: number; entries: DsaEntry[] };
  topics: Topic[];
  evals: EvalRecord[];
  goal?: Goal;             // undefined = timeline feature dormant
  history?: ReadinessPoint[]; // daily overall-readiness snapshots; feeds pacing (§4)
}

// Assessment engine I/O
export interface QuizResult {
  score: number;               // 0–100
  verdict: string;             // short phrase
  strengths: string[];         // ≤3
  gaps: string[];              // ≤3
  modelAnswer: string;         // 2–3 sentences
}
export interface TranscriptResult {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  focus: string[];             // ≤2 next steps
}

// Derived, never stored — computed from dated events (+ goal)
export interface ActivityDay { date: string; count: number; effort: number; } // effort: weighted tier value
export interface StreakInfo { current: number; longest: number; days: ActivityDay[]; }
export interface PaceInfo {
  status: 'no-goal' | 'ahead' | 'on-track' | 'behind' | 'done';
  daysLeft: number;
  requiredPerWeek: number;      // readiness points/week needed from now
  actualPerWeek: number;        // recent observed readiness points/week
  projectedDate: number | null; // when current pace would reach the goal
  neededDailyEffort: number;    // encouraging "about this much/day" figure
}
```

The API key is **not** part of `AppState`. It lives in its own storage entry, is never included in export/import, and is never logged.

---

## 4 · Scoring (`core/domain/scoring.ts`) — pure, deterministic, tested

Constants: `PASS = 75`. Difficulty points: easy 1, medium 2, hard 3.

- **DSA:** `dsaScore = clamp(sum(points) / targetPoints * 100)`.
- **Topic-only competencies (`mlf`, `be`, `de`, `beh`):** `score = mean(topic.best for topics in competency)` (untried topic counts as 0).
- **Design competencies (`mlsd`, `sd`):** let `t = mean(topic.best)`, `e = mean(eval.score)`. `score = evals.length ? 0.6*t + 0.4*e : t`.
- **Overall:** `sum(compScore[c] * weight[c]) / sum(weight[c])` over all seven competencies.

Verdict bands (overall): `<30` Foundations · `30–55` Building · `55–75` Interview-capable · `75–88` Strong — start applying · `≥88` Ready.
Signal buckets (per competency): strong `≥75` · push `45–74` · gap `<45`.

> When books are added post-v1, blend a `bookComprehension` signal into the relevant competency at ~0.15 weight. Design the scoring functions so this is a one-line addition, not a refactor.

**Pacing (`pace.ts`, pure).** From `goal` plus a short history of overall-readiness values: `daysLeft = targetDate − now`; `requiredPerWeek = (targetReadiness − currentReadiness) / weeksLeft`; `actualPerWeek` = readiness gained over the last ~2–3 weeks; `status` compares the two (with a tolerance band around "on-track"); `projectedDate` extrapolates current pace to the goal. Already at/above target → `done`; no goal set → `no-goal`. Every figure is advisory and must never render as a failure state.

**Activity (`activity.ts`, pure).** Fold every dated event (DSA entries, quiz attempts, evals, later reading updates) into a day → `{count, effort}` map, with `effort` bucketed to the tier idea (floor 1 / normal 2 / strong 3+). Derive `current` and `longest` streaks (a day counts when effort ≥ 1). Stores nothing extra — computed from the timestamps already in `AppState`.

---

## 5 · Assessment engine (`core/assessment/`)

```ts
export interface LlmClient {
  complete(req: { system: string; user: string; maxTokens?: number }): Promise<string>;
}

export interface AssessmentProvider {
  generateQuestion(i: {
    competencyLabel: string;
    topicLabel: string;
    style: 'technical' | 'behavioral';
    avoid: string[];
  }): Promise<string>;

  gradeAnswer(i: {
    question: string;
    answer: string;
    style: 'technical' | 'behavioral';
  }): Promise<QuizResult>;

  evaluateTranscript(i: {
    prompt: string;
    transcript: string;
    kind: 'mlsd' | 'sd';
  }): Promise<TranscriptResult>;
}
```

- `AnthropicAssessmentProvider implements AssessmentProvider` and is constructed with an `LlmClient`. It owns the prompts and JSON parsing (strip code fences; validate shape; clamp scores to 0–100).
- Grading prompts must demand **reasoning**, not recall, and return **JSON only**. Behavioral grading uses the STAR framework instead.
- The browser adapter `browserLlmClient` implements `LlmClient` by calling the Anthropic API with the user's key. Model: current Sonnet. Handle errors so a failed call surfaces a message and never corrupts state.

---

## 6 · Features & acceptance criteria

**F1 — Dashboard**
- [ ] Radial gauge shows the overall readiness % and a verdict label/subtitle by band.
- [ ] Seven competency bars, colored by bucket, sorted by the active company's weight, each showing its score.
- [ ] Three lists — strong / push / gaps — derived automatically from bucket thresholds.
- [ ] Changing the target company re-weights the gauge and bars immediately.

**F2 — DSA log**
- [ ] Add an entry (name, pattern, difficulty, result); it appears in a list and can be deleted.
- [ ] Stats: problems solved, total points, clean-solve rate, and the pattern with the most non-clean results ("weakest pattern").
- [ ] DSA competency score reflects points/target and updates the dashboard live.

**F3 — Skill quiz**
- [ ] Each topic shows its best score (or "—") and a Take/New-quiz button.
- [ ] Starting a quiz calls `generateQuestion` (passing prior questions in `avoid`) and shows an open-answer field.
- [ ] Submitting calls `gradeAnswer`; result shows score, verdict, strengths, gaps, and a model answer.
- [ ] Topic `best` updates to the max of old and new; topic marked passed at ≥ PASS; dashboard updates.
- [ ] Behavioral topics use `style: 'behavioral'`.
- [ ] Loading and error states are handled; a failed call is retryable without losing the session.

**F4 — Design coach**
- [ ] User selects a seeded problem and a mode (mlsd | sd) and can copy an interviewer prompt to run elsewhere.
- [ ] Pasting a transcript and evaluating calls `evaluateTranscript`; result shows score, summary, strengths, gaps, next steps.
- [ ] A new `EvalRecord` is stored; past sessions list under the current mode; the relevant design competency updates.
- [ ] Transcripts below a minimum length are rejected with a clear message.

**F5 — Settings**
- [ ] Enter and save an Anthropic API key (masked); stored in its own local entry; a clear "key never leaves your browser" note.
- [ ] AI features are disabled with a helpful prompt when no key is set.
- [ ] Select the target company from the seeded list.

**F6 — Persistence**
- [ ] All `AppState` changes persist to localStorage and reload on refresh.
- [ ] Export progress to a JSON file and import it back (key excluded from both).
- [ ] Corrupt/missing stored state falls back to seed defaults without crashing.

**F7 — Timeline & pacing**
- [ ] In Settings, set a target readiness % and a target date; both editable/rebaseable anytime; clearing them turns the feature off.
- [ ] Dashboard shows days left, an "ahead / on-track / behind" status from `pace.ts`, and a projected finish date at the current pace.
- [ ] When behind, the UI shows the adjusted daily effort needed to still hit the date **and** a one-tap "move date" option — never a red/failure state, always a path forward.
- [ ] Copy is encouraging throughout; no shaming language anywhere in this feature.

**F8 — Activity graph & streak**
- [ ] GitHub-style heatmap of the last ~6–12 months, one cell per day, shaded in ~4 buckets by that day's effort.
- [ ] Current-streak and longest-streak counters; a day counts when effort ≥ 1 (the "floor" rep).
- [ ] Hovering/tapping a cell shows that day's activity count.
- [ ] Derived live from logged events; no separate storage.

**Quality floor (applies to all):** responsive to mobile, visible keyboard focus, `prefers-reduced-motion` respected, no unhandled promise rejections.

---

## 7 · Key decisions & risks

- **Browser → Anthropic call method (verify before building).** Cross-origin browser calls have CORS implications. Confirm the *current* supported approach for direct browser-side calls to the Anthropic API against docs.claude.com (a documented browser-access header vs. requiring a tiny local/serverless proxy). Isolate this entirely inside `browserLlmClient` so the decision never leaks into the core.
- **Grading is non-deterministic.** The same answer can score slightly differently across runs. Acceptable for a study aid; the README must say scores are guidance, not a hiring prediction. Keep best-of semantics so variance can't erase progress.
- **Pressure must help, not shame (F7).** The target user's failure mode is falling behind and then avoiding the tool. So pacing is always framed as a path forward from the current state, the target date is trivially rebaseable, and there is no "failing" / red state. This is a deliberate design constraint, not a style choice — an accusatory deadline would defeat the app's purpose.
- **Cost.** Every quiz/eval spends the user's tokens. Keep `maxTokens` modest; don't auto-retry on success.
- **Spec drift.** Prefer the smallest change that satisfies an acceptance criterion. If reality contradicts this spec during a build, stop and update the spec first, then implement — the spec stays the source of truth.

---

## 8 · Build sequence (one task per commit; review at each gate)

1. Scaffold: Vite + React + TS + Tailwind + Vitest; repo layout above; empty core interfaces compiling.
2. `core/domain`: types, seed data (competencies, topics with the personalized ones, company profiles), and `scoring.ts` **with unit tests**. No UI.
3. `core/storage` + `web/lib/localStore.ts`; `useAppState` hook loading seed/persisted state.
4. Settings (F5) + persistence + import/export (F6).
5. `core/assessment` interfaces + `AnthropicAssessmentProvider` + prompts; `browserLlmClient` (resolve the decision in §7).
6. Dashboard (F1): gauge, bars, signals, wired to core.
7. DSA log (F2).
8. Skill quiz (F3), reusing the engine.
9. Design coach (F4).
10. Activity graph + streak (F8): `activity.ts` **with tests**, then the heatmap component. No AI, low risk — a good early motivating win.
11. Timeline + pacing (F7): `pace.ts` **with tests**, the goal fields in Settings, and the status on the dashboard.
12. Empty/error/loading states, responsive + a11y pass, README with setup + deploy (static host) + the "guidance, not prediction" note.

Ship after step 12. Books and any other backlog item are a **separate** spec and a separate pass.
