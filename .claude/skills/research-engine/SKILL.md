---
name: research-engine
description: Gathers and synthesizes competitor, market, and sentiment research for an idea using web search. Standalone-invocable, and used internally by founder-mode.
argument-hint: [idea or topic to research]
---

# Research Engine

Thin wrapper: gather minimal context on the idea/topic given in `$ARGUMENTS`, then
delegate to the `research-analyst` agent to produce a synthesized competitor/market/
sentiment summary (never a raw search-result dump — see the agent's own output
format). This skill is standalone-invocable on its own, and is also dispatched by
`founder-mode` in parallel with the persona board (see `protocol.md` Step 2b) — it
does not duplicate the research-analyst's own reasoning, just triggers it.
