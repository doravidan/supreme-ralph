# Supreme GSD Integration Plan

## Executive Summary

**Get Shit Done (GSD)** is a superior context engineering and spec-driven development system. After deep analysis, the recommendation is to **adopt GSD as the core** and **remove most of supreme-ralph**, keeping only what GSD lacks or where RALPH excels.

### The Reality Check

| Aspect | GSD | Supreme-RALPH |
|--------|-----|---------------|
| **Maturity** | v1.9.13, battle-tested, community | v3.0, experimental |
| **Philosophy** | Context engineering, plans-as-prompts | Multi-agent orchestration |
| **Distribution** | npm package, zero deps | npm + node scripts |
| **Workflow** | discuss → plan → execute → verify | PRD → planner → coder → QA |
| **State Management** | .planning/ directory with rich artifacts | .ralph/ with prd.json |
| **User Experience** | "Just works", complexity hidden | More manual, visible machinery |

**Verdict**: GSD solves the same problems better. RALPH's multi-agent approach adds complexity without proportional benefit.

---

## What GSD Does Better (Remove from RALPH)

### 1. Project Initialization
- **GSD**: `/gsd:new-project` - deep questioning, research phase, requirements extraction, roadmap creation
- **RALPH**: `/setup-project` - generates PROJECT_SPEC.md, basic config

**Remove**: `setup-project` skill, `project-analyzer.js`, `spec-generator.js`

### 2. Planning System
- **GSD**: Plans ARE prompts (XML), 2-3 atomic tasks, fresh context per executor
- **RALPH**: `implementation_plan.json`, multi-step subtask decomposition

**Remove**: `ralph-plan` skill, planner agent complexity

### 3. Execution System
- **GSD**: Wave-based parallel execution, fresh 200k context per plan
- **RALPH**: Coder agent with subagent spawning

**Remove**: Multi-agent pipeline (planner → coder → qa → fixer), complexity classifier

### 4. Verification
- **GSD**: `/gsd:verify-work` - conversational UAT, debug agents, auto-fix plans
- **RALPH**: QA loop with max attempts, escalation

**Remove**: `qa-loop.js`, `qa-reviewer.md`, `qa-fixer.md`

### 5. State Management
- **GSD**: PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, config.json
- **RALPH**: prd.json, progress.txt, memory/

**Remove**: PRD-centric workflow, prd-validator.js

### 6. Session Management
- **GSD**: `/gsd:pause-work`, `/gsd:resume-work`
- **RALPH**: intervention-manager.js, ralph-pause/resume/rollback

**Remove**: Intervention system

### 7. Quick Tasks
- **GSD**: `/gsd:quick` - same guarantees, faster path
- **RALPH**: No equivalent (forces full PRD workflow)

**Remove**: N/A (RALPH lacks this)

---

## What RALPH Has That GSD Lacks (Keep/Integrate)

### 1. Git Worktree Isolation ✓
- **RALPH**: `.worktrees/` directory, isolated development per feature
- **GSD**: No worktree support

**Keep**: `worktree-manager.js`, merge/review/discard skills
**Integrate**: Add worktree phase to GSD execute workflow

### 2. Memory System ✓
- **RALPH**: Persistent knowledge graph (entities, relationships, insights)
- **GSD**: STATE.md only (no structured memory)

**Keep**: `memory-manager.js`
**Integrate**: Add memory queries to GSD research phase

### 3. News Aggregation ✓
- **RALPH**: RSS feeds, Anthropic docs sync, newsletter
- **GSD**: No news/docs features

**Keep**: `news-aggregator.js`, `doc-fetcher.js`, `email-templates.js`
**Integrate**: As separate utility commands

### 4. Security Layer ✓
- **RALPH**: Command allowlists, filesystem boundaries
- **GSD**: Basic permissions only

**Keep**: `security-analyzer.js`, `boundary-validator.js`
**Integrate**: Generate security config during project init

### 5. Design System ✓
- **RALPH**: 40+ icons, theme support, consistent UI
- **GSD**: Basic formatting

**Keep**: `design-system.js` for consistent CLI output
**Integrate**: Replace GSD statusline with richer output

---

## What Both Have (Use GSD's Version)

| Feature | Use |
|---------|-----|
| Project setup | GSD `/gsd:new-project` |
| Planning | GSD plan-phase with XML prompts |
| Execution | GSD wave-based parallel execution |
| Verification | GSD verify-work with UAT |
| Quick tasks | GSD `/gsd:quick` |
| Debugging | GSD `/gsd:debug` |
| Progress tracking | GSD `/gsd:progress` |
| Code review | GSD agents (integrate into workflow) |

---

