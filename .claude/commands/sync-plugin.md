---
description: Mirror .claude/agents and .claude/skills into plugins/founder-mode/ (source of truth -> packaged plugin)
disable-model-invocation: true
---

`.claude/agents/` and `.claude/skills/` are the source of truth; `plugins/founder-mode/
{agents,skills}/` is a mechanically generated mirror. Run this before every commit that
touches agents or skills.

Steps:

1. Mirror agents and skills (delete-on-mirror, so removed files disappear from the
   packaged copy too). Check for `rsync` first — plain Git-Bash-for-Windows installs
   often don't include it, which is the common case in this repo's dev environment:

```bash
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete .claude/agents/ plugins/founder-mode/agents/
  rsync -a --delete .claude/skills/ plugins/founder-mode/skills/
else
  rm -rf plugins/founder-mode/agents plugins/founder-mode/skills
  mkdir -p plugins/founder-mode/agents plugins/founder-mode/skills
  cp -r .claude/agents/. plugins/founder-mode/agents/
  cp -r .claude/skills/. plugins/founder-mode/skills/
fi
```

(A PowerShell fallback also works: `robocopy .claude\agents
plugins\founder-mode\agents /MIR` and the equivalent for `skills` — note `robocopy`'s
exit codes below 8 mean success, not failure.)

2. Report what changed:

```bash
git diff --name-only plugins/founder-mode/
```

3. If nothing changed, state "Plugin folder is already up to date" and stop.

4. If something changed, summarize the diff (which agents/skills were added, removed,
   or modified) and ask whether to stage and commit with message
   `"sync plugin with .claude changes"` — do not commit without confirmation.

Note: `plugins/founder-mode/servers/founder-mode-mcp-server/` is real source code with
no `.claude/`-side copy — this command never touches it.
