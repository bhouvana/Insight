# Contributing

Start with `CLAUDE.md` — it points at `PROJECT_SPEC.md` (what this is and why),
`ENGINEERING_PRINCIPLES.md` (how prompts and the MCP server's TypeScript are written
here), and `IMPLEMENTATION_PLAN.md` (current milestone). This file doesn't repeat any
of that; it's just the PR checklist.

## Before opening a PR

1. If you touched `.claude/agents/` or `.claude/skills/`: run `/sync-plugin` and
   commit the resulting diff under `plugins/founder-mode/{agents,skills}/` — those
   are a generated mirror, never hand-edited directly.
2. If you touched `plugins/founder-mode/servers/founder-mode-mcp-server/`: run
   `tsc --noEmit`, `eslint .`, and `vitest run` in that directory — all three must
   pass clean.
3. Run `claude plugin validate .` from the repo root.
4. If you added or changed a persona or a scoring dimension: update
   `PROJECT_SPEC.md` §8/§10 in the same PR — the spec is the source of truth for
   *why* something exists, and it must not drift from the actual roster.
5. Don't bump the version yourself — that's `/version-update`, and it's a
   maintainer decision about the changelog entry, not something to fold into an
   unrelated PR.

CI (`.github/workflows/ci.yml`) runs the MCP server checks and a sync-mirror diff
automatically; it does not run `claude plugin validate` (requires the Claude Code CLI,
not available in this workflow) — that step stays manual per above.
