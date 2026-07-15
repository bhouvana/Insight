# Insight — Orchestration Protocol (v4 — full board, engines, real scoring)

Scope note: this version dispatches the **6 core-board personas** plus an
**adaptively selected subset of the 9 extended-board personas** (see Step 1b), the
**Research Engine (`research-analyst`) in parallel with every Board session** (Step 2),
the **Creative Engine (`lateral-thinker`) reactively** when the synthesis finds a dead
end (Step 3a), and **real, deterministic Build Readiness Scoring** via the
`founder-mode-mcp-server` (Step 3b) — the Go/Pivot/Pause call presented in Step 4 is
now a computed score with a persisted history, not a qualitative guess.

## Step 1 — Triage

Decide one of three paths before dispatching anything:

**Skip** (go straight to implementation, no board):
- The user explicitly opts out ("skip the analysis," "just build it," "no need to
  review this," or similar in substance).
- The request is a small, bounded addition to an already-established project with no
  new business/market stakes (e.g. "add a dark mode toggle," "fix this bug," "add a
  CSV export button").
- This exact idea was already run through the board earlier in this session — don't
  re-litigate; reference the prior synthesis instead if relevant.

**Board** (dispatch the core 6):
- Everything else that reads as a new idea, product, feature with real user/business
  stakes, or project the user is about to start building — including ideas the user
  seems excited about and hasn't asked to be challenged on. Excitement is exactly when
  this is most useful, not a reason to skip it.

When genuinely ambiguous, prefer running the board — a fast, useful pass costs little;
skipping a pass that was needed costs a wasted build. But never ask the user "should I
run Insight?" as a preliminary question — decide, then let the user override
after seeing (or being told about) the decision.

## Step 1b — Extended Board Selection (only when Step 1 chose "Board")

The 6 core personas are always dispatched. `future-self` is **always included too**
whenever the board is convened — it's cheap, general-purpose, and near-universally
useful (see PROJECT_SPEC.md §8). The remaining 8 extended personas are included **only
when their specific trigger signal is genuinely present** in the idea as stated — this
step exists to be *selective*, not to be thorough by including everyone "just in
case." A session that ends up including most or all of the extended board most of the
time has failed at this step; when in doubt on a signal that's genuinely weak or
speculative, leave the persona out rather than pad the board.

Check each signal against what was actually said (not what might plausibly be implied
with enough imagination):

| Persona | Include when... |
|---|---|
| `ux-designer` | The idea is consumer- or prosumer-facing **and** interaction design is itself a primary adoption/differentiation factor (e.g. a social app, a marketplace app people choose between on experience quality) — not merely "has some kind of UI," which is true of nearly every product and isn't a selective signal. An internal or expert-operated B2B dashboard, where the core-board's `product-manager`/`cto-staff-engineer` already cover usability adequately, does not trigger this on its own |
| `growth-hacker` | There's a plausible consumer, viral, or network-effect angle — sharing or inviting others is core to how the product spreads or gains value |
| `marketing-lead` | Positioning/messaging is make-or-break: a crowded existing category, or the idea is attempting to create a new category |
| `sales-lead` | A B2B or enterprise sales motion is implied — the buyer is an organization, not an individual consumer |
| `security-engineer` | The idea handles authentication, personal data, health data, or payments |
| `legal-compliance` | A regulated domain is implied: fintech (lending, payments, banking), health, data privacy at meaningful scale, a product plausibly used by minors, **or a regulated physical goods/services domain** (food safety, alcohol, controlled substances, transportation/trucking, occupational licensing) |
| `operations` | A physical, logistics-heavy, or high-touch human-support business model is implied |
| `ai-researcher` | The idea's **core value proposition itself** is an AI/ML capability — not merely "has an AI feature bolted on" |

Multiple extended personas often apply at once (e.g. a B2B fintech idea plausibly
triggers `sales-lead`, `security-engineer`, and `legal-compliance` together). That's
expected — select every signal that's genuinely present, just don't stretch a weak or
speculative reading of the idea
to justify including one that isn't.

## Step 2 — Dispatch (parallel)

Invoke all selected persona agents **plus `research-analyst`** via the `Agent` tool
**in a single turn** (parallel tool calls, not sequential) — sequential dispatch
defeats the point of an independent board and is slower for no benefit.
`research-analyst` is dispatched alongside the board on every Board session (it's
parallel, so it costs no extra wall-clock time), not gated behind its own trigger
signal the way extended-board personas are.

Each persona dispatch message includes:
1. The idea exactly as the user stated it, plus any relevant context already
   established in this conversation.
2. This calibration instruction, given to every persona identically (kept here, not
   duplicated into each agent file — see ENGINEERING_PRINCIPLES.md §1 on the
   orchestrator holding dispatch mechanics, not personas holding orchestration logic):

   > Ground your critique in the specifics of this idea as stated. If information you
   > need wasn't given, say so explicitly and state the assumption you're making
   > rather than silently guessing or asking a clarifying question — the board should
   > produce a useful first pass even with incomplete information.

Do not summarize or pre-digest the idea before dispatching — give each persona the
same raw input so their outputs are independently comparable. `research-analyst`
gets the same raw idea, not a pre-filtered research brief.

## Step 3 — Decision Engine Synthesis (main thread)

Once all dispatched personas **and `research-analyst`** return, synthesize their
output yourself, in the main thread (not a further nested agent — see
PROJECT_SPEC.md §9.3 for why). Read every output fully before writing the synthesis;
do not synthesize from only the first few, and do not let the extended-board
personas' findings get treated as secondary to the core board's — a
`legal-compliance` blocker or a `security-engineer` red flag can outweigh everything
the core 6 said. Weave `research-analyst`'s competitor/market/sentiment findings into
the relevant sections below (typically Strengths, Weaknesses, and Risks) rather than
appending them as a separate, disconnected research report — the board's opinions and
the external evidence should read as one synthesis, not two documents stapled
together. If `research-analyst` found nothing relevant or the search signal was thin,
say so plainly rather than omitting the topic.

Produce, in this order:

1. **Key strengths** — deduplicated across personas; if two personas made the same
   point, state it once and note which personas converged on it (convergence across
   independent personas is itself a signal worth surfacing).
2. **Critical weaknesses** — same deduplication discipline.
3. **Unknowns** — what the board collectively couldn't judge due to missing
   information; list the specific missing facts, not just "more research needed."
4. **Risks** — distinct from weaknesses: risks are things that could go wrong even if
   the current plan is sound, not flaws in the plan itself.
5. **Opportunities** — anything the personas surfaced that the user's framing hadn't
   considered (a pivot from `devils-advocate`, an unstated advantage `founder` or
   `investor` noticed).
6. **Recommended next experiments** — concrete and cheap. Each experiment should have
   an implied cost (roughly: an afternoon, a week, a month) and state what result would
   change the recommendation below. Prefer 2-4 sharp experiments over a long list.
7. **Confidence level** — Low / Medium / High, with a one-sentence justification tied
   to how much of the input was assumption vs. stated fact.

Do not write a Go/Pivot/Pause call here — that's Step 3b's job now, computed from
this synthesis rather than judged separately from it.

## Step 3a — Reactive Creative Engine Dispatch (conditional)

Check `devils-advocate`'s output for its "If cornered, the way out" field.

- If it wrote "none found," skip this step entirely — do not dispatch
  `lateral-thinker` speculatively "to be thorough." Most sessions with no dead end
  don't need it.
- Otherwise, dispatch `lateral-thinker` (single `Agent` call, this can run
  sequentially since it depends on `devils-advocate`'s output) with the specific dead
  end named — not the whole idea from scratch, and not a generic "brainstorm
  alternatives" request.
- Fold whatever's useful from its pivots/analogues into the **Opportunities** section
  of the synthesis you already wrote (revise that section, don't bolt on a second,
  separate report). Label folded-in content `(Creative Engine)` so its source stays
  traceable, consistently — don't label it in some runs and not others.

## Step 3b — Build Readiness Scoring

Translate the synthesis into the `founder-mode-mcp-server`'s `score_readiness` input —
this is where qualitative findings become the reproducible number, so do this
honestly from what Steps 3–3a actually found, not from a separate fresh judgment:

1. **Derive the 10 dimension scores** (0-10 each; see PROJECT_SPEC.md §10 and
   `types.ts` for exact field names). Remember `executionComplexity` and `risk` score
   *manageability*, not raw severity — a highly complex or risky idea scores **low**
   on these fields, not high. Write a one-line rationale per dimension grounded in a
   specific finding from the synthesis (e.g. `differentiation: 3 — "table stakes vs.
   Bill.com/Tipalti per Weakness #1"`), not a bare number.
2. **Derive a stable idea slug**: kebab-case, short, capturing the idea's core
   concept (e.g. `habit-tracking-app`, `b2b-invoice-reconciliation`). Before scoring,
   call `list_sessions` (or `load_session` if you already suspect a match) to check
   whether this idea — or a clear evolution of it — was scored earlier in a prior
   session. Reuse the existing slug if so; a new idea gets a new slug.
3. Call `save_session` with the slug, a one-line idea summary, the dimensions, and
   rationale. This both scores and persists in one call, returning the full updated
   record.
4. **If the returned record's history has more than one entry**, this idea has been
   scored before — compute and note the delta: which dimensions moved, by how much,
   and whether the band changed (e.g. Pause → Pivot). Present this as "compared to
   the last time we looked at this" rather than only showing the new score in
   isolation.
5. If the qualitative synthesis and the computed band seem to disagree (e.g. the
   synthesis reads like a clear Pause but the score lands in the Go band), say so
   explicitly rather than silently picking one — that mismatch itself is useful
   signal that the dimension translation in step 1 needs a second look.

## Step 4 — Present

Show the user the full synthesis (Step 3's 7 items) followed by the Build Readiness
Score and its Go/Pivot/Pause band (Step 3b) — the computed band *is* the
recommendation now, there's no separate qualitative one to also state. Do not bury it
at the end of a long wall of text — lead with the score and band, then show the
supporting detail. If Step 3b found a delta against a prior run, show that near the
top too, not buried in an appendix.

## Step 5 — Hand-off

After presenting, either:
- The user says to proceed (explicitly, or by continuing to describe implementation
  details) → move to implementation, keeping the synthesis in context for later
  reference if relevant.
- The user wants to refine the idea based on the critique → continue the conversation
  normally; a re-run of the board on the revised idea is reasonable if the idea
  changed materially, but don't re-run it automatically without the changed idea
  actually being materially different.
- The user overrides a Pause/Pivot and wants to build anyway → honor it immediately,
  no friction, no second attempt to talk them out of it. The board's job is to make
  sure the user has seen the critique, not to enforce a decision.
- The band is Pivot or Pause → mention that the `idea-evolution` skill can refine the
  idea against this exact critique and re-run the board on the revision, entirely
  opt-in. Mention it once, plainly, then drop it — do not push it, and do not treat
  a Pivot/Pause as incomplete just because a refinement path exists.
