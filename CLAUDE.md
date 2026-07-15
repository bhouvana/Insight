# CLAUDE.md — Insight (contributor guide)

Insight (formerly "Founder Mode" — the old name persists in internal paths like
`plugins/founder-mode/` and the `founder-mode` skill/plugin id; see Source of Truth
below) is a Claude Code plugin: an AI advisory board (15 personas + a research
engine + a creative engine + a deterministic scoring server) that challenges an idea
before Claude Code starts implementing it.

**Before touching this repo, read, in order:** `PROJECT_SPEC.md` (what we're building
and why), `ENGINEERING_PRINCIPLES.md` (how we write prompts and TypeScript here),
`IMPLEMENTATION_PLAN.md` (current milestone and its acceptance criteria). This file is
deliberately short — it points at those, it doesn't repeat them.

## Source of Truth

`.claude/agents/`, `.claude/skills/`, `.claude/commands/` are hand-edited. Everything
under `plugins/founder-mode/{agents,skills}/` is a **mechanically generated mirror**,
produced by `/sync-plugin` (rsync `--delete`). Never edit the mirrored copy directly —
run `/sync-plugin` before every commit that touches agents/skills.

Exception: `plugins/founder-mode/servers/founder-mode-mcp-server/` is real source code
with no `.claude/`-side duplicate — it's edited in place.

There is a real build step here (unlike `fiori-dev`, which had none): the MCP server
needs `tsc` to produce `dist/`, plus `vitest`/`eslint` gates. See
`ENGINEERING_PRINCIPLES.md` §5 for the full pre-commit checklist.

## Key Design Rules (do not break these)

- **Personas are dispatched explicitly, never left to auto-delegation.** The
  `founder-mode` skill decides which personas run and invokes them via the `Agent`
  tool. Persona `description` frontmatter stays short on purpose (see
  ENGINEERING_PRINCIPLES.md §2.1) — don't lengthen it "for clarity" without updating
  that rationale, since it changes the token-cost tradeoff the whole roster size
  depends on.
- **The orchestrator holds no domain judgment.** `founder-mode/SKILL.md` selects and
  synthesizes; it never itself decides whether a market is good, a feature is
  in-scope, or code is secure — that's always a persona's call.
- **Scoring is deterministic code, not an LLM guess.** `score_readiness` lives in
  `founder-mode-mcp-server` and must stay a pure, tested function. If a "scoring"
  change can't be expressed as a weight/threshold in config, it doesn't belong in
  `scoring.ts`.
- **No native-module dependencies.** Session persistence is plain JSON under
  `${CLAUDE_PLUGIN_DATA}` — deliberately not SQLite (see PROJECT_SPEC.md §11).
- **The plugin can always be skipped.** An explicit user opt-out is honored
  immediately, every time. Never add a code path that forces the board to run.
- **Spec and reality must not drift.** Every persona/skill/command named in
  `README.md` must exist at the path named. `fiori-dev`'s `ONBOARDING.md` cross-
  reference drift is the cautionary example we're avoiding — see PROJECT_SPEC.md §17.

## Versioning

Semver in `plugins/founder-mode/.claude-plugin/plugin.json`. Bump rules: new/changed
persona or skill → minor; scoring formula or session-file format change → major if it
breaks existing saved sessions, minor otherwise; doc-only change → no bump. Use
`/version-update` to bump the version and prepend a changelog entry below.

## Working Through the Plan

Follow `IMPLEMENTATION_PLAN.md` milestone order (M1 → M8). Don't jump ahead to persona
content before the M1 skeleton passes `claude plugin validate .` — the acceptance
criteria exist to catch structural mistakes before they're duplicated across 17 agent
files.

## Version History

### 0.1.0-dev — 2026-07-14
- Repository scaffolded. Design package (`PROJECT_SPEC.md`, `ENGINEERING_PRINCIPLES.md`,
  `IMPLEMENTATION_PLAN.md`, this file) drafted. No plugin content yet — see M1 in
  `IMPLEMENTATION_PLAN.md`.
