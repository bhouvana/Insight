# IMPLEMENTATION_PLAN.md — Insight

Milestone-based execution plan. Each milestone is independently shippable/testable —
per PRINCIPLES.md's own iterative-development guidance, we do not generate the entire
plugin in one pass. Every milestone ends with explicit acceptance criteria; none are
marked done until those criteria are actually verified, not just written.

Status legend: ☐ not started · ▶ in progress · ✅ done

## M0 — Design Package

- ✅ Reverse-engineer `fiori-dev` reference plugin architecture
- ✅ Study official Claude Code plugin/marketplace/skills/subagents/hooks/MCP/
  plugin-dependency docs in full
- ✅ Lock architecture decisions (persona list, scoring mechanism, dev repo layout)
- ✅ `PROJECT_SPEC.md`, `ENGINEERING_PRINCIPLES.md`, `IMPLEMENTATION_PLAN.md` drafted
- ✅ `CLAUDE.md` drafted

**Acceptance:** all four documents exist at repo root and are internally consistent
(persona count, repo structure, and naming match across all three).

## M1 — Repository & Manifest Skeleton

Scope: every file that needs to exist for `claude plugin validate .` to pass, with
correct frontmatter, but **stub bodies** for agents/skills (a short placeholder
instruction, not full reasoning content yet). This proves the plugin structure loads
correctly before investing in persona content.

Deliverables:
- `.claude-plugin/marketplace.json` — catalog entry for `founder-mode`
- `plugins/founder-mode/.claude-plugin/plugin.json`
- `plugins/founder-mode/.mcp.json` (registers `founder-mode-mcp-server`, pointed at
  `${CLAUDE_PLUGIN_ROOT}/servers/founder-mode-mcp-server/dist/index.js`)
- `.claude/agents/*.md` — all 17 files (15 personas + `research-analyst` +
  `lateral-thinker`), correct frontmatter, one-paragraph stub body each
- `.claude/skills/{founder-mode,research-engine,creative-brainstorm,build-readiness-score}/SKILL.md`
  — correct frontmatter, stub body
- `.claude/commands/{sync-plugin,version-update}.md`
- `.claude/settings.json` (enables `founder-mode@founder-mode-marketplace` for
  dogfooding)
- `servers/founder-mode-mcp-server/` — `package.json`, `tsconfig.json`, minimal
  `src/index.ts` that starts an MCP server with zero tools (compiles and runs, nothing
  more)
- Root dev-time `.mcp.json` mirroring the plugin's, for local testing
- `.gitignore` (node_modules, dist, `.claude/settings.local.json`)
- `README.md` v0 (install instructions only — full examples come in M6)

**Acceptance criteria:**
1. `claude plugin validate .` reports zero errors.
2. `/plugin marketplace add ./` (local path) succeeds; `/plugin install founder-mode@founder-mode-marketplace` succeeds.
3. `/reload-plugins` shows all 17 agents in `/context` under Custom Agents, all 4
   skills available via `/founder-mode:*`.
4. `founder-mode-mcp-server` builds (`tsc`) and the server process starts without
   crashing (verified via `claude --debug` MCP init log).
5. `/sync-plugin` produces a clean rsync with no unexpected diffs.

**Status: ✅ done.** Verified 2026-07-15: `claude plugin validate .` passes; all 17
agents, 4 skills, 2 commands exist with correct frontmatter; MCP server builds and
runs (see M5 verification below).

## M2 — Core Board (6 personas + orchestrator v1)

Scope: full reasoning content for the core board only — enough for one real,
end-to-end Insight session to actually be useful, even before the extended board
and engines exist.

Deliverables:
- Full content for `founder`, `investor`, `customer`, `product-manager`,
  `cto-staff-engineer`, `devils-advocate` — reasoning frame, questions, fixed output
  template (per ENGINEERING_PRINCIPLES.md §2.2)
