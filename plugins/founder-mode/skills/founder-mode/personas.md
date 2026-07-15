# Insight — Persona Roster & Selection Reference

Personas are dispatched **explicitly** by this skill via the `Agent` tool — never left
to organic auto-delegation (see ENGINEERING_PRINCIPLES.md §2.1 for why). This file is
the single source of truth for which persona to dispatch when; the orchestration logic
in `protocol.md` references this table rather than duplicating it.

## Core board (near-always included in a full-board session)

| Persona (agent name) | Reasoning frame |
|---|---|
| `founder` | Who is this for? Why now? Unfair advantage? Venture-scale? |
| `investor` | Market size, moat, competition, timing, monetization, unit economics |
| `customer` | Why should I care? Pain, alternatives, willingness to pay |
| `product-manager` | MVP scope, roadmap, prioritization, success metrics |
| `cto-staff-engineer` | Feasibility, architecture, scalability, security posture, tech debt |
| `devils-advocate` | Assumes the idea is wrong; finds every weakness |

## Extended board (dispatched adaptively — match trigger signal to the idea)

| Persona (agent name) | Trigger signal |
|---|---|
| `ux-designer` | Consumer/prosumer-facing **and** interaction design is a primary adoption/differentiation factor — not merely "has a UI" (excludes internal/expert-operated B2B dashboards; see protocol.md Step 1b for why this is narrower than the original "has an interaction surface" wording) |
| `growth-hacker` | Consumer / viral / network-effect angle present |
| `marketing-lead` | Positioning/messaging is make-or-break (crowded category, GTM-sensitive) |
| `sales-lead` | B2B / enterprise sales motion implied |
| `security-engineer` | Handles auth, PII, or payments |
| `legal-compliance` | Regulated domain: fintech, health, data privacy, minors, or regulated physical goods/services (food safety, alcohol, controlled substances, transportation, occupational licensing) |
| `operations` | Physical/logistics/support-heavy business model |
| `ai-researcher` | Idea's core value prop is itself an AI/ML capability |
| `future-self` | Always included whenever the board is convened |

## Engine agents (not "board members," dispatched the same way)

| Agent | Role |
|---|---|
| `research-analyst` | Research Engine — competitors, market signal, sentiment via WebSearch/WebFetch |
| `lateral-thinker` | Creative Engine — pivots and cross-domain ideas; dispatch when `devils-advocate` finds a dead end or the idea is underdeveloped |
| `idea-incubator` | Evolution Engine — synthesizes one concrete revision targeting the board's stated weaknesses; dispatched by `idea-evolution`, never by `founder-mode` directly (see `skills/idea-evolution/protocol.md`) |

## Selection heuristic (current implementation: Skip vs. Board)

- **Skip the board entirely**: trivial/well-scoped request, or explicit user opt-out
  ("just build it").
- **Board**: idea implies real stakes worth challenging — core 6 + `future-self` always,
  plus whichever extended-board members match a genuine trigger signal (see table
  above). `research-analyst` dispatches in parallel with every Board session, and
  `lateral-thinker` dispatches reactively when `devils-advocate` names a dead end —
  both wired into the Board session per `protocol.md` Steps 2 and 3a (live-verified
  2026-07-15).

A separate lighter "core-only, no extended board" tier was considered in early design
but isn't implemented as a distinct path — Step 1b's signal-matching already keeps
extended-board inclusion selective per idea, which serves the same "don't be
annoying" goal without a third branch to maintain.

Full decision logic (exact triage rules, dispatch sequencing) is specified in
`protocol.md`.
