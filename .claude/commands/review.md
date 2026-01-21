---
description: Review code for quality, security, and best practices
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Bash(git log:*)
---

# Code Review

Review the specified code or recent changes for quality and best practices.

## Context

- Current git status: !`git status --short`
- Recent changes: !`git diff HEAD~1 --stat`

## Review Checklist

### 1. Code Quality
- [ ] Code is readable and well-organized
- [ ] Functions are small and focused
- [ ] Variable and function names are descriptive
- [ ] No unnecessary complexity

### 2. Security
- [ ] No hardcoded secrets or credentials
- [ ] Input validation is present
- [ ] No SQL injection vulnerabilities
- [ ] Proper error handling (no sensitive data in errors)

### 3. Performance
- [ ] No obvious performance issues
- [ ] Appropriate data structures used
- [ ] No unnecessary loops or iterations

### 4. Testing
- [ ] Tests are present for new code
- [ ] Edge cases are covered
- [ ] Tests are meaningful and not trivial

### 5. Best Practices
- [ ] Follows project conventions
- [ ] Proper error handling
- [ ] No deprecated APIs used

## Output Format

Organize feedback by priority:
- **Critical**: Must fix before merge
- **Warning**: Should address
- **Suggestion**: Nice to have improvements

Include specific line references and fix suggestions.

## Target

$ARGUMENTS
