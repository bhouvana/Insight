#!/usr/bin/env bash
# Blocks a git commit if plugins/founder-mode/{agents,skills} is out of sync with
# the .claude/{agents,skills} source of truth (i.e. /sync-plugin hasn't been run).
out="$(diff -rq .claude/agents plugins/founder-mode/agents 2>&1; diff -rq .claude/skills plugins/founder-mode/skills 2>&1)"
if [ -n "$out" ]; then
  reason=$(printf '%s' "$out" | tr '\n' ' ' | sed 's/"/\\"/g')
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"plugins/founder-mode mirror is out of sync with .claude agents/skills - run /sync-plugin before committing. %s"}}\n' "$reason"
else
  printf '{}\n'
fi