## The Unified Architecture

### New Package: `supreme-gsd`

```
supreme-gsd/
├── bin/
│   └── install.js           # GSD installer (adapted)
├── commands/
│   └── gsd/                  # GSD commands (25+)
├── agents/                   # GSD agents (11)
├── get-shit-done/
│   ├── workflows/            # GSD workflows (12+)
│   ├── references/           # GSD references
│   └── templates/            # GSD templates
├── supreme/                  # Supreme extensions
│   ├── worktree/             # Git worktree integration
│   │   ├── workflow.md       # Worktree workflow
│   │   └── commands/         # worktree commands
│   ├── memory/               # Memory system
│   │   ├── manager.js        # Memory operations
│   │   └── command.md        # /gsd:memory command
│   ├── security/             # Security layer
│   │   ├── analyzer.js       # Stack-based allowlists
│   │   └── boundaries.js     # Filesystem rules
│   └── news/                 # News aggregation
│       ├── aggregator.js     # RSS/API fetching
│       └── command.md        # /gsd:news command
├── hooks/
│   └── dist/                 # GSD hooks
├── scripts/                  # Build scripts
├── package.json              # Zero runtime deps (like GSD)
└── README.md
```

### Command Structure

**Core GSD (unchanged):**
- `/gsd:new-project` - Project initialization
- `/gsd:discuss-phase [N]` - Capture decisions
- `/gsd:plan-phase [N]` - Research + plan + verify
- `/gsd:execute-phase [N]` - Wave-based execution
- `/gsd:verify-work [N]` - User acceptance testing
- `/gsd:quick` - Ad-hoc tasks
- `/gsd:progress` - Status check
- `/gsd:help` - Command reference
- (all other GSD commands)

**Supreme Extensions:**
- `/gsd:worktree [action]` - Git worktree management
  - `create [name]` - Create isolated worktree
  - `list` - Show active worktrees
  - `merge [name]` - Merge to main
  - `discard [name]` - Abandon worktree
- `/gsd:memory [action]` - Knowledge management
  - `query [term]` - Search memory
  - `insights` - Show learnings
  - `add [type]` - Add entity/insight
- `/gsd:security` - Security configuration
  - `scan` - Analyze project for boundaries
  - `config` - Generate security config
- `/gsd:news` - AI/Claude news
  - `fetch` - Get latest news
  - `--refresh` - Force refresh

---

## Migration Path

### Phase 1: Adopt GSD Core
1. Copy GSD commands/, agents/, get-shit-done/, hooks/ as-is
2. Update installer to use GSD patterns
3. Remove RALPH skills that duplicate GSD
4. Test core workflow works

### Phase 2: Integrate Supreme Extensions
1. Add worktree support to execute-phase workflow
2. Add memory queries to research workflow
3. Add security config to new-project workflow
4. Add news as standalone command

### Phase 3: Clean Up
1. Remove all obsolete RALPH code
2. Remove unused utility modules
3. Update documentation
4. Publish as `supreme-gsd`

---

## Files to DELETE (Remove Entirely)

### Skills (templates/global/skills/)
```
ralph/                    # Replaced by GSD progress/settings
ralph-run/               # Replaced by GSD execute-phase
ralph-plan/              # Replaced by GSD plan-phase
ralph-qa/                # Replaced by GSD verify-work
ralph-pause/             # Replaced by GSD pause-work
ralph-resume/            # Replaced by GSD resume-work
ralph-rollback/          # No equivalent needed (git handles)
setup-project/           # Replaced by GSD new-project
prd/                     # Replaced by GSD requirements extraction
code-review/             # Integrated into GSD workflow
```

### Agents (templates/global/agents/)
```
planner.md               # GSD has gsd-planner
coder.md                 # GSD has gsd-executor
qa-reviewer.md           # GSD has gsd-verifier
qa-fixer.md              # GSD handles via fix plans
researcher.md            # GSD has gsd-phase-researcher
debugger.md              # GSD has gsd-debugger
code-reviewer.md         # Integrate into GSD workflow
```

### Utilities (scripts/utils/)
```
complexity-classifier.js  # GSD depth setting handles this
qa-loop.js               # GSD verify-work handles this
intervention-manager.js  # GSD pause/resume handles this
prd-validator.js         # GSD requirements format
project-analyzer.js      # GSD map-codebase handles this
spec-generator.js        # GSD PROJECT.md handles this
```

### Templates (templates/)
```
ralph/                   # All RALPH templates obsolete
global/skills/           # Most replaced by GSD commands
global/agents/           # All replaced by GSD agents
```

