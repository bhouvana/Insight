# Privacy Policy — Insight

Insight is a Claude Code plugin. It has no servers, no accounts, and no analytics of
its own. This document covers the two places data actually moves.

## What Insight stores

When you run a board session, Insight persists a record of the idea under evaluation
to `${CLAUDE_PLUGIN_DATA}/sessions/<idea-slug>.json` — a plain JSON file on your own
machine. Each record contains: the idea summary you gave it, the 10 Build Readiness
dimension scores, a one-line rationale per dimension, and a timestamped history of
re-scores if you run the Idea Evolution Engine.

This file:
- Never leaves your machine. Insight has no server to send it to.
- Is not read by any code other than the bundled MCP server (`founder-mode-mcp-server`),
  which only reads/writes it in response to a tool call made during your session.
- May contain a description of an unshipped business idea — treat it with the same
  care you'd treat any local project file, since Insight itself does not encrypt or
  restrict it beyond your OS's normal file permissions.

## What leaves your machine

Using Insight means using Claude Code, so the idea and conversation content you share
is processed by the Claude model the same way any Claude Code conversation is —
that's Anthropic's own infrastructure and terms, not something Insight adds on top.

Separately, the Research Engine (`research-analyst`) issues web searches via Claude
Code's built-in `WebSearch`/`WebFetch` tools to gather competitor and market
information relevant to the idea you're evaluating. Those search queries leave your
machine through Claude Code's own search capability, the same as any other skill that
uses `WebSearch`. Insight does not call any search API, analytics service, or
third-party endpoint of its own — it has no network code at all outside those two
built-in Claude Code tools.

## What Insight does not do

- No telemetry, no usage analytics, no crash reporting.
- No accounts, no API keys required, no third-party SDKs.
- No data is sold, shared, or used to train anything by this plugin.

## Contact

Questions about this policy: bhouvana@gmail.com
