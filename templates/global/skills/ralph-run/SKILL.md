---
name: ralph-run
description: Run RALPH autonomous development loop - implements features from PRD
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, AskUserQuestion
---

# RALPH-RUN - Autonomous Development Execution

Execute the RALPH (Recursive Autonomous Loop for Production Harmony) development cycle to implement features from a PRD.

## Commands

| Command | Description |
|---------|-------------|
| `/ralph-run` | Start with default 10 iterations |
| `/ralph-run 20` | Start with 20 iterations |
| `/ralph-run --task "description"` | Single-task mode (no PRD needed) |

## Triggers

- `/ralph-run`
- "run RALPH"
- "start autonomous development"
- "implement the PRD"

## Critical Rules

1. **ONE TASK PER ITERATION** - Complete exactly one task, then report completion
2. **ASK QUESTIONS WHEN UNCERTAIN** - Use AskUserQuestion for ANY ambiguity
3. **QUALITY FIRST** - All quality gates must pass before marking complete
4. **FOLLOW RULES** - Rules from .ralph/config.yaml are mandatory
5. **RESPECT BOUNDARIES** - Never modify files in the boundaries list
6. **LOG LEARNINGS** - Document patterns for future iterations
7. **CLEAN COMMITS** - Write descriptive commit messages

## PRD Loop Mode

### Prerequisites Check

Before starting, verify these files exist:

```bash
# Check for PRD (supports multiple formats)
if [ -f prd.json ]; then
  echo "✓ Found prd.json"
  REMAINING=$(cat prd.json | jq '[.userStories[] | select(.passes == false)] | length')
  echo "  $REMAINING stories remaining"
elif [ -f PRD.md ]; then
  echo "✓ Found PRD.md"
  REMAINING=$(grep -c '^\s*- \[ \]' PRD.md || echo "0")
  echo "  $REMAINING tasks remaining"
elif [ -f tasks.yaml ]; then
  echo "✓ Found tasks.yaml"
else
  echo "❌ No PRD found"
  echo "Run /prd [feature] or /setup-project first"
  exit 1
fi

# Check for PROJECT_SPEC.md (recommended)
if [ -f PROJECT_SPEC.md ]; then
  echo "✓ Found PROJECT_SPEC.md"
else
  echo "⚠ PROJECT_SPEC.md not found (recommended)"
  echo "  Run /setup-project to generate it"
fi

# Check for .ralph/config.yaml
if [ -f .ralph/config.yaml ]; then
  echo "✓ Found .ralph/config.yaml"
else
  echo "⚠ .ralph/config.yaml not found"
  echo "  Run /setup-project to generate it"
fi

# Check git status
echo ""
echo "=== Git Status ==="
git status --short
```

### Execution Flow

For each iteration:

#### Step 1: Read Context

```bash
# Read PRD
cat prd.json

# Read project specification
cat PROJECT_SPEC.md 2>/dev/null || echo "No spec found"

# Read progress from previous iterations
cat .ralph/progress.txt 2>/dev/null || echo "No progress yet"

# Read configuration (rules, boundaries, commands)
cat .ralph/config.yaml 2>/dev/null || echo "No config"

# Check git history for context
git log --oneline -10
```

#### Step 2: Select Task

Pick the HIGHEST PRIORITY task where completion status is false:

```bash
# Get next task (JSON format)
cat prd.json | jq -r '
  .userStories
  | map(select(.passes == false))
  | sort_by(.priority)
  | .[0]
  | "Task: \(.id) - \(.title)\nPriority: \(.priority)\nDescription: \(.description)\nAcceptance Criteria:\n\(.acceptanceCriteria | map("  - " + .) | join("\n"))"
'
```

Display to user:

```
╔════════════════════════════════════════════════════════════════╗
║                    Starting RALPH Iteration                     ║
╚════════════════════════════════════════════════════════════════╝

📋 Task: US-001 - Create User model and auth types
   Priority: 1

   Description:
   Define TypeScript interfaces for User, Session, and auth tokens

   Acceptance Criteria:
   - User interface with id, email, passwordHash, createdAt
   - Session interface with userId, token, expiresAt
   - Types exported from src/types/auth.ts
   - Type checking passes
```

