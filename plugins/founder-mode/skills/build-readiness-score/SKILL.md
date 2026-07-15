---
name: build-readiness-score
description: Computes and renders the Build Readiness Score (10 dimensions plus overall, with a Go/Pivot/Pause recommendation) for an idea already discussed in this session. Standalone-invocable, and used internally by founder-mode as its final step.
---

# Build Readiness Score

Calls the `founder-mode-mcp-server`'s MCP tools to turn a qualitative idea assessment
into the deterministic Build Readiness Score from `PROJECT_SPEC.md` §10. The 10
dimensions are **derived from discussion already in this session** (the board's
synthesis, or your own reasoning if invoked standalone without a board run) — never
asked of the user as a direct survey ("rate originality 1-10?").

This skill implements exactly `protocol.md` Step 3b when called from `founder-mode`,
and follows the same procedure when invoked standalone:

1. Derive the 10 dimension scores (0-10) and a one-line rationale each. Remember
   `executionComplexity` and `risk` score *manageability*, not raw severity — low
   complexity/risk scores **high**.
2. Derive a stable kebab-case idea slug. If unsure whether this idea was scored
   before, call `list_sessions` first and reuse a matching slug rather than creating
   a duplicate for the same idea.
3. Call `save_session` (slug, one-line idea summary, dimensions, rationale) — this
   scores and persists in one call.
4. If the returned record has more than one history entry, compute the delta against
   the previous entry (per-dimension movement, overall movement, band change) and
   present it alongside the new score, not instead of it.
5. Render a markdown scorecard: a table of the 10 dimensions with score + one-line
   rationale, the overall score and band, and the delta table if step 4 applied.

Never fabricate a score by reasoning about what a plausible score "should" be instead
of actually calling `score_readiness`/`save_session` — the entire value of this skill
is that the number is computed by the same deterministic function every time, not
guessed fresh per session.