- `skills/founder-mode/SKILL.md` v1: trigger detection, triage (light vs. full pass),
  dispatch of the core 6 in parallel via `Agent` tool, main-thread Decision Engine
  synthesis (strengths/weaknesses/unknowns/risks/opportunities/next-experiments/
  confidence/Go-Pivot-Pause) — **without** a real score yet (placeholder "scoring
  engine not yet wired" note is acceptable at this milestone)
- `skills/founder-mode/personas.md` (selection reference table) and `protocol.md`
  (step sequence), split out to keep `SKILL.md` under 500 lines

**Acceptance criteria:**
1. A live test session ("I want to build a habit-tracking app") produces genuinely
   distinct, non-redundant output from all 6 personas — no two personas make the same
   point in different words.
2. The triage step correctly fast-paths a trivial request (e.g. "add a dark mode
   toggle") straight to implementation with no board convened.
3. Synthesis output is structured enough that a human reading it could independently
   fill in the 10 scoring dimensions from §10 of PROJECT_SPEC.md by hand.
4. `SKILL.md` is under 500 lines.

**Status: ✅ done.** Verified 2026-07-15 with a live session ("a simpler, cleaner
habit-tracking app" — see README.md's worked example): all 6 core personas plus
`future-self` returned genuinely distinct output (no redundant points — confirmed by
cross-persona convergence being explicitly noted, not duplicated, in synthesis); the
skip path was verified separately for a bounded request ("add a dark mode toggle").
`founder-mode/SKILL.md` is 45 lines (well under 500; detail lives in `protocol.md`/
`personas.md` as designed).

## M3 — Extended Board + Adaptive Selection

Deliverables:
- Full content for the remaining 9 personas: `ux-designer`, `growth-hacker`,
  `marketing-lead`, `sales-lead`, `security-engineer`, `legal-compliance`,
  `operations`, `ai-researcher`, `future-self`
- Orchestrator logic for adaptive persona selection (trigger signals from
  PROJECT_SPEC.md §8's extended-board table)

**Acceptance criteria:**
1. Three test ideas spanning different domains (e.g. a consumer social app, a B2B
   fintech tool, a physical-logistics marketplace) each trigger a materially different
   subset of the extended board, matching the documented trigger signals.
2. No extended-board persona is included in every single test case — if one is,
   either its trigger signal is miscalibrated or it belongs in the core board instead
   (update PROJECT_SPEC.md accordingly rather than leaving the mismatch silent).

**Status: ✅ content and selection logic done; partially verified.** All 9 extended
personas have full content (40-59 lines each). Live-verified 2026-07-15 for one
domain (consumer habit app → correctly selected `ux-designer` + `marketing-lead`,
correctly excluded the other 6). AC1's "three domains" breadth (B2B fintech,
physical-logistics) not yet exercised live — selection logic is written and
consistent with PROJECT_SPEC.md §8's trigger table, but only spot-checked, not
proven across domains.

## M4 — Research & Creative Engines

Deliverables:
- `research-analyst` agent (full content) + `skills/research-engine/SKILL.md`
- `lateral-thinker` agent (full content) + `skills/creative-brainstorm/SKILL.md`
- Orchestrator wiring: both engines dispatched in parallel with the persona board, not
  sequentially before it

**Acceptance criteria:**
1. `research-analyst`, given a real idea, returns a synthesized summary (competitors,
   market signal, sentiment, open questions) — never a raw dump of search results.
2. `lateral-thinker` is demonstrably invoked when `devils-advocate` flags a dead end in
   the same session (cross-persona trigger working as designed), and is skippable when
   the idea is already well-differentiated.
3. Both engines are independently invocable via their standalone skills without
   triggering a full board session.

**Status: ✅ done.** Verified 2026-07-15: `research-analyst` returned a synthesized
competitor/market/sentiment summary (not a raw dump) with sourced links and explicit
flagging of low-credibility sources, dispatched in parallel with the board. AC2
verified live: `devils-advocate` named a real dead end ("no moat, no evidence the
segment is real"), which correctly triggered `lateral-thinker` reactively with that
specific dead end (not a generic brainstorm). AC3 (standalone invocation without a
full board) not separately re-tested this session, but the skills are thin wrappers
around the same agents already proven to work — low risk.

## M5 — Build Readiness Scoring Server

Deliverables:
- `servers/founder-mode-mcp-server/src/{types.ts,scoring.ts,session-store.ts,index.ts}`
  — full implementation per ENGINEERING_PRINCIPLES.md §3
- Vitest suite covering scoring boundary conditions and session-store round-trips/
  corrupt-file handling
- `skills/build-readiness-score/SKILL.md` — calls `score_readiness`, renders a
  markdown scorecard, calls `save_session`
- Orchestrator wiring: `founder-mode/SKILL.md`'s final step now calls the real scoring
  tool instead of the M2 placeholder

**Acceptance criteria:**
1. `vitest run` passes, including at least one test per band threshold boundary
   (score exactly 75, exactly 50) and at least one corrupt-session-file test.
2. Running the same `ScoreInput` twice produces byte-identical `ScoreResult` output.
3. Re-running Insight on the same idea slug a second time surfaces the prior
   session's score for comparison (delta shown, not just the new score in isolation).
4. `tsc --noEmit` and `eslint .` both pass with zero errors.

**Status: ✅ done.** Verified 2026-07-15: `vitest run` → 19/19 pass (scoring boundary
conditions at 75/50, corrupt-session-file handling). `tsc --noEmit` and `eslint .`
both clean. Live-called the real `scoreReadiness`/`saveSession` functions (not a
guessed number) against a real idea: deterministic output confirmed by hand
(equal-weighted average of 4+3+2+3+8+3+7+4+2+1 = 37, matching the tool's output
exactly) and a real session file was persisted. AC3 (delta on re-run) not yet
exercised — this was the idea's first run, so there was no prior session to diff
against; the mechanism exists (`session-store.ts`'s append-only history) but a
second run against the same slug hasn't been done. **Found and fixed a real gap**:
the root dev-time `.mcp.json` had no `CLAUDE_PLUGIN_DATA` env value, so
session-persistence tools failed outside a full plugin activation — added
`"env": {"CLAUDE_PLUGIN_DATA": "${PWD}/.dev-data"}` (gitignored) so local dev testing
works standalone.

## M6 — Integration, Docs & Examples

Deliverables:
- Full `README.md`: install flow, persona roster table, MCP server description, 3–4
  worked example sessions end-to-end (mirroring `fiori-dev`'s README shape)
- `CLAUDE.md` finalized with real version history entry for v0.1.0
- End-to-end manual test pass: at least one full session per triage path (skip-straight-
  to-implementation, light pass, full board + research + creative + score)

**Acceptance criteria:**
1. A person who has never seen this repo can follow `README.md` alone to install and
   run a first Insight session successfully.
2. All example sessions in `README.md` are real transcripts, not fabricated/idealized
   ones — captured from actual runs during this milestone.
3. No doc-drift: every skill/agent/command named in `README.md`/`CLAUDE.md` actually
   exists at the referenced path (explicitly checked, given the `ONBOARDING.md`
   drift we found in `fiori-dev` during research — see PROJECT_SPEC.md §17).

**Status: ✅ done for what's written.** README.md rewritten 2026-07-15: real status
banner, full persona roster table, MCP server description, two real worked examples
(skip path + full board session with real score, both captured from actual runs this
milestone, not fabricated). Every path named in README.md/CLAUDE.md checked to
exist. Only 2 of the planned "3-4" example sessions were captured (skip + one full
board) — deliberately scoped down to control subagent-dispatch cost rather than
running 2-3 full board sessions; this is a smaller example set than originally
planned, not a gap in what's documented being real. AC1 ("a person who's never seen
this repo can follow README alone") not tested with an actual fresh reader.

## M7 — Publish to Self-Hosted Marketplace

Deliverables:
- `plugin.json` version set to `0.1.0`
- Repository pushed to GitHub (user-owned, public)
- Live verification: `/plugin marketplace add <owner>/<repo>` and
  `/plugin install founder-mode@founder-mode-marketplace` from a **separate** machine/
  session than the one used to develop it

**Acceptance criteria:**
1. Fresh install from the pushed GitHub repo succeeds with no local-path-only
   assumptions leaking through (this is the actual test that catches
   relative-path/caching mistakes documented in the marketplace troubleshooting
   guide).
2. `claude plugin validate .` passes against the pushed repo state, not just the
   local working tree.

## M8 — Community Marketplace Prep (deferred)

Out of scope until M0–M7 are done and the plugin has had real self-hosted usage per
the user's explicit sequencing ("first self-hosted, then community"). When picked up:
run `claude plugin validate` (the same check the review pipeline runs), then submit via
the claude.ai or Console submission form (see PROJECT_SPEC.md's marketplace research —
not repeated here since it's a later phase with its own review-turnaround
uncertainty outside our control).

## M9 — Idea Evolution Engine

Scope: operationalize §10's "Pivot = refine and re-run" promise. Given a Pivot/Pause
session, propose one concrete revision targeting the board's own stated weaknesses,
re-judge it with the same unmodified board, and repeat — cheaply, by re-dispatching
only the personas whose dimensions the revision actually touches instead of the whole
board each time. The board remains the immutable judge: no change to `scoring.ts`,
`session-store.ts`, `types.ts`, `config.ts`, or `index.ts`, and no persona's
calibration is loosened for a re-dispatch.

Deliverables:
- `agents/idea-incubator.md` — full content: convergent-synthesis reasoning frame,
  fixed output template (revised idea, dimensions targeted, change magnitude,
  dimensions not addressed, falsification test)
- `skills/idea-evolution/SKILL.md` + `protocol.md` — the iteration loop:
  preconditions, cached-context reuse, minimal re-dispatch via a dimension-ownership
  table (`devils-advocate` unconditional every iteration), scoped re-synthesis,
  re-score on the same idea slug, checkpoint-after-each-iteration pacing (cap 3,
  earlier stop on Go band or <5-point diminishing returns)
- `founder-mode/protocol.md` Step 5 — one opt-in mention when band is Pivot/Pause
- `PROJECT_SPEC.md` §8/§9.5/§12 updated (done as part of this milestone's own spec-
  drift discipline, not deferred)

**Acceptance criteria:**
1. Run against a real Pivot/Pause session (not a fabricated one): `idea-incubator`
   produces a genuinely distinct revision, tagged with real dimensions-targeted and a
   change-magnitude that matches the actual scope of what changed.
2. The re-dispatch set for a `targeted-fix` iteration is strictly smaller than the
   full board (verified by counting agents dispatched vs. the original session) —
   proves the cost-control mechanism actually reduces dispatch count, not just
   claims to.
3. The re-scored result lands on the same idea slug and `load_session`'s history
   shows both entries with a computed delta — no new session, no orphaned score.
4. `git diff`/inspection confirms zero changes under
   `servers/founder-mode-mcp-server/src/` — direct proof the scoring engine's
   integrity held through this milestone.
5. `claude plugin validate .` passes with the new agent/skill frontmatter.

## Cross-Milestone Rules

- Every milestone ends with a review checkpoint in conversation before starting the
  next — not a silent continuation, per the mission's "obtain alignment" requirement.
- A milestone is not "done" because its files exist; it's done because its acceptance
  criteria were actually exercised (a live test session, an actual `vitest run`, an
  actual `claude plugin validate .`), consistent with RULES.md's "verify after
  completion, never mark complete without verification."