#### Step 3: Clarify Requirements (CRITICAL)

**BEFORE implementing, review the task requirements. If ANYTHING is unclear, use AskUserQuestion:**

Use AskUserQuestion when you encounter:
- Multiple valid implementation approaches
- Unclear acceptance criteria
- Missing technical specifications
- Edge cases not covered in requirements
- Design decisions that could affect future tasks
- Technology choices not specified in the task

**Example questions to ask:**

```
? Should I use a specific library for password hashing?
  ○ bcrypt (Recommended)
  ○ argon2
  ○ scrypt
  ○ Let me specify

? Where should the User model be stored?
  ○ src/models/User.ts (Recommended)
  ○ src/types/user.ts
  ○ src/entities/User.ts
  ○ Let me specify
```

**DO NOT GUESS** on important decisions - asking takes seconds, rework takes iterations.

#### Step 4: Implement

Once requirements are clear, write clean, production-ready code following:

1. **Patterns from PROJECT_SPEC.md** - Match existing code style
2. **Rules from .ralph/config.yaml** - Mandatory guidelines
3. **Learnings from .ralph/progress.txt** - Avoid past mistakes
4. **ALL acceptance criteria** - Must satisfy every criterion

**Implementation guidelines:**
- Write tests alongside implementation
- Follow existing naming conventions
- Use proper error handling
- Add appropriate comments (why, not what)
- Keep functions small and focused

#### Step 5: Quality Gates

Run ALL configured quality commands - they must ALL pass:

```bash
# Read commands from config
TEST_CMD=$(cat .ralph/config.yaml | grep 'test:' | cut -d'"' -f2)
LINT_CMD=$(cat .ralph/config.yaml | grep 'lint:' | cut -d'"' -f2)
TYPECHECK_CMD=$(cat .ralph/config.yaml | grep 'typecheck:' | cut -d'"' -f2)

# Run each command
echo "Running quality gates..."

if [ -n "$TYPECHECK_CMD" ]; then
  echo "▶ Typecheck: $TYPECHECK_CMD"
  $TYPECHECK_CMD
fi

if [ -n "$LINT_CMD" ]; then
  echo "▶ Lint: $LINT_CMD"
  $LINT_CMD
fi

if [ -n "$TEST_CMD" ]; then
  echo "▶ Test: $TEST_CMD"
  $TEST_CMD
fi
```

**If any check fails:**
1. Fix the issues
2. Re-run the failing check
3. Continue only when ALL pass

#### Step 6: Commit

```bash
git add -A
git commit -m "feat: [TASK-ID] - [Task Title]

- Brief description of changes
- Files affected

Acceptance criteria met:
- [List satisfied criteria]

Co-Authored-By: RALPH <noreply@anthropic.com>"
```

Example:
```bash
git commit -m "feat: US-001 - Create User model and auth types

- Created User and Session interfaces
- Added token type definitions
- Exported all types from src/types/auth.ts

Acceptance criteria met:
- User interface with id, email, passwordHash, createdAt ✓
- Session interface with userId, token, expiresAt ✓
- Types exported from src/types/auth.ts ✓
- Type checking passes ✓

Co-Authored-By: RALPH <noreply@anthropic.com>"
```

#### Step 7: Update PRD

Mark the completed task:

**JSON format (prd.json):**
```bash
# Update the specific story to passes: true
cat prd.json | jq '(.userStories[] | select(.id == "US-001")).passes = true' > prd.json.tmp
mv prd.json.tmp prd.json
```

**Markdown format (PRD.md):**
Change `- [ ]` to `- [x]` for the completed task

**YAML format (tasks.yaml):**
Set `completed: true` for the task

#### Step 8: Log Progress

Append to `.ralph/progress.txt`:

```markdown
## [Date] - [TASK-ID]: [Task Title]

**What was implemented:**
- [Description of implementation]

**Files changed:**
- [list of files]

**Learnings for future iterations:**
- [Patterns discovered]
- [Gotchas to avoid]
- [Conventions learned]

---
```

#### Step 9: Compact Context

