# Insight

*(formerly Founder Mode)*

An AI advisory board for Claude Code. Before Claude Code starts building your idea, it
challenges it: 15 independent expert personas, a research engine, a creative-pivot
engine, and a deterministic build-readiness score — then hands off to implementation.

> **Status: functional (M1–M6).** Core board, extended board, research/creative
> engines, and the deterministic scoring server are all implemented and exercised
> live (see Example sessions below). Not yet published to a marketplace — see
> `IMPLEMENTATION_PLAN.md` M7.

## Install

```
/plugin marketplace add <owner>/<repo>
/plugin install insight@insight-marketplace
```

Restart Claude Code when prompted to activate the bundled MCP server.

## What it does

Say "I want to build X" and Insight decides whether the idea warrants a board
review. If it does, it dispatches relevant personas in parallel, runs research and
creative-pivot passes where useful, synthesizes everything into strengths /
weaknesses / unknowns / risks / opportunities / next experiments, and produces a
Build Readiness Score with a Go / Pivot / Pause recommendation — before any code gets
written. A small, bounded request with no new business/market stakes ("add a dark
mode toggle") skips the board and goes straight to implementation.

See `PROJECT_SPEC.md` for the full engine design and architecture, and
`.claude/skills/founder-mode/protocol.md` for the exact orchestration steps.

## Persona roster

**Core board** (always dispatched when a board is convened):

| Persona | Reasoning frame |
|---|---|
| `founder` | Why-now, unfair advantage, venture-scale vs. good-business |
| `investor` | Market size, moat, competition, monetization |
| `customer` | Answers *as* the target user — pain, alternatives, willingness to switch |
| `product-manager` | Scope, MVP definition, success metrics |
| `cto-staff-engineer` | Technical feasibility, architecture, build-vs-buy |
| `devils-advocate` | Assumes the idea is wrong, finds the weakest link, names the dead end |
| `future-self` | How this looks three years out — victory-lap and eulogy retrospectives |

**Extended board** (adaptively selected — only when a specific trigger signal is present, see `protocol.md` Step 1b):

| Persona | Trigger |
|---|---|
| `ux-designer` | Consumer/prosumer-facing where interaction design itself drives adoption |
| `growth-hacker` | A plausible viral or network-effect growth angle |
| `marketing-lead` | Positioning is make-or-break (crowded category or new-category creation) |
| `sales-lead` | A B2B/enterprise sales motion is implied |
| `security-engineer` | Handles auth, personal data, health data, or payments |
| `legal-compliance` | A regulated domain (fintech, health, privacy, minors, regulated physical goods) |
| `operations` | A physical, logistics-heavy, or high-touch support business model |
| `ai-researcher` | The core value proposition itself is an AI/ML capability |

**Engines** (dispatched by trigger, not persona selection):

| Engine | When |
|---|---|
| `research-analyst` | Every board session, in parallel — competitor/market/sentiment synthesis, never a raw search dump |
| `lateral-thinker` | Reactively, only when `devils-advocate` names a real dead end (not speculatively) |

## MCP server

`founder-mode-mcp-server` is a local stdio MCP server (TypeScript, `@modelcontextprotocol/sdk`)
that turns the board's qualitative synthesis into a deterministic score — no dimension
is ever guessed by an LLM. It exposes four tools:

- `score_readiness` — pure function: 10 dimensions (0–10 each) → overall score (0–100) + Go/Pivot/Pause band. Identical input always yields identical output.
- `save_session` — scores and persists a run under a stable idea slug, appending to that idea's history.
- `load_session` / `list_sessions` — retrieve prior runs, so re-scoring the same idea shows a delta instead of a cold start.

Session history is plain JSON under `${CLAUDE_PLUGIN_DATA}/sessions/` — no database.
Scoring uses equal-weighted dimensions by default (`config.ts`), with `go`/`pivot`
band thresholds at 75/50. Corrupt or missing session files degrade to `null`/empty
rather than throwing (see `session-store.ts`). `vitest run` covers boundary
conditions (score exactly 75, exactly 50) and corrupt-file handling; `tsc --noEmit`
and `eslint .` both pass clean.

## Example sessions

Real transcripts, captured during this milestone — not idealized write-ups.

### 1. Skip path — "add a dark mode toggle to the settings screen"

Triage (Step 1) recognizes this as a small, bounded addition to an already-established
project with no new business/market stakes. No board is convened; the request goes
straight to implementation. This is the fast path — most day-to-day feature requests
take it.

### 2. Full board — "a simpler, cleaner habit-tracking app"

Idea as given: *"I want to build a mobile app that helps people build daily habits —
you set a habit, log it each day, and see a streak counter and simple progress
charts. Think a simpler, cleaner alternative to Habitica or Streaks, aimed at people
who found existing habit trackers too gamified or too plain."*

Triage convened the board. Extended-board selection (Step 1b) included `ux-designer`
(consumer app, UX-differentiated) and `marketing-lead` (crowded existing category);
it correctly excluded `growth-hacker`, `sales-lead`, `security-engineer`,
`legal-compliance`, `operations`, and `ai-researcher` — none of their trigger signals
were present in the idea as stated. `research-analyst` ran in parallel with the board,
not before it.

**Build Readiness Score: 37/100 → Pause** *(first run on this idea slug)*

| Dimension | Score |
|---|---|
| problemClarity | 4 |
| marketNeed | 3 |
| originality | 2 |
| differentiation | 3 |
| technicalFeasibility | 8 |
| businessPotential | 3 |
| executionComplexity | 7 |
| risk | 4 |
| defensibility | 2 |
| aiLeverage | 1 |

**Key strengths:** a narrow, genuinely buildable v1 scope — converged on independently
by `founder`, `product-manager`, `cto-staff-engineer`, and `ux-designer`. Legible
positioning that names two specific competitors and passes the "one-sentence test"
(`investor`, `marketing-lead`). Low technical risk: a local-only MVP is a complete,
shippable product with no scaling wall (`cto-staff-engineer`).

**Critical weaknesses:** no moat — "simpler/cleaner" is a design-taste head start,
trivially cloneable in a sprint (unanimous across `founder`, `investor`,
`devils-advocate`, `marketing-lead`). The category is already saturated with
near-identical "clean middle ground" positioning — Way of Life, Loop, HabitKit,
Habitify, Productive, and Done were independently named by three personas and
confirmed by `research-analyst`. Removing gamification removes one of the category's
few proven retention levers with no stated replacement. The single most emotionally
important UX moment — what happens when a user misses a day — is completely
undefined (`ux-designer`, `customer`, independently).

**Unknowns:** whether the "too gamified / too plain" segment is real and findable at
scale, or founder-taste generalized into a market. Platform, monetization model, and
backend/sync architecture are all unstated — `cto-staff-engineer` flags the
local-only-vs-sync decision as the single fork that determines whether this is a
weekend project or a multi-month one.

**Risks:** Apple could absorb this exact feature set natively into Health/Reminders
(`investor`). Category-wide churn is structural — `research-analyst` sourced a
92%-of-attempts-fail-within-60-days stat — not fixable by a nicer UI. Low switching
cost cuts both ways: cheap to acquire from competitors, equally cheap to lose to the
next clone.

**Opportunities:** `future-self`'s concrete mechanism — a streak that *dims but
doesn't reset*, with a 48-hour repair window — as the actual differentiator instead
of the color palette. Reactively dispatched after `devils-advocate` named a real dead
end (not "none found"), `lateral-thinker` **(Creative Engine)** proposed: re-target to
a narrow real population (sobriety, medication adherence, PT recovery) instead of an
aesthetic segment; remove the logging step via passive/sensor-based detection; add
commitment-contract stakes instead of polish; license the engine B2B2C to
employers/insurers instead of competing for App Store search. The one idea worth
taking seriously even though it sounds crazy: pivot from a consumer app to a
verification/trust layer — passive-sensor-confirmed adherence sold to institutions
that need to trust the data, which self-reported competitors structurally can't
offer.

**Recommended next experiments:** mine App Store reviews of Streaks/Habitica/Loop for
the literal "too gamified"/"too plain" complaint pattern before writing code
(afternoon) → 10–15 mom-test interviews with current/recently-churned users (a week)
→ prototype the streak-repair mechanic against a hard reset in a 2-week logging
cohort (a week) → if pursuing the vertical pivot, validate willingness-to-use in one
narrow community before building general-purpose (a month).

**Confidence: Low** — the entire premise rests on an unvalidated assumption (a real,
sizable "too gamified/too plain" segment) that multiple independent personas flagged
as founder-taste rather than evidence, and research found a disconfirming stat, not a
confirming one.

## Update

```
/plugin update insight@insight-marketplace
```

## Contributing

See `CLAUDE.md`, `PROJECT_SPEC.md`, `ENGINEERING_PRINCIPLES.md`, and
`IMPLEMENTATION_PLAN.md`.
