---
description: Bump the founder-mode plugin version and record a changelog entry in CLAUDE.md
disable-model-invocation: true
---

Release protocol for `founder-mode`. Follow in order:

1. Run `/sync-plugin` first (or confirm it's already clean) and check
   `git status`/`git diff` scoped to `plugins/founder-mode/` and its `.mcp.json` —
   only changes under `plugins/founder-mode/{agents,skills,.mcp.json,servers}` count
   as version-bump-worthy. If nothing changed there, stop and say so.

2. Ask the user for the new version number and a one-line changelog description.

3. Confirm the semver bump type matches the actual change, and flag a mismatch before
   continuing:

   | Change | Bump |
   |---|---|
   | Doc/wording only | patch |
   | New or updated persona/skill | minor |
   | New/changed MCP server tool | minor |
   | Session/score-format change breaking existing saved sessions | major |
   | Persona or MCP tool removed | major |

4. Edit `plugins/founder-mode/.claude-plugin/plugin.json`'s `version` field.

5. Prepend a new entry to the `## Version History` section of `CLAUDE.md`:

```
### {{version}} — {{date}}
- {{Breaking changes | Added | Fixed | Removed}}: {{description}}
```

6. Report a summary and remind the user this only stages local changes — it does not
   run `git add`/`commit`/`push` itself; confirm before doing any of those.