**After each story completion, compact the context to maintain fresh context for the next iteration:**

```bash
# Read compact settings from config
COMPACT_ENABLED=$(cat .ralph/config.yaml | grep 'compact_after_each_story:' | awk '{print $2}')
COMPACT_THRESHOLD=$(cat .ralph/config.yaml | grep 'compact_threshold:' | awk '{print $2}')

if [ "$COMPACT_ENABLED" = "true" ]; then
  echo "📦 Compacting context for next iteration..."
fi
```

When `compact_after_each_story: true` is set in config:
1. **Summarize the iteration** - What was done, key files changed
2. **Preserve learnings** - Keep patterns from .ralph/progress.txt
3. **Clear implementation details** - Release memory of code exploration
4. **Retain PRD state** - Keep track of remaining stories

This ensures each iteration starts with fresh context while preserving critical information.

#### Step 10: Check Completion

```bash
# Check if all stories are complete
REMAINING=$(cat prd.json | jq '[.userStories[] | select(.passes == false)] | length')

if [ "$REMAINING" -eq 0 ]; then
  echo "<promise>COMPLETE</promise>"
else
  echo "Iteration complete. $REMAINING stories remaining."
fi
```

**If ALL tasks complete:** Output `<promise>COMPLETE</promise>`

**Otherwise:** Report completion and wait for next iteration

## Single-Task Mode

For `/ralph-run --task "description"`:

```
╔════════════════════════════════════════════════════════════════╗
║                   Single-Task Mode                              ║
╚════════════════════════════════════════════════════════════════╝

Task: [user-provided description]

This mode executes a single task without a PRD.
```

1. **No PRD required** - Task comes from command argument
2. **Use AskUserQuestion** for any clarifications
3. **Follow quality gates** - Still run all checks
4. **Commit when complete** - Standard commit format

Example:
```
/ralph-run --task "Add dark mode toggle to settings page"
```

Process:
1. Analyze task description
2. Ask clarifying questions if needed
3. Implement the feature
4. Run quality gates
5. Commit with descriptive message

## Output Formats

### Iteration Start

```
╔════════════════════════════════════════════════════════════════╗
║                Starting RALPH Iteration 1/10                    ║
╚════════════════════════════════════════════════════════════════╝

PRD: User Authentication
Stories: 6 total, 0 complete

📋 Current Task: US-001 - Create User model and auth types
   Priority: 1
```

### Iteration Complete

```
╔════════════════════════════════════════════════════════════════╗
║                 Iteration 1/10 Complete                         ║
╚════════════════════════════════════════════════════════════════╝

✓ Implemented: US-001 - Create User model and auth types
✓ Quality gates passed
✓ Committed: abc1234
✓ PRD updated
✓ Context compacted (threshold: 60%)

Progress: 1/6 stories (17% complete)
Remaining: 5 stories
```

### All Complete

```
╔════════════════════════════════════════════════════════════════╗
║                     RALPH Complete!                             ║
╚════════════════════════════════════════════════════════════════╝

<promise>COMPLETE</promise>

Project: User Authentication
Stories: 6/6 complete (100%)

Commits:
  abc1234 feat: US-001 - Create User model and auth types
  def5678 feat: US-002 - Implement password hashing service
  ghi9012 feat: US-003 - Create JWT token utilities
  jkl3456 feat: US-004 - Add login and register routes
  mno7890 feat: US-005 - Implement auth middleware
  pqr1234 feat: US-006 - Add logout and session management

Next Steps:
  1. Review the implementation: git diff main..HEAD
  2. Run full test suite: npm test
  3. Create PR: gh pr create --base main
```

## Error Recovery

| Error | Action |
|-------|--------|
| Quality gate fails | Fix issues, re-run check |
| Unclear requirements | Use AskUserQuestion |
| Cannot complete task | Ask user for help or skip |
| Git conflict | Resolve and retry commit |
| Test fails | Fix test or implementation |

## Tips

- **Ask questions early** - It's faster than rework
- **Commit often** - Each task = one commit
- **Log learnings** - Help future iterations
- **Follow patterns** - Consistency matters
- **Quality first** - Never skip gates
