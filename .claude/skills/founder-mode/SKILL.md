---
name: founder-mode
description: Convenes an AI advisory board (personas, research, and scoring) to challenge an idea before implementation begins. Triggers on "I want to build X" and similar.
when_to_use: I want to build, I'm building, idea for a startup, should I build this, is this a good idea, new project idea, thinking about building
---

# Insight

Insight inserts a deliberate pause between an idea and its implementation: an
independent board of expert personas challenges it before any code gets written.

Read `personas.md` (in this skill's directory) for the full persona roster and
selection signals. Read `protocol.md` for the exact triage/dispatch/synthesis
sequence — follow it precisely; it is the actual logic of this skill, kept in a
separate file so this one stays short.

## Current status (v4 — full board, engines, real deterministic scoring)

This build dispatches the **6 core-board personas plus an adaptively selected subset
of the 9 extended-board personas** (`ux-designer`, `growth-hacker`, `marketing-lead`,
`sales-lead`, `security-engineer`, `legal-compliance`, `operations`, `ai-researcher`),
always includes `future-self`, always dispatches the **Research Engine**
(`research-analyst`) in parallel, reactively dispatches the **Creative Engine**
(`lateral-thinker`) when the board finds a dead end, and now computes a **real,
deterministic Build Readiness Score** (via `founder-mode-mcp-server`) with a
persisted history — the Go/Pivot/Pause call is a computed band, not a qualitative
guess. This is the full pipeline described in `PROJECT_SPEC.md` §7.

## What to do

1. Recognize that an idea is being described (not just a small addition to existing,
   already-scoped work).
2. Follow `protocol.md` step 1 (triage) to decide: skip straight to implementation, or
   convene the board.
3. If convening the board, follow `protocol.md` step 1b to select which extended-board
   personas genuinely apply — be selective, not thorough-by-default — then steps 2–5:
   parallel dispatch of the core 6 + `future-self` + selected extended personas +
   `research-analyst`, main-thread synthesis (weaving in research findings), reactive
   `lateral-thinker` dispatch only if the board hit a genuine dead end, Build
   Readiness Scoring (step 3b — derive dimensions, save, show delta if a prior run
   exists), present, hand off.
4. Never fabricate persona output or a score yourself instead of dispatching the real
   agents/tools — the entire value of this skill is independent reasoning frames and
   a reproducible number, not one voice guessing at both.
5. Always honor an explicit user opt-out immediately, at any point in the flow.
