# CLAUDE.md — Runway

Steering document for this repo. Read `SPEC.md` for the full spec; `SPEC.md` is the source of truth. If anything here and the spec conflict, the spec wins — and if the spec is wrong, fix the spec before writing code.

## What this is
A local-first, single-user web app that scores interview readiness through AI-graded quizzes and a system-design evaluator. Static site, bring-your-own-API-key, no backend in v1.

## How to work
- **Plan first.** Use Plan Mode (Explore → Plan → Implement → Commit). Propose a plan, wait for approval, then implement.
- **One task, one commit.** Follow the build sequence in `SPEC.md §8`. Small, reviewable commits with clear messages.
- **Smallest change that meets the acceptance criteria.** Don't gold-plate. More code is more surface for bugs and drift.

## Architecture boundary (do not violate)
- `src/core/**` is framework-agnostic: **no** imports of React, the DOM, `window`, `fetch`, or anything from `src/web/**`.
- The core reaches the outside world only through the `LlmClient` and `Store` interfaces it defines.
- All framework/browser/network code lives in `src/web/**` adapters.
- Rationale: the same core must later back an MCP server or a Claude Skill without changes. Keep that seam clean.

## Conventions
- TypeScript, strict mode. Types in `core/domain/types.ts` are the contract; don't duplicate them.
- Pure functions in `core/domain/scoring.ts` — no side effects, no I/O. These get unit tests (Vitest) and must stay green.
- Styling: Tailwind. Keep the dark instrument-panel theme (slate base; indigo→cyan accent; emerald/amber/rose = strong/push/gap).
- Handle every async call's error path; never leave a promise rejection unhandled or corrupt state on failure.

## Guardrails
- **Scope:** build only what's in `SPEC.md §1 "In scope (v1)"`. Anything else (books, auth, sync, MCP/Skill, reminders, extra companies) is a non-goal — add a one-line backlog note in the PR/commit description, do **not** implement it.
- **Secrets:** the Anthropic API key is stored in its own localStorage entry. Never log it, never commit it, never include it in export/import.
- **LLM output:** treat model responses as untrusted — strip code fences, validate JSON shape, clamp scores to 0–100.
- **The browser→Anthropic call method is an open decision (`SPEC.md §7`)** — resolve it against current docs and keep it isolated in `web/lib/browserLlmClient.ts`.

## Definition of done for v1
All acceptance criteria in `SPEC.md §6` pass, scoring tests are green, the app is responsive and keyboard-navigable, and the README covers setup, deploy, and the "scores are guidance, not a prediction" note. Ship, then stop.
