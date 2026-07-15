# PROJECT_SPEC.md — Insight

## 1. Product Vision

Coding assistants today go straight from idea to implementation. Insight inserts a
deliberate delay: before Claude Code writes the first line of a new project, it convenes
a board of independent expert perspectives that challenge the idea, research it, and
score its readiness — then hands off to implementation only once that process has run
its course.

**One-line pitch:** an AI advisory board that sits between "I want to build X" and the
first line of code.

**What this is not:** a form to fill out, a fixed questionnaire, or a gate that always
fires. It has to know when enough evidence exists and get out of the way.

## 2. Problem Statement

- Developers (and solo founders using Claude Code as a co-founder) suffer from
  confirmation bias: the first idea they describe to an AI assistant gets built, not
  interrogated.
- Current assistants reinforce this bias structurally — their entire design optimizes
  for "understand the request, satisfy the request."
- The cost of this is invisible at code-review time (the code is fine) and only shows up
  later, as wasted build effort on ideas that had a fatal, discoverable-in-five-minutes
  flaw (no market, no differentiation, wrong sequencing, a legal blocker).
- No existing Claude Code plugin does this. `fiori-dev` (our architecture reference) is
  representative of the category: specialist agents that make implementation *better*,
  not agents that question whether to implement at all.

## 3. Success Criteria

Insight succeeds if, across real usage:

1. **It changes decisions, not just vibes.** A meaningful fraction of sessions end in
   "pivot" or "pause," not always "go" — if it always says go, it's decoration.
2. **It doesn't get uninstalled for being annoying.** Users who invoke it once keep
   letting it auto-trigger on new ideas rather than routing around it.
3. **The Build Readiness Score is stable and explainable.** Given the same inputs, the
   score is reproducible, and every sub-score traces to a stated reason, not a vibe.
4. **Time-to-first-question is fast.** The board doesn't make the user wait through a
   slow research phase before saying anything — a quick read comes first, research (if
   needed) happens in parallel/background.
5. **It's extensible without surgery.** Adding a 16th persona, a new scoring dimension,
   or a new research source doesn't require touching the orchestration skill's core
   logic.

## 4. Non-Goals (v1)

- Not a general-purpose product-management tool for teams — it's a single-session,
  single-user advisory pass.
- Not a replacement for real user research, real market validation, or real legal
  review — it's a fast, structured first pass that surfaces what real validation should
  target.
- Not going to integrate with external SaaS (Product Hunt API, Crunchbase, etc.) in v1.
  Research Engine v1 uses Claude Code's built-in WebSearch/WebFetch only.
- Not going to persist data outside the user's own machine (`${CLAUDE_PLUGIN_DATA}`) —
  no telemetry, no phone-home.

## 5. User Personas (of the plugin's *users*, not the board personas)

- **Solo founder-developer**: has an idea, is about to ask Claude Code to scaffold it.
  Wants friction here specifically, wants speed everywhere else.
- **Engineer at a startup pitching an internal feature**: wants ammunition — a
  structured devil's-advocate pass — before proposing it to their team.
- **Student / side-project builder**: wants to learn to ask themselves better questions,
  values the mentor-adjacent "why" more than the score itself.

## 6. UX Principles

1. **Conversational, not a form.** No fixed sequential questionnaire. The orchestrator
   decides which questions matter based on what's already been said.
2. **Context accumulates.** Within a session, previously given answers are never
   re-asked. Across sessions, `${CLAUDE_PLUGIN_DATA}` session history means re-running
   Insight on an evolving idea shows a delta, not a cold start.
3. **Depth is adaptive.** A one-line idea for a weekend hack gets a light pass (2-3
   personas, no research). "I want to build a fintech compliance SaaS" gets the full
   board plus research plus a security/legal pass.
4. **Always show the exit.** Every board session ends with an explicit Go / Pivot /
   Pause and a concrete next action — never a dangling "here are 10 concerns, good
   luck."
