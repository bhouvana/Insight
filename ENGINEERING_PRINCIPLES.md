# ENGINEERING_PRINCIPLES.md — Insight

This project has two very different kinds of "code": prompts (agents/skills, markdown)
and a real TypeScript codebase (the MCP server). Each has its own quality bar. This
document sets both, plus the shared decision-making rules that apply to all changes.

## 1. Design Philosophy

- **Evidence over vibes**, applied to ourselves too: every persona, every scoring
  weight, every "adaptive" heuristic in the orchestrator should be justified by a
  concrete scenario in PROJECT_SPEC.md, not added because it seemed thorough.
- **Composition over inheritance, applied to prompts.** No agent's instructions should
  assume another agent's internal reasoning — they compose through the orchestrator's
  synthesis, not through shared prompt fragments. If two personas need the same
  reference material (e.g. a shared "how to think about market sizing" primer), it goes
  in a bundled reference file both can point to, not copy-pasted into both frontmatter
  bodies.
- **The orchestrator is dumb on purpose.** `founder-mode/SKILL.md` selects personas and
  synthesizes their output. It must never contain domain reasoning itself (e.g. it
  should never itself judge "is this a good market" — that's the `investor` agent's
  job). If you find yourself adding domain judgment to the orchestrator, that judgment
  belongs in a persona or the scoring server instead.
- **No feature we can't explain in one sentence why it's there.** Mirrors the mission's
  own warning against a diluted, over-long prompt — the same discipline applies to
  every persona and skill we ship.

## 2. Prompt Engineering Standards (agents & skills)

These apply to every file under `agents/` and `skills/`.

### 2.1 Frontmatter
- `name`: kebab-case, matches the filename.
- `description`: **short** (1–2 sentences). Unlike `fiori-dev`'s agents (which rely on
  rich `<example>` blocks for Claude's organic auto-delegation, since any user message
  might need them), our persona agents are dispatched *explicitly* by the orchestrator
  via the `Agent` tool — they don't need to compete for auto-activation. Keep
  descriptions utilitarian: what the persona evaluates, in one line. This is a
  deliberate, documented departure from the reference plugin's pattern (see
  PROJECT_SPEC.md §8) — don't "fix" it back to long example-laden descriptions later
  without updating that rationale.
- `model: sonnet` unless a specific persona has a stated reason to differ (none do in
  v1).
- `memory: project` is **not** used for personas — persona reasoning is
  session-scoped, not persistent per-project (that would be the wrong scope: a
  persona's opinion on the *current* idea shouldn't leak into its stance on the *next*
  unrelated idea evaluated in the same project). Session persistence lives in
  `${CLAUDE_PLUGIN_DATA}` via the MCP server instead, keyed by idea slug, not by agent.
- `color`: assign one per agent for `/context` readability; no semantic meaning beyond
  visual distinction.

