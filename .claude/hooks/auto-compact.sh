#!/bin/bash

# Auto-Compact Hook Script
# Monitors context usage and warns when threshold is reached.
# Runs after each Claude response (Stop hook) to check context size.

set -e

# Configuration (can be overridden via environment)
COMPACT_THRESHOLD="${COMPACT_THRESHOLD:-70}"
MAX_CONTEXT_TOKENS="${MAX_CONTEXT_TOKENS:-200000}"
CHARS_PER_TOKEN=4

# State file location
if [[ -n "$USERPROFILE" ]]; then
  STATE_DIR="$USERPROFILE/.claude"
else
  STATE_DIR="$HOME/.claude"
fi
STATE_FILE="$STATE_DIR/auto-compact-state.json"

# Read JSON input from stdin
INPUT=$(cat)

# Extract transcript_path from input
TRANSCRIPT_PATH=$(echo "$INPUT" | grep -o '"transcript_path"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*: *"\([^"]*\)".*/\1/' 2>/dev/null || echo "")
SESSION_ID=$(echo "$INPUT" | grep -o '"session_id"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*: *"\([^"]*\)".*/\1/' 2>/dev/null || echo "unknown")

# If no transcript path found, exit
if [[ -z "$TRANSCRIPT_PATH" ]] || [[ ! -f "$TRANSCRIPT_PATH" ]]; then
  exit 0
fi

# Get file size in bytes
if [[ -f "$TRANSCRIPT_PATH" ]]; then
  FILE_SIZE=$(stat -c%s "$TRANSCRIPT_PATH" 2>/dev/null || stat -f%z "$TRANSCRIPT_PATH" 2>/dev/null || echo "0")
else
  FILE_SIZE=0
fi

# Estimate tokens (file size / chars per token)
ESTIMATED_TOKENS=$((FILE_SIZE / CHARS_PER_TOKEN))

# Calculate usage percentage
USAGE_PERCENT=$((ESTIMATED_TOKENS * 100 / MAX_CONTEXT_TOKENS))

# Debug output (if enabled)
if [[ "$CLAUDE_AUTO_COMPACT_DEBUG" == "1" ]]; then
  echo "[auto-compact] Tokens: ~$ESTIMATED_TOKENS | Usage: ${USAGE_PERCENT}% | Threshold: ${COMPACT_THRESHOLD}%" >&2
fi

# Load last suggestion time from state file
LAST_SUGGESTION=0
if [[ -f "$STATE_FILE" ]]; then
  LAST_SUGGESTION=$(grep -o '"lastCompactSuggestion"[[:space:]]*:[[:space:]]*[0-9]*' "$STATE_FILE" | sed 's/.*: *//' 2>/dev/null || echo "0")
fi

# Current time in milliseconds
CURRENT_TIME=$(($(date +%s) * 1000))

# Cooldown: 5 minutes in milliseconds
COOLDOWN=$((5 * 60 * 1000))

# Check if we recently suggested
TIME_SINCE_LAST=$((CURRENT_TIME - LAST_SUGGESTION))

# If usage exceeds threshold and cooldown has passed
if [[ $USAGE_PERCENT -ge $COMPACT_THRESHOLD ]] && [[ $TIME_SINCE_LAST -gt $COOLDOWN ]]; then
  # Update state
  mkdir -p "$STATE_DIR"
  echo "{\"lastCompactSuggestion\": $CURRENT_TIME, \"sessionId\": \"$SESSION_ID\"}" > "$STATE_FILE"

  # Show warning to user
  echo "" >&2
  echo "⚠️  Context usage at ${USAGE_PERCENT}% (threshold: ${COMPACT_THRESHOLD}%)" >&2
  echo "   Consider running /compact to free up context space." >&2
  echo "" >&2
fi

# Always exit successfully (don't block)
exit 0
