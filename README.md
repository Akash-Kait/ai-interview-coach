# Runway — Interview Readiness Tracker

A local-first web app that turns interview prep into a single visible **readiness number**, earned through AI-graded quizzes and a system-design evaluator — not self-ticked checkboxes.

- **Readiness dashboard** — a weighted cockpit gauge, per-competency bars, and auto-derived strong / push / gap signals, re-weighted for your target company.
- **DSA log** — record problems (pattern, difficulty, result); see points toward a target, clean-solve rate, and your weakest pattern.
- **Skill quizzes (AI)** — a fresh, interview-level question per topic, graded 0–100 with strengths, gaps, and a model answer. Best-of per topic feeds your score.
- **Design coach (AI)** — copy an interviewer prompt, run it anywhere, then paste the transcript for a 0–100 evaluation.
- **Activity graph & streak** — a contribution-style heatmap of what you log, with current and longest streaks.
- **Timeline & pacing** — set a readiness goal by a date and get an encouraging on-track / behind / ahead read (never a red "failure" state).

Everything is stored **locally in your browser**. There is no backend, no account, and no server to run.

> **Scores are guidance, not a prediction.** Grading is AI-assisted and non-deterministic — the same answer can score a little differently across runs. Treat the number as a study signal to move, not a forecast of whether you'll pass a real interview. "Best-of per topic" is deliberate so normal variance can't erase your progress.

---

## Quick start

Prerequisites: **Node 20.19+ / 22.12+ or newer** (Node 24 recommended) and npm.

```bash
npm install
npm run dev        # http://localhost:5173
```

Then open **Settings** and paste your Anthropic API key to enable the AI features (quizzes and the design coach). DSA logging, the dashboard, and the activity graph work without a key.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build a static bundle into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run test` | Run the Vitest unit + component suite |
| `npm run typecheck` | `tsc -b --noEmit` (strict) |
| `npm run lint` | oxlint |

---

## Your API key (bring-your-own-key)

- The Anthropic key is stored in its **own** `localStorage` entry — it is **not** part of your progress data, and it is **excluded from export/import**.
- It is used only in the browser and sent **only to Anthropic** (`api.anthropic.com`), via the documented `anthropic-dangerous-direct-browser-access` header. It never touches a server we run — there isn't one.
- It is never logged.

**Security note:** because this is a client-side app, the key lives in your browser and is readable by anything with access to that browser profile. That's the accepted trade-off for a local, single-user tool with no backend. Don't use a shared/production key on a shared machine.

---

## Deploy (static host)

There's no backend, so any static host works:

```bash
npm run build      # outputs dist/
```

Deploy the `dist/` folder to Netlify, Vercel, Cloudflare Pages, GitHub Pages, or any static file host — no environment variables or server config required. Each user supplies their own API key at runtime in Settings.

---

## Architecture

Ports-and-adapters (hexagonal):

- `src/core/**` — framework-agnostic, pure TypeScript. Domain types, scoring/pace/activity math, seed data, and the assessment engine. It reaches the outside world only through two interfaces it defines: `LlmClient` (transport) and `Store` (persistence). **No** React, DOM, `window`, `fetch`, or `src/web` imports.
- `src/web/**` — the React adapter: components, the `useAppState` hook, the localStorage `Store`, and the browser `LlmClient` that calls Anthropic.

Keeping that seam clean is what makes the scoring logic unit-testable in isolation and lets the same core later back an MCP server or a Claude Skill without a rewrite.

Tech: React 19 · TypeScript (strict) · Vite · Tailwind v4 · Vitest. Model: Claude Sonnet (current).
