---
description: Review code for quality, best practices, and potential issues
allowed-tools: Read, Grep, Glob, Bash(git diff:*)
---

# Code Review

Review the specified code or recent changes for quality and best practices.

## What to Review

If a specific file is mentioned, review that file. Otherwise, review recent changes:
```bash
git diff HEAD~1
```

## Review Checklist

### 1. Code Quality
- [ ] Code is readable and self-documenting
- [ ] Functions are small and focused (single responsibility)
- [ ] Variable and function names are descriptive
- [ ] No duplicate code (DRY principle)
- [ ] Proper use of ES6 modules

### 2. JavaScript/Node.js Patterns
- [ ] Using `async`/`await` instead of raw Promises
- [ ] Using `fs-extra` for file operations
- [ ] Using `chalk` for terminal output
- [ ] Using `ora` for spinners
- [ ] Proper error handling with try/catch

### 3. Security
- [ ] No hardcoded secrets or API keys
- [ ] Input validation for user-provided data
- [ ] Path traversal prevention
- [ ] Safe command execution (no shell injection)

### 4. Error Handling
- [ ] All async operations have error handling
- [ ] User-friendly error messages
- [ ] Proper exit codes on failure

### 5. Template System
- [ ] Template variables use `{{variable}}` syntax
- [ ] Conditional blocks properly closed `{{#if}}...{{/if}}`
- [ ] Variables documented in template comments

## Output Format

Organize feedback by priority:

### 🔴 Critical (Must Fix)
- Security vulnerabilities
- Bugs that break functionality

### 🟡 Warning (Should Fix)
- Code smells
- Potential issues
- Missing error handling

### 🟢 Suggestion (Consider)
- Performance improvements
- Code style enhancements
- Refactoring opportunities

Include specific line references and code examples for fixes.
