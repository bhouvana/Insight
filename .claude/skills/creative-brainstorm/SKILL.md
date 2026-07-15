---
name: creative-brainstorm
description: Generates lateral pivots, cross-domain analogues, and business-model variants for an idea. Standalone-invocable, and used internally by founder-mode when the board is cornered.
argument-hint: [idea to brainstorm around]
---

# Creative Brainstorm

Thin wrapper: delegate to the `lateral-thinker` agent with the idea in `$ARGUMENTS`,
asking for pivots, cross-domain analogues, business-model variants, and one
seriously-considered "crazy" idea. This skill is standalone-invocable on its own, and
is also dispatched reactively by `founder-mode` when `devils-advocate` finds a dead
end (see `protocol.md` Step 3a) — it does not duplicate the lateral-thinker's own
reasoning, just triggers it, passing along the specific dead end to escape.
