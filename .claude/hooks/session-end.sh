#!/bin/bash
# OARN Stop hook — runs at end of every Claude Code session
# Saves git state snapshot to ~/.claude/sessions/YYYY-MM-DD-oarn.tmp

SESSION_DIR="$HOME/.claude/sessions"
DATE=$(date +%Y-%m-%d)
TIME=$(date +%H-%M)
OUT="$SESSION_DIR/${DATE}-oarn-${TIME}.tmp"

mkdir -p "$SESSION_DIR"

PROJECT_DIR="/c/Users/flori/Documents/oarn-network"

{
  echo "=== OARN SESSION SNAPSHOT ==="
  echo "Date: $(date '+%Y-%m-%d %H:%M')"
  echo ""

  echo "--- Git State ---"
  cd "$PROJECT_DIR" 2>/dev/null && git log --oneline -5 2>/dev/null || echo "(git unavailable)"
  echo ""

  echo "--- Modified Files ---"
  cd "$PROJECT_DIR" 2>/dev/null && git status --short 2>/dev/null || echo "(none)"
  echo ""

  echo "--- Submodule Status ---"
  cd "$PROJECT_DIR" 2>/dev/null && git submodule status 2>/dev/null || echo "(none)"
  echo ""

  echo "--- Recent Completed Tasks ---"
  cd "$PROJECT_DIR" 2>/dev/null && grep -A1 "Done (2026" LAST_TASKS.md 2>/dev/null | tail -20 || echo "(LAST_TASKS.md not found)"
  echo ""

  echo "--- Deployment Addresses ---"
  cat "$PROJECT_DIR/oarn-contracts/deployment-addresses.json" 2>/dev/null || echo "(not found)"
  echo ""

  echo "--- Console.log Sweep (production files) ---"
  CONSOLE_HITS=$(grep -rn 'console\.log' \
    "$PROJECT_DIR/oarn-dashboard/src" \
    "$PROJECT_DIR/oarn-sdk/src" \
    2>/dev/null | grep -v '\.test\.' | grep -v 'node_modules')
  if [ -n "$CONSOLE_HITS" ]; then
    echo "WARNING: console.log found in production code:"
    echo "$CONSOLE_HITS"
  else
    echo "Clean — no console.log in production code"
  fi
  echo ""

  echo "--- Uncommitted Changes Warning ---"
  cd "$PROJECT_DIR" 2>/dev/null
  DIRTY=$(git status --short 2>/dev/null | grep -v '^\?\?' | head -10)
  if [ -n "$DIRTY" ]; then
    echo "WARNING: uncommitted changes exist:"
    echo "$DIRTY"
  else
    echo "Clean — nothing uncommitted"
  fi
  echo ""

  echo "=== END SNAPSHOT ==="
} > "$OUT" 2>&1

# Keep only last 14 session files to avoid accumulation
ls -t "$SESSION_DIR"/*.tmp 2>/dev/null | tail -n +15 | xargs rm -f 2>/dev/null

echo "[Hook] Session saved → $OUT" >&2