### Scripts
```
run-ralph.js             # Replaced by GSD
setup-project.js         # Replaced by GSD
setup/phases.js          # Replaced by GSD
setup/ralph-setup.js     # Replaced by GSD
setup/template-writer.js # Replaced by GSD
```

---

## Files to KEEP (Supreme Extensions)

### Worktree System
```
scripts/utils/worktree-manager.js       # Git worktree operations
templates/global/skills/ralph-merge/    # Rename to gsd-worktree-merge
templates/global/skills/ralph-review/   # Rename to gsd-worktree-review
templates/global/skills/ralph-discard/  # Rename to gsd-worktree-discard
```

### Memory System
```
scripts/utils/memory-manager.js         # Persistent knowledge graph
templates/global/skills/ralph-memory/   # Rename to gsd-memory
```

### Security System
```
scripts/utils/security-analyzer.js      # Stack-based allowlists
scripts/utils/boundary-validator.js     # Filesystem rules
```

### News System
```
scripts/utils/news-aggregator.js        # RSS/API fetching
scripts/utils/news-sources.js           # Source definitions
scripts/utils/news-fetcher.js           # Formatting
scripts/utils/doc-fetcher.js            # Anthropic docs
scripts/utils/email-templates.js        # Newsletter
scripts/utils/email-sender.js           # Resend API
```

### Core Utilities
```
scripts/utils/design-system.js          # CLI UI components
scripts/utils/config-manager.js         # Config handling
scripts/utils/fs-helper.js              # File operations
scripts/utils/http-client.js            # HTTP with retry
scripts/utils/logger.js                 # Debug logging
scripts/utils/template-engine.js        # Template rendering
```

---

## Integration Points

### 1. Worktree in Execute Phase

Add to GSD's `execute-phase.md` workflow:

```xml
<step name="worktree_setup" priority="first">
  IF config.worktree.enabled:
    Create worktree for this phase using worktree-manager
    Execute plans in worktree
    After verification, merge or prompt for review
</step>
```

### 2. Memory in Research Phase

Add to GSD's `plan-phase.md` workflow:

```xml
<step name="memory_query" priority="first">
  IF memory-manager has relevant entities:
    Include past learnings in researcher context
    Add discovered patterns to planner context
</step>
```

### 3. Security in New Project

Add to GSD's `new-project.md` workflow:

```xml
<step name="security_config" priority="last">
  Run security-analyzer on detected stack
  Generate .planning/security.json with:
    - allowed_commands (based on stack)
    - file_boundaries (standard patterns)
  Ask user to review/customize
</step>
```

---

## Implementation Order

### Week 1: Foundation
1. Clone GSD as base
2. Rename package to `supreme-gsd`
3. Update installer for Windows/Mac/Linux
4. Verify core workflow works
5. Remove RALPH references from README

### Week 2: Extensions
1. Port worktree-manager.js
2. Create `/gsd:worktree` command
3. Integrate worktree into execute-phase
4. Port memory-manager.js
5. Create `/gsd:memory` command
6. Integrate memory into research phase

### Week 3: Security & News
1. Port security-analyzer.js
2. Port boundary-validator.js
3. Create `/gsd:security` command
4. Integrate into new-project
5. Port news system
6. Create `/gsd:news` command

### Week 4: Polish
1. Port design-system.js improvements
2. Update all documentation
3. Create migration guide for RALPH users
4. Test complete workflow
5. Publish to npm

---

## Naming Options

| Option | Pros | Cons |
|--------|------|------|
| `supreme-gsd` | Clear derivative, respects GSD | Long |
| `gsd-supreme` | GSD first | Could confuse |
| `gsd-plus` | Simple | Generic |
| `gsd-pro` | Professional | Implies paid? |
| `ultra-gsd` | Energy | Hyperbolic |
| `gsd-x` | Modern | Vague |
| `get-more-done` | Playful | Different brand |

**Recommendation**: `supreme-gsd` or `gsd-supreme`

---

## Summary

**What we're building**: GSD core + Supreme extensions (worktree, memory, security, news)

**What we're removing**: Entire RALPH multi-agent system, PRD workflow, complexity classification, QA loops, intervention system

**Why**: GSD's context engineering approach is more elegant and effective. The "plans as prompts" model with fresh context per executor outperforms the multi-agent orchestration approach. RALPH's unique contributions (worktree, memory, security) integrate cleanly as GSD extensions.

**Result**: A leaner, more powerful tool that "just works" while adding enterprise-grade features (worktree isolation, persistent memory, security boundaries) that GSD lacks.

---

## Next Steps

1. **User Decision**: Approve this plan or request modifications
2. **Name Decision**: Choose final package name
3. **Begin Implementation**: Phase 1 - Adopt GSD Core
