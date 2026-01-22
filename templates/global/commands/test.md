---
description: Run tests and analyze/fix failures
allowed-tools: Bash(npm test:*), Bash(npm:*), Bash(npx:*), Read, Edit, Grep
---

# Run Tests

Execute the test suite and handle any failures.

## Steps

1. Run the test suite: `npm test`
2. Analyze the output
3. For failures:
   - Identify the root cause
   - Propose a minimal fix
   - Implement if straightforward
   - Verify the fix

## If Tests Pass

- Report success with coverage summary if available
- Note any skipped tests

## If Tests Fail

For each failure:
1. **Identify**: Which test failed and what it tests
2. **Diagnose**: Why did it fail (expected vs actual)
3. **Locate**: Find the relevant code
4. **Fix**: Implement the minimal fix
5. **Verify**: Re-run to confirm fix

## Arguments

$ARGUMENTS
