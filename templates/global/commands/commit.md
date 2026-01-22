---
description: Create a git commit with a well-formatted message
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*), Bash(git diff:*)
argument-hint: [optional commit message override]
---

# Git Commit

Create a well-formatted git commit for the current changes.

## Context

- Git status: !`git status --short`
- Staged changes: !`git diff --cached --stat`
- Unstaged changes: !`git diff --stat`

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code restructuring without behavior change
- `test`: Adding or fixing tests
- `chore`: Maintenance tasks

### Rules
- Subject line: max 50 characters, present tense, no period
- Body: Explain what and why, not how
- Footer: Reference issues (Fixes #123, Closes #456)

## Steps

1. Review all changes (staged and unstaged)
2. Stage relevant files: `git add <files>`
3. Create commit with appropriate message
4. Show the commit result

## Custom Message

$ARGUMENTS
