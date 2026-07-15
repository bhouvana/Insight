---
name: idea-evolution
description: Iteratively refines a low-scoring idea against the board's own stated weaknesses, then re-runs the same strict board to re-judge it. Standalone-invocable, and offered (never forced) by founder-mode when a session scores Pivot or Pause.
argument-hint: [idea slug or idea description to evolve]
---

# Idea Evolution Engine

`PROJECT_SPEC.md` §10 defines the Pivot band as "refine and re-run before building" —
this skill is that refine step. It does not change how anything is scored; it changes
the idea, then hands the revision to the same unmodified board.

Read `protocol.md` (in this skill's directory) for the exact loop — the iteration
sequence, the dimension-ownership table that decides which personas get re-dispatched
on a targeted fix, and the stopping conditions. Follow it precisely.

## What to do

1. Identify the idea slug: from `$ARGUMENTS` if given, otherwise from a session
   already discussed in this conversation. Call `mcp__founder-mode-mcp-server__load_session`
   (or `list_sessions` if the slug is ambiguous) to get the latest score.
2. Refuse to proceed (explain why, don't force it) if there's no scored session for
   this idea yet — this engine refines an existing verdict, it doesn't produce a
   first one. Direct the user to `founder-mode` first.
3. If the latest band is already Go, this engine has nothing to fix — say so, and
   only proceed if the user explicitly asks anyway (no friction on an explicit
   request, but don't offer it as a default next step on a Go idea).
4. Otherwise follow `protocol.md` steps 1-9: dispatch `idea-incubator`, compute the
   minimal re-dispatch set, re-run only those personas plus `devils-advocate`,
   re-synthesize and re-score on the same slug, checkpoint with the user after every
   iteration before continuing.
5. Never fabricate a "would-be" score or a persona's reaction instead of dispatching
   the real agent/tool — the entire value of this engine, same as `founder-mode`
   itself, is that the judgment is independent and the number is computed, not
   guessed.
6. Honor an explicit stop at any point, immediately — including "just show me what
   you have" mid-iteration.