5. **The user can always skip it.** An explicit "skip the analysis, just build it" is
   honored immediately, every time — friction is a default, not a lock.

## 7. Core Workflow

```
Idea ("I want to build X")
        │
        ▼
[founder-mode skill activates — auto, on trigger phrases]
        │
        ▼
Triage: is this substantial enough to warrant board review?
  ├─ No (trivial/already well-scoped/user opts out) ──────────► straight to implementation
  └─ Yes
        │
        ▼
Select relevant personas (adaptive — not always all 15)
        │
        ├──────────────► Research Engine (research-analyst agent, parallel)
        ├──────────────► Persona board (parallel Agent-tool dispatch)
        └──────────────► Creative Engine (lateral-thinker agent, if idea is underdeveloped)
        │
        ▼
Decision Engine (main thread synthesizes: strengths, weaknesses, unknowns,
risks, opportunities, recommended next experiments, confidence)
        │
        ▼
Build Readiness Score (founder-mode-mcp-server: score_readiness tool —
deterministic, 10 dimensions + overall)
        │
        ▼
Present: synthesis + score + Go/Pivot/Pause + next experiments
        │
        ▼
Save session to ${CLAUDE_PLUGIN_DATA} (idea slug → history)
        │
        ▼
Only now: transition to implementation (if Go, or user overrides)
```

## 8. Persona Roster (15 subagents)

