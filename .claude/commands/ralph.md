---
description: Run RALPH autonomous development loop
allowed-tools: Bash
---

# RALPH - Autonomous Development Agent

Run the RALPH autonomous agent loop to implement features from a PRD.

## Prerequisites

1. Create a PRD using the /prd skill:
   `/prd Create a PRD for [your feature]`

2. Convert to prd.json using the /ralph skill:
   `/ralph-convert tasks/prd-[feature].md`

3. Run RALPH:
   `./scripts/ralph/ralph.sh [max_iterations]`

## How It Works

RALPH:
1. Reads prd.json and picks the highest priority incomplete story
2. Implements ONLY that story
3. Runs quality checks (typecheck, lint, tests)
4. Commits if all checks pass
5. Marks the story complete
6. Repeats until all stories are done

## Commands

- `./scripts/ralph/ralph.sh 20` - Run up to 20 iterations
- Check `progress.txt` for logs and patterns
- Check `prd.json` for story status
