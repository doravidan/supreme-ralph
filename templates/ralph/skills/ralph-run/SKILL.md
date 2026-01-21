---
name: ralph-run
description: Run RALPH autonomous development loop to implement features from the PRD.
allowed-tools: Bash, Read, Edit, Write
---

# Run RALPH

Execute the RALPH autonomous development loop to implement features from the PRD.

## Prerequisites Check

1. Verify prd.json exists:
```bash
cat prd.json
```

2. Check current status:
```bash
node scripts/run-ralph.js --status
```

## Running RALPH

Start the autonomous loop:
```bash
./scripts/ralph/ralph.sh 20
```

Or use the runner script:
```bash
node scripts/run-ralph.js 20
```

## Monitoring

- Watch `progress.txt` for iteration logs
- Check `prd.json` for story completion status
- Review git log for commits

## If Stuck

1. Check progress.txt for patterns and learnings
2. Manually fix blocking issues
3. Reset if needed: `node scripts/run-ralph.js --reset`
4. Resume: `./scripts/ralph/ralph.sh 20`