### 2.2 Body content
- State the persona's reasoning frame and the specific questions it asks (see
  PROJECT_SPEC.md §8 tables) — do not write a "personality" (no "I'm an enthusiastic
  growth hacker who loves..."). The differentiator between personas is the *questions
  they ask and the priority order they apply*, not writing style.
- Every persona's output must be structured enough for the Decision Engine to
  mechanically extract strengths/weaknesses/risks from it. Each persona file ends with
  a fixed output template (see `agents/_template.md` once created) — free-form prose
  in the middle, structured headers at the end.
- Keep each agent file short. If a persona needs a large reference table (e.g. a
  market-sizing framework), put it in a sibling reference file the agent points to,
  not inline — same 500-line discipline the skills docs recommend for `SKILL.md`.

### 2.3 Skills
- `founder-mode/SKILL.md` itself must stay under 500 lines. Anything that isn't
  "what to do next, right now" moves to `personas.md` (the persona selection reference
  table) or `protocol.md` (the detailed step sequence) — both loaded on demand, not
  resident for the whole session.
- Standalone skills (`research-engine`, `creative-brainstorm`, `build-readiness-score`)
  are thin wrappers: gather minimal context, delegate to the matching agent or MCP
  tool, format the result. They must not duplicate reasoning that belongs in the agent.
- Default to auto-invocable (no `disable-model-invocation`) only for `founder-mode`
  itself, since triggering on "I want to build X" is the entire point. Standalone
  engine skills are user-invocable and Claude-invocable both, since the orchestrator
  needs to be able to reach them too.

## 3. TypeScript Engineering Standards (`founder-mode-mcp-server`)

- **Strict mode.** `tsconfig.json` has `"strict": true`, no exceptions, no `any` without
  a comment explaining why the type genuinely can't be known.
- **Pure functions for scoring.** `scoring.ts`'s `score_readiness` core logic is a pure
  function: `(input: ScoreInput, weights: WeightConfig) => ScoreResult`. No I/O, no
  randomness — this is what makes it unit-testable and reproducible, which is the
  entire reason it's code instead of a prompt (see PROJECT_SPEC.md §9.4).
- **Weights are configuration, not constants buried in logic.** Scoring weights and
  band thresholds live in a single exported config object (or a small JSON file loaded
  at startup), never inlined as magic numbers inside `scoring.ts`'s functions.
- **I/O isolated to `session-store.ts`.** All filesystem access (`${CLAUDE_PLUGIN_DATA}`
  reads/writes) lives in one module. `index.ts` (the MCP server entrypoint) wires tools
  to functions; it contains no business logic itself.
- **Dependencies: minimal by default.** Prefer Node's standard library and the official
  MCP SDK. Do not add a database driver, ORM, or HTTP framework for a plugin that reads
  and writes JSON files and exposes a handful of MCP tools.
- **No native-module dependencies.** Ruled out explicitly (see PROJECT_SPEC.md §11) —
  a plugin that fails to install because of a native build step on someone's machine
  is worse than a plugin with slightly less sophisticated persistence.
- **Testing**: Vitest (lighter footprint than Jest, first-class TS/ESM support, no
  Babel config needed). Every exported function in `scoring.ts` and `session-store.ts`
  has direct unit tests; boundary conditions (score exactly at a band threshold, empty
  session history, corrupt/missing session file) are explicit test cases, not
  incidental coverage.
- **Build**: `tsc` compiles `src/` → `dist/`; `dist/` is gitignored and built as part of
  the release protocol (see IMPLEMENTATION_PLAN.md), not committed.
- **Linting/formatting**: ESLint + Prettier, default recommended TS rule sets — no
  bespoke rule tuning unless a specific rule actively fights this document's other
  principles.

## 4. Error Handling

- **MCP server tools fail loudly and specifically.** A malformed `ScoreInput` (out of
  0–10 range, missing field) throws a typed validation error with a message naming the
  exact field — never silently clamps or defaults a bad input, since a wrong score that
  looks valid is worse than a visible failure.
- **Session persistence degrades gracefully, not silently.** A corrupt or unreadable
  session file on `load_session` returns `null` (treated as "no prior session") plus a
  logged warning — it does not crash the whole board session, since a broken history
  file shouldn't block evaluating a new idea.
- **Agents ask, they don't guess, on missing context.** If the orchestrator dispatches
  a persona without enough context to answer meaningfully (e.g. `investor` asked about
  market size with zero detail on the target market), the persona says so explicitly in
  its output rather than fabricating a plausible-sounding number.

## 5. Quality Gates (apply to every change)

Before any commit:
1. `claude plugin validate .` passes (marketplace + plugin manifest + all agent/skill
   frontmatter).
2. If `servers/founder-mode-mcp-server/` changed: `tsc --noEmit`, `eslint .`, and
   `vitest run` all pass.
3. `/sync-plugin` has been run and its diff reviewed (no hand-edits under
   `plugins/founder-mode/{agents,skills}/` — those are generated).
4. Any new persona or scoring dimension has a corresponding update to
   `PROJECT_SPEC.md` §8/§10 — the spec is the source of truth for "why does this
   exist," and it must never drift from the actual roster the way `fiori-dev`'s
   `ONBOARDING.md` cross-reference drifted from its actual repo state (a documented
   real-world failure mode we're deliberately avoiding — see the research findings on
   that repo's doc drift).

## 6. Security Considerations (of the plugin itself, not its advice)

- No secrets committed, ever — the MCP server needs none in v1 (no external API keys).
- `${CLAUDE_PLUGIN_DATA}` session files can contain a user's unshipped business idea;
  the server never transmits this data anywhere, never logs its contents to stdout/
  stderr beyond generic operation messages ("saved session `x`"), and file permissions
  follow the OS default for the user's own home directory — no broadened permissions.
- Validate all MCP tool inputs at the boundary (see §4) — the server is a trust
  boundary even though it's local, since malformed input from a future refactor of the
  orchestrator's prompt is a realistic failure mode to guard against.

## 7. Performance Considerations

- Persona dispatch: parallel `Agent` tool calls, not sequential — see
  PROJECT_SPEC.md §15.
- MCP server: all tools are fast, local, synchronous-feeling operations (JSON
  read/write, arithmetic) — no tool should take more than a few hundred milliseconds
  in normal operation. If a future feature needs slow I/O (e.g. a real external
  research API), it does not go on the scoring server — it becomes part of the
  Research Engine's own async flow, kept separate from the fast, deterministic scoring
  path.

## 8. Decision-Making Framework (for us, building this)

When a design choice comes up during implementation that isn't already settled in
PROJECT_SPEC.md:

1. Does it change what a *user* experiences, or only internal structure? Internal
   restructuring needs less ceremony than anything user-visible (new persona
   showing up unexpectedly, a changed score band, a new trigger phrase).
2. Is it reversible? Prefer the reversible option when both solve the problem
   equally well (e.g. a config value over a hardcoded constant, a new persona file
   over restructuring the orchestrator).
3. Does it add a dependency (native module, external API, new npm package)? Justify
   it explicitly against §3's "minimal by default" — the default answer is no.
4. Record it. If the choice is non-obvious enough to need this framework, it's
   non-obvious enough to add a line to PROJECT_SPEC.md so the next contributor (or
   the next session of us) doesn't re-litigate it.
