#!/bin/bash
#
# RALPH - Autonomous AI Development Loop
# Based on Geoffrey Huntley's "Ralph pattern"
#
# Usage:
#   ./ralph.sh [max_iterations]
#   ./ralph.sh 20          # Run up to 20 iterations
#
# Requirements:
#   - Claude Code CLI installed and authenticated
#   - jq installed (brew install jq / apt install jq)
#   - Git repository initialized
#   - prd.json with user stories
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
MAX_ITERATIONS="${1:-10}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging
log_info() { echo -e "${BLUE}[RALPH]${NC} $1"; }
log_success() { echo -e "${GREEN}[RALPH]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[RALPH]${NC} $1"; }
log_error() { echo -e "${RED}[RALPH]${NC} $1"; }

# Check dependencies
check_dependencies() {
    local missing=()

    if ! command -v claude &> /dev/null; then
        missing+=("claude (npm install -g @anthropic-ai/claude-code)")
    fi

    if ! command -v jq &> /dev/null; then
        missing+=("jq (brew install jq / apt install jq)")
    fi

    if ! command -v git &> /dev/null; then
        missing+=("git")
    fi

    if [ ${#missing[@]} -gt 0 ]; then
        log_error "Missing dependencies:"
        for dep in "${missing[@]}"; do
            echo "  - $dep"
        done
        exit 1
    fi
}

# Check if PRD exists
check_prd() {
    if [ ! -f "$PROJECT_DIR/prd.json" ]; then
        log_error "No prd.json found in project root."
        echo ""
        echo "Create a PRD first using the /prd skill:"
        echo "  1. Open Claude Code: claude"
        echo "  2. Run: /prd Create a PRD for [your feature]"
        echo "  3. Run: /ralph-convert Convert [prd-file.md] to prd.json"
        exit 1
    fi
}

# Archive previous run if branch changed
archive_if_needed() {
    local current_branch
    current_branch=$(jq -r '.branchName' "$PROJECT_DIR/prd.json" 2>/dev/null || echo "")

    if [ -f "$SCRIPT_DIR/.last-branch" ]; then
        local last_branch
        last_branch=$(cat "$SCRIPT_DIR/.last-branch")

        if [ "$current_branch" != "$last_branch" ] && [ -f "$PROJECT_DIR/progress.txt" ]; then
            local archive_dir="$PROJECT_DIR/archive/$(date +%Y-%m-%d)-${last_branch//\//-}"
            mkdir -p "$archive_dir"

            log_info "Archiving previous run to $archive_dir"
            cp "$PROJECT_DIR/prd.json" "$archive_dir/" 2>/dev/null || true
            cp "$PROJECT_DIR/progress.txt" "$archive_dir/" 2>/dev/null || true

            # Reset progress for new feature
            echo "# Progress Log - $current_branch" > "$PROJECT_DIR/progress.txt"
            echo "" >> "$PROJECT_DIR/progress.txt"
            echo "## Codebase Patterns" >> "$PROJECT_DIR/progress.txt"
            echo "(Patterns will be added as they are discovered)" >> "$PROJECT_DIR/progress.txt"
            echo "" >> "$PROJECT_DIR/progress.txt"
            echo "---" >> "$PROJECT_DIR/progress.txt"
            echo "" >> "$PROJECT_DIR/progress.txt"
        fi
    fi

    echo "$current_branch" > "$SCRIPT_DIR/.last-branch"
}

# Count remaining stories
count_remaining() {
    jq '[.userStories[] | select(.passes == false)] | length' "$PROJECT_DIR/prd.json" 2>/dev/null || echo "0"
}

# Get current story info
get_current_story() {
    jq -r '.userStories[] | select(.passes == false) | "\(.id): \(.title)"' "$PROJECT_DIR/prd.json" 2>/dev/null | head -1
}

# Print summary
print_summary() {
    local total
    local complete
    local remaining

    total=$(jq '.userStories | length' "$PROJECT_DIR/prd.json" 2>/dev/null || echo "0")
    complete=$(jq '[.userStories[] | select(.passes == true)] | length' "$PROJECT_DIR/prd.json" 2>/dev/null || echo "0")
    remaining=$(jq '[.userStories[] | select(.passes == false)] | length' "$PROJECT_DIR/prd.json" 2>/dev/null || echo "0")

    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  RALPH Summary${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo -e "  Stories: ${GREEN}$complete${NC}/${total} complete, ${YELLOW}$remaining${NC} remaining"
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Main loop
main() {
    log_info "Starting RALPH autonomous development loop"
    log_info "Max iterations: $MAX_ITERATIONS"
    echo ""

    check_dependencies
    check_prd
    archive_if_needed

    cd "$PROJECT_DIR"

    local iteration=0
    local remaining

    remaining=$(count_remaining)

    if [ "$remaining" -eq 0 ]; then
        log_success "All stories already complete!"
        print_summary
        exit 0
    fi

    log_info "Starting with $remaining stories remaining"

    while [ $iteration -lt $MAX_ITERATIONS ]; do
        iteration=$((iteration + 1))
        remaining=$(count_remaining)

        if [ "$remaining" -eq 0 ]; then
            log_success "All stories complete!"
            break
        fi

        local story
        story=$(get_current_story)

        echo ""
        echo -e "${CYAN}────────────────────────────────────────────────────────────${NC}"
        echo -e "${CYAN}  Iteration $iteration/$MAX_ITERATIONS${NC}"
        echo -e "${CYAN}  Story: $story${NC}"
        echo -e "${CYAN}  Remaining: $remaining stories${NC}"
        echo -e "${CYAN}────────────────────────────────────────────────────────────${NC}"
        echo ""

        # Run Claude Code with the RALPH prompt
        local OUTPUT
        OUTPUT=$(claude --dangerously-skip-permissions --print < "$SCRIPT_DIR/CLAUDE.md" 2>&1 | tee /dev/stderr) || true

        # Check for completion signal
        if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
            log_success "RALPH received COMPLETE signal"
            break
        fi

        # Brief pause between iterations
        sleep 2
    done

    print_summary

    remaining=$(count_remaining)
    if [ "$remaining" -eq 0 ]; then
        log_success "All stories implemented successfully!"
        exit 0
    else
        log_warn "Stopped with $remaining stories remaining"
        log_info "Run again to continue: ./ralph.sh $MAX_ITERATIONS"
        exit 0
    fi
}

main "$@"
