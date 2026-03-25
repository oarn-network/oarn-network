#!/bin/bash
# OARN PreCompact hook — runs before Claude Code auto-compresses context
# Logs the compaction event and appends current git state to the active session file

SESSION_DIR="$HOME/.claude/sessions"
DATE=$(date +%Y-%m-%d)
PROJECT_DIR="/c/Users/flori/Documents/oarn-network"

# Find today's session file (most recent match for today)
ACTIVE=$(ls -t "$SESSION_DIR/${DATE}-oarn-"*.tmp 2>/dev/null | head -1)

if [ -z "$ACTIVE" ]; then
  ACTIVE="$SESSION_DIR/${DATE}-oarn-compact.tmp"
fi

{
  echo ""
  echo "--- COMPACTION EVENT: $(date '+%H:%M') ---"
  echo "Context was compressed. Appending current state."
  echo ""

  echo "Git log:"
  cd "$PROJECT_DIR" 2>/dev/null && git log --oneline -3 2>/dev/null

  echo ""
  echo "Modified files:"
  cd "$PROJECT_DIR" 2>/dev/null && git status --short 2>/dev/null

  echo "--- END COMPACTION SNAPSHOT ---"
  echo ""
} >> "$ACTIVE" 2>&1

echo "[Hook] Pre-compact state appended → $ACTIVE" >&2
