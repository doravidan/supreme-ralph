---
agent: 'agent'
description: 'Debug issues in the selected code'
---

Help debug the following issue in the selected code:

**Problem description:** ${input:problem:describe the error or unexpected behavior}

## Debugging Process

1. **Understand the Problem**
   - What is the expected behavior?
   - What is the actual behavior?
   - Is there an error message? What does it say?

2. **Analyze the Code**
   - Trace the execution flow
   - Identify potential failure points
   - Check for common bugs:
     - Null/undefined access
     - Type mismatches
     - Off-by-one errors
     - Race conditions
     - Missing error handling
     - Incorrect logic/conditions

3. **Investigate Dependencies**
   - Are all imports correct?
   - Are dependencies at expected versions?
   - Is configuration correct?

4. **Root Cause Analysis**
   - What is the actual cause of the bug?
   - Why does this bug exist?
   - Are there related bugs?

## Output Format

Provide:

1. **Diagnosis**
   - Root cause of the issue
   - Why it's happening

2. **Solution**
   - Fixed code with explanation
   - Why this fix works

3. **Prevention**
   - How to prevent similar bugs
   - Suggested tests to add

4. **Debugging Tips** (if applicable)
   - How to reproduce
   - Useful breakpoints
   - Logging to add