Each persona is an independent reasoning frame, not a chatbot personality. Personas are
**dispatched explicitly** by the `founder-mode` orchestrating skill via the `Agent` tool
— they are not left to Claude's organic auto-delegation, so their frontmatter
`description` fields stay short (they don't need to "sell" auto-activation), keeping
the always-on context cost of 15 agent descriptions low.

**Core board** (near-always included):

| # | Persona | Core Questions |
|---|---------|-----------------|
| 1 | `founder` | Who is this for? Why now? Why this market/solution? Unfair advantage? Venture-scale? |
| 2 | `investor` | Market size, moat, competition, timing, defensibility, monetization, unit economics, why incumbents won't just copy it |
| 3 | `customer` | Why should I care? What pain? What alternatives? Would I pay? Would I recommend it? What would frustrate me? |
| 4 | `product-manager` | MVP scope, roadmap, prioritization, feature creep, success metrics, activation/retention |
| 5 | `cto-staff-engineer` | Feasibility, complexity, architecture, maintainability, scalability, security posture, deployment, tech debt, engineering effort |
| 6 | `devils-advocate` | Assumes the idea is wrong; finds every weakness; forces stronger thinking |

**Extended board** (included adaptively, based on domain relevance detected by the
orchestrator):

| # | Persona | Trigger Signal |
|---|---------|-----------------|
| 7 | `ux-designer` | Consumer/prosumer-facing **and** interaction design is a primary adoption/differentiation factor — not merely "has a UI" (see M3 calibration note below) |
| 8 | `growth-hacker` | Consumer/viral/network-effect angle |
| 9 | `marketing-lead` | Positioning, messaging, GTM-sensitive ideas |
| 10 | `sales-lead` | B2B / enterprise sales motion implied |
| 11 | `security-engineer` | Handles auth, PII, payments, or sensitive data |
| 12 | `legal-compliance` | Regulated domain (fintech, health, data privacy, minors, **or regulated physical goods/services**: food safety, alcohol, controlled substances, transportation, occupational licensing) |
| 13 | `operations` | Physical/logistics/support-heavy business model |
| 14 | `ai-researcher` | Idea's core value prop is itself an AI/ML capability |
| 15 | `future-self` | Always included whenever the board is convened (no longer conditional — see M3 note) |

> **M3 calibration finding**: the original `ux-designer` trigger ("has a real
> interaction surface") and the original `legal-compliance` scope (fintech/health/
> data-privacy/minors only) were reasoned through against three domain-differentiated
> test ideas during M3 (a live-tested consumer social app, plus a B2B fintech tool and
> a physical produce-delivery marketplace verified by inspection after a usage-limit
> interruption — see IMPLEMENTATION_PLAN.md M3). `ux-designer`'s original wording would
> have fired on all three — too broad to be a selective extended-board signal, since
> nearly every product has *some* UI. Narrowed to require that interaction design
> itself be a primary adoption/differentiation factor, excluding internal/expert-
> operated B2B tools where the core board already covers usability. Separately, the
> produce-delivery marketplace exposed a real regulatory domain — food safety/
> agricultural handling — that the original `legal-compliance` trigger didn't cover at
> all. Broadened to include regulated physical goods/services generally. Both changes
> are reflected in `protocol.md` Step 1b and `personas.md`, per IMPLEMENTATION_PLAN.md's
> M3 acceptance criteria (a persona firing on every test case must be recalibrated, not
> left silent). `future-self` was also simplified from "default in full-board sessions,
> skippable in light passes" to unconditional, since the light-pass tier was never
> implemented as a separate path (see personas.md's selection-heuristic note).

**Engine agents** (not "board members," but dispatched the same way):

| Agent | Role |
|---|---|
| `research-analyst` | Research Engine — competitors, market signals, GitHub/HN/Reddit sentiment, pricing models, via WebSearch/WebFetch |
| `lateral-thinker` | Creative Engine — "what if" pivots, cross-domain inspiration, business-model variants, second-order effects |
| `idea-incubator` | Evolution Engine — synthesizes one concrete next-iteration idea targeting the board's stated weaknesses; never scores, never dispatched by `founder-mode` itself (see §9.5) |

## 9. Engines

### 9.1 Research Engine
Implemented as the `research-analyst` agent + a thin `research-engine` skill wrapper for
standalone invocation. Uses built-in `WebSearch`/`WebFetch` only in v1. Synthesizes
findings into: competitor summary, market signal summary, sentiment summary, and a
short list of open questions research couldn't answer — never dumps raw search results.

### 9.2 Creative Thinking Engine
Implemented as the `lateral-thinker` agent + `creative-brainstorm` skill wrapper.
Generates: unexpected pivots, cross-domain analogues, business-model variants,
distribution variants, second-order effects. Triggered by the orchestrator when the
idea is underdeveloped or the board's critiques suggest the current framing is
cornered (e.g., devils-advocate identifies a dead end).

### 9.3 Decision Engine
Not a separate agent — lives in the `founder-mode` skill's own final synthesis step,
executed in the main thread (avoids the fixed subagent nesting depth limit and keeps
the synthesis visible to the user directly, rather than another layer of delegation).
Produces: key strengths, critical weaknesses, unknowns, risks, opportunities,
recommended next experiments, confidence level, and a Go / Pivot / Pause call.

### 9.4 Build Readiness Scoring
Implemented as a small TypeScript MCP server (`founder-mode-mcp-server`) exposing a
`score_readiness` tool. Deterministic and unit-tested — this is intentional: an LLM
re-deriving a "score" from scratch each run is not reproducible, and reproducibility is
the entire point of a score. See §11 for the tool contract.

### 9.5 Idea Evolution Engine
Implemented as the `idea-incubator` agent + an `idea-evolution` skill (with its own
`protocol.md`, mirroring `founder-mode`'s split). Operationalizes what §10's Pivot band
already promised ("refine and re-run before building") but v1 never implemented: given
a Pivot/Pause session, `idea-incubator` proposes exactly one concrete revision
targeting the board's own stated weaknesses, and the orchestrator re-dispatches only
the personas whose dimensions that revision touches — plus `devils-advocate`,
unconditionally, every iteration — rather than re-running the whole board. The board
itself is never modified: re-dispatched personas get the identical calibration
instruction as a first-time dispatch, and `score_readiness`/the scoring weights are
untouched. Re-scores land on the same idea slug, reusing the history/delta mechanism
§9.4 and §11 already provide — no new MCP tool. Opt-in only, offered by `founder-mode`
Step 5 on a Pivot/Pause result, never auto-triggered, checkpointed after every
iteration by default (cap 3, or earlier on Go-band or <5-point diminishing returns).

## 10. Build Readiness Score — Dimensions

Ten input dimensions (0–10 each, populated from the Decision Engine's synthesis, not
asked directly of the user):

1. Problem Clarity
2. Market Need
3. Originality
4. Differentiation
5. Technical Feasibility
6. Business Potential
7. Execution Complexity (inverted — lower complexity scores higher)
8. Risk (inverted — lower risk scores higher)
9. Defensibility
10. AI Leverage

**Overall Readiness** = weighted composite (weights defined in the server's config, not
hardcoded inline — see ENGINEERING_PRINCIPLES.md §"Configuration over constants").

**Bands** (initial defaults, tunable):
- ≥ 75 → **Go**
- 50–74 → **Pivot** (refine and re-run before building)
- < 50 → **Pause** (fundamental blocker — do not proceed to implementation without addressing it)

## 11. MCP Server Contract (`founder-mode-mcp-server`)

Tools:

- `score_readiness(input: ScoreInput): ScoreResult` — pure function, deterministic,
  unit-tested. `ScoreInput` = the 10 named 0–10 fields + optional per-field rationale
  strings (persisted for explainability, not used in the math).
- `save_session(ideaSlug: string, session: SessionRecord): void` — writes JSON to
  `${CLAUDE_PLUGIN_DATA}/sessions/{slug}.json`.
- `load_session(ideaSlug: string): SessionRecord | null` — for delta-tracking on re-runs.
- `list_sessions(): SessionSummary[]` — enumerate past ideas evaluated, for "how has
  this evolved" queries.

Persistence format: plain JSON files under `${CLAUDE_PLUGIN_DATA}/sessions/`. Explicitly
**not** SQLite — avoids native-module build pain across platforms (this matters
concretely on Windows dev environments, where `better-sqlite3`-style native bindings are
a recurring source of install failures).

## 12. Repository Structure

```
Claudecode-plugin/                         (marketplace + dev repo root)
├── .claude-plugin/
│   └── marketplace.json                   (self-hosted marketplace catalog)
├── .claude/                                (SOURCE OF TRUTH during development)
│   ├── agents/                             (18 agent .md files — 15 personas + 3 engines)
│   ├── skills/
│   │   ├── founder-mode/SKILL.md
│   │   ├── founder-mode/personas.md        (reference table, kept out of SKILL.md body)
│   │   ├── founder-mode/protocol.md        (detailed step sequence)
│   │   ├── research-engine/SKILL.md
│   │   ├── creative-brainstorm/SKILL.md
│   │   ├── build-readiness-score/SKILL.md
│   │   ├── idea-evolution/SKILL.md
│   │   └── idea-evolution/protocol.md      (iteration loop, dimension-ownership table)
│   ├── commands/
│   │   ├── sync-plugin.md
│   │   └── version-update.md
│   └── settings.json
├── plugins/founder-mode/                   (PACKAGED — mirrored from .claude/ via /sync-plugin)
│   ├── .claude-plugin/plugin.json
│   ├── agents/                             (synced copy)
│   ├── skills/                             (synced copy)
│   ├── .mcp.json                           (registers founder-mode-mcp-server)
│   └── servers/founder-mode-mcp-server/    (NOT synced — canonical source lives only here)
│       ├── src/
│       │   ├── index.ts                    (MCP server entrypoint)
│       │   ├── scoring.ts                  (score_readiness pure logic)
│       │   ├── session-store.ts            (save/load/list session JSON)
│       │   └── types.ts
│       ├── tests/
│       ├── package.json
│       ├── tsconfig.json
│       └── dist/                           (build output, gitignored)
├── .mcp.json                                (dev-time — points at the same server via relative path)
├── CLAUDE.md
├── README.md
├── PROJECT_SPEC.md
├── ENGINEERING_PRINCIPLES.md
├── IMPLEMENTATION_PLAN.md
└── .gitignore
```

Key rule (mirrors `fiori-dev`): `.claude/agents/` and `.claude/skills/` are the only
places these files are hand-edited. `plugins/founder-mode/{agents,skills}/` are a
mechanically-generated mirror via `/sync-plugin` (rsync `--delete`), never edited
directly. The MCP server source is the one exception — it lives only under
`plugins/founder-mode/servers/`, since it isn't a skill/agent Claude loads by path
convention and has no reason to be duplicated.

## 12.1 Naming

- Marketplace name: `founder-mode-marketplace` (kebab-case; avoids the reserved-name
  list — `claude-plugins-*`, `anthropic-*`, etc.).
- Plugin name: `founder-mode`.
- Persona invocation surface: `@agent-founder-mode:investor` etc. (namespaced
  automatically since these are plugin agents).
- Primary skill: `/founder-mode:founder-mode` (auto-triggers; also user-invocable
  directly).

## 13. Extensibility

- **New persona** = one new `.md` file under `agents/`, added to the persona table in
  `skills/founder-mode/personas.md`, and one line in the orchestrator's persona-selection
  logic. No change to any other agent file.
- **New scoring dimension** = add a field to `ScoreInput` in `types.ts`, a weight in the
  server's config, and a test. The orchestrator's prompt references dimensions by name
  from `personas.md`/`protocol.md`, not by a hardcoded list duplicated elsewhere.
- **New research source** = extend `research-analyst`'s instructions; no interface
  change, since it consumes generic WebSearch/WebFetch.
- **Composition over inheritance in practice**: every engine is independently
  invocable (its own skill) *and* composed into the full board session — nothing is
  wired so tightly into `founder-mode` that it can't be used standalone.

## 14. Security & Privacy Considerations

- No secrets, no API keys required for v1 (WebSearch/WebFetch + local JSON persistence
  only).
- `${CLAUDE_PLUGIN_DATA}` session files may contain the user's unshipped business idea
  — treat as sensitive by default: never transmitted anywhere, never included in the
  plugin's own logs, `.gitignore`d if a user happens to develop the plugin itself in a
  repo that also holds sessions.
- The `security-engineer` and `legal-compliance` personas are themselves security/compliance
  *advisors to the user's idea*, not a security review of the plugin itself — that's
  covered separately in ENGINEERING_PRINCIPLES.md.

## 15. Performance Considerations

- Persona dispatch is parallel (multiple `Agent` tool calls in one turn), not
  sequential — a 6-persona core board should not take 6x as long as one persona.
- Research Engine runs concurrently with persona dispatch, not before it — the board's
  qualitative read shouldn't block on web research finishing.
- Agent descriptions are kept short (per §8) specifically to bound the always-on token
  cost of having 17 agents loaded every session, whether or not Insight is
  invoked that session.

## 16. Testing Strategy

- **MCP server**: unit tests for `scoring.ts` (deterministic — same input, same output,
  boundary conditions at band thresholds) and `session-store.ts` (round-trip
  save/load, corrupt-file handling). Standard TS test runner (Vitest — see
  ENGINEERING_PRINCIPLES.md).
- **Agents/skills**: not unit-testable in the traditional sense; validated via
  `claude plugin validate` (schema/frontmatter correctness) and manual scenario
  walkthroughs captured as example transcripts in `README.md`/`docs/examples/`.
- **Marketplace/plugin manifests**: `claude plugin validate .` run before every commit
  (see IMPLEMENTATION_PLAN.md acceptance criteria).

## 17. Documentation Standards

- `README.md` — end-user facing: install flow, persona roster, example sessions,
  update flow (mirrors `fiori-dev`'s README shape, which is proven to work).
- `CLAUDE.md` — contributor/maintainer facing: source-of-truth rules, sync/release
  protocol, non-negotiable design rules.
- `PROJECT_SPEC.md` (this file), `ENGINEERING_PRINCIPLES.md`, `IMPLEMENTATION_PLAN.md`
  — design package, not shipped to end users as plugin content, but kept in the repo
  root for contributors and for our own reference during the build.
