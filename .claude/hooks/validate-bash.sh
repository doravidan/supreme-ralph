#!/bin/bash
# Validate bash commands before execution
# Read JSON input from stdin
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Block dangerous commands
DANGEROUS_PATTERNS=(
  "rm -rf /"
  "rm -rf ~"
  ":(){ :|:& };:"
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qF "$pattern"; then
    echo "Blocked: Dangerous command detected" >&2
    exit 2
  fi
done

exit 0
