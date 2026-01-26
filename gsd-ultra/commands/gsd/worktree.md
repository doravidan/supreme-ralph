---
name: gsd:worktree
description: Git worktree management for isolated feature development
argument-hint: "<action> [name]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Manage git worktrees for isolated feature development. Each feature gets its own worktree, preventing conflicts and enabling parallel development on multiple features.
</objective>

<execution_context>
@~/.claude/ultra/worktree/manager.js
</execution_context>

<context>
$ARGUMENTS
</context>

<actions>

## create [name]
Create a new worktree for isolated feature development.

```bash
# Creates .worktrees/[name]/ with branch gsd/[name]
git worktree add .worktrees/[name] -b gsd/[name]
```

**Process:**
1. Validate name (kebab-case, no spaces)
2. Check .worktrees/ directory exists
3. Create worktree with dedicated branch
4. Confirm creation

## list
Show all active worktrees with status.

```bash
git worktree list
```

**Shows:**
- Worktree path
- Branch name
- Commit hash
- Clean/dirty status

## status [name]
Show detailed status for a specific worktree.

**Shows:**
- Files changed
- Commits ahead of main
- Last activity

## merge [name]
Merge worktree changes back to main branch.

**Process:**
1. Verify worktree exists
2. Check for uncommitted changes
3. Checkout main branch
4. Merge worktree branch
5. Delete worktree and branch
6. Confirm success

**Options:**
- `--squash` - Squash all commits into one
- `--dry-run` - Show what would be merged without doing it

## review [name]
Review worktree changes before merging.

**Shows:**
1. Summary of all commits on the branch
2. Full diff from main
3. Files changed with stats
4. Quality gate status (if run)

## discard [name]
Abandon worktree without merging.

**Process:**
1. Verify worktree exists
2. Confirm discard (unless --force)
3. Remove worktree directory
4. Delete branch
5. Confirm removal

**Options:**
- `--force` - Skip confirmation
- `--all` - Discard all worktrees

</actions>

<process>

1. **Parse action and arguments**
   Extract action (create/list/status/merge/review/discard) and optional name/flags.

2. **Validate prerequisites**
   - Must be in a git repository
   - For create: name must be valid kebab-case
   - For merge/review/discard: worktree must exist

3. **Execute action**
   Use git worktree commands for the requested operation.

4. **Report results**
   Clear confirmation of what was done, or error with guidance.

</process>

<success_criteria>
- [ ] Action completed without git errors
- [ ] User understands result
- [ ] Worktree state is consistent
</success_criteria>

<examples>

**Create worktree:**
```
/gsd:worktree create user-auth
→ Created .worktrees/user-auth/ on branch gsd/user-auth
```

**List worktrees:**
```
/gsd:worktree list
→ .worktrees/user-auth/     gsd/user-auth   abc123f [clean]
→ .worktrees/payment-flow/  gsd/payment-flow def456g [3 uncommitted]
```

**Merge worktree:**
```
/gsd:worktree merge user-auth --squash
→ Merged gsd/user-auth into main (12 commits squashed)
→ Removed worktree and branch
```

**Discard worktree:**
```
/gsd:worktree discard payment-flow --force
→ Removed .worktrees/payment-flow/
→ Deleted branch gsd/payment-flow
```

</examples>
