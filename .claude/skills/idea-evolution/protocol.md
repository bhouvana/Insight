# Idea Evolution Engine — Orchestration Protocol

Scope: refine a Pivot/Pause idea against the board's own stated weaknesses, then
re-judge the revision with the same unmodified board. The board's calibration never
changes between iterations — only the idea does.

## Step 1 — Preconditions

A scored session must exist for this idea (`load_session`/`list_sessions`). Band must
be Pivot or Pause to *offer* this engine; if the user explicitly asks to run it on a
Go-band idea anyway, honor it without argument — same "no friction on an explicit
override" rule as `founder-mode` itself.

## Step 2 — Load cached context (don't re-derive what's already known)

Pull from the loaded session: the latest `dimensions` scores and their `rationale`
strings. The rationale strings **are** the compact cache of the board's critique —
that's why every score-affecting field carries a one-line justification (see
`build-readiness-score/SKILL.md`). If the original board synthesis or a
`lateral-thinker` run from this same idea is still visible earlier in this
conversation, reuse it directly; do not re-dispatch personas just to reconstruct
context that's already in hand.

## Step 3 — Dispatch `idea-incubator`

Single `Agent` call. Give it: the idea as most recently stated, the full dimension
scores + rationale, and any synthesis/creative-engine findings from Step 2. Do not
pre-filter or summarize this into a shorter brief — same "raw input, not a
pre-digested brief" discipline `founder-mode/protocol.md` Step 2 uses for the board.

If `idea-incubator`'s output states it could not find a viable `targeted-fix` and
names a `fundamental-pivot` as required, and no `lateral-thinker` output for this
idea already exists in context: dispatch `lateral-thinker` once, targeted at the
specific dead end `idea-incubator` named (reusing `founder-mode/protocol.md` Step
3a's reactive-dispatch pattern), then re-invoke `idea-incubator` once more with those
pivots folded in. This is the exception path, not the default — most iterations are a
single `idea-incubator` call.

## Step 4 — Compute the minimal re-dispatch set

Read `idea-incubator`'s **Dimensions targeted** and **Change magnitude** fields.

**If `targeted-fix`:** look up each targeted dimension in the ownership table below
and union their owners. Always add `devils-advocate` regardless of what was targeted
— it is the integrity check confirming old weaknesses are actually gone and no new
ones were introduced, every iteration, unconditionally. Also include any
extended-board persona that was part of the *original* dispatch if one of its
dimensions was targeted (e.g. `legal-compliance` if `risk` was targeted and
`legal-compliance` was on the original board).

**If `fundamental-pivot`:** don't use the ownership table — re-run
`founder-mode/protocol.md` Step 1b's full extended-board triage against the revised
idea from scratch (a pivot this large can change which extended-board signals apply),
dispatch the full core 6 + `future-self`, and treat it structurally like a new board
session on the revised idea, still on the same idea slug so history/delta still work.

### Dimension-ownership table (targeted-fix only)

| Dimension | Owner(s) re-dispatched when targeted |
|---|---|
| `problemClarity` | `product-manager`, `customer` |
| `marketNeed` | `investor`, `customer`, `research-analyst`* |
| `originality` | `investor`, `marketing-lead` |
| `differentiation` | `investor`, `marketing-lead` |
| `technicalFeasibility` | `cto-staff-engineer` |
| `businessPotential` | `investor`, `founder` |
| `executionComplexity` | `cto-staff-engineer` |
| `risk` | `cto-staff-engineer`, plus any extended-board persona already on the board whose domain the risk touches |
| `defensibility` | `investor`, `founder` |
| `aiLeverage` | `ai-researcher` (only if it was on the original board) |

`*research-analyst`: only re-dispatch, scoped to the specific new angle, if
`idea-incubator`'s revision plausibly changes the competitive set (new segment,
vertical, or target customer). Otherwise reuse the original research findings as-is —
don't spend a research pass re-confirming a competitive landscape that didn't change.

## Step 5 — Dispatch the minimal set (parallel)

Single turn, parallel `Agent` calls — same discipline as `founder-mode/protocol.md`
Step 2. Each persona gets: the revised idea statement, and **only its own** prior
critique from the last iteration as reference context (not the whole board's, not
other personas' findings) — enough to judge whether its specific concern was
addressed, not so much that it starts reasoning about other personas' territory.
Use the identical calibration instruction `founder-mode/protocol.md` Step 2 gives a
first-time dispatch — no "this is a revision, be encouraging" framing. The persona
evaluates what's in front of it, same as any idea it had never seen.

## Step 6 — Re-synthesize (main thread)

Same synthesis discipline as `founder-mode/protocol.md` Step 3, but scoped: rewrite
only the strengths/weaknesses/risks/opportunities language tied to dimensions that
were actually re-dispatched this iteration. Everything else carries forward from the
prior iteration's synthesis, and must be **explicitly labeled** "carried forward from
iteration N-1, not re-evaluated this round" — never silently presented as if it were
fresh.

## Step 7 — Re-score

Derive updated scores only for dimensions whose owners were re-dispatched this
iteration (plus anything `devils-advocate` specifically flagged as newly at risk,
even if untargeted). Every other dimension's score and rationale copies forward
verbatim, byte-for-byte, from the prior iteration — this is what makes the re-score
auditable rather than a fresh guess. Call
`mcp__founder-mode-mcp-server__save_session` with the full updated dimension set on
the **same idea slug** — this is the same tool `build-readiness-score` already uses;
no new MCP tool exists or is needed. The returned record's history already contains
the delta.

## Step 8 — Stop or continue

Stop this iteration and present (Step 9) without asking, when any of:
- The new `overall` score is in the Go band.
- This was iteration 3 (the default cap) since the evolution loop started.
- The new `overall` moved by fewer than 5 points versus the immediately prior
  iteration (diminishing returns) — state this plainly rather than continuing to
  spend a dispatch chasing a marginal gain.

Otherwise: present this iteration's delta (Step 9) and ask the user whether to run
another iteration. Wait for an explicit answer — do not auto-continue. If the user
says to keep going without checkpointing further, honor that for the rest of this
session's evolution runs on this idea.

## Step 9 — Present

Show, in this order: a trajectory table (iteration → overall → band → one-line
summary of what changed), the current iteration's full dimension table with each
dimension marked re-evaluated or carried-forward, the scoped synthesis update from
Step 6, and — if a stop condition from Step 8 was hit — say which one plainly (Go
reached / cap reached / diminishing returns) rather than leaving the user to infer
why it stopped.
