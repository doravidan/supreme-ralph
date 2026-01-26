<div align="center">

# GSD ULTRA

**Get Shit Done with superpowers.**

GSD's battle-tested context engineering + worktree isolation + persistent memory + security boundaries.

[![npm version](https://img.shields.io/npm/v/gsd-ultra?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/gsd-ultra)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

<br>

```bash
npx gsd-ultra
```

**Works on Mac, Windows, and Linux.**

</div>

---

## What is GSD Ultra?

GSD Ultra builds on [Get Shit Done](https://github.com/glittercowboy/get-shit-done) — the premier context engineering system for Claude Code — and adds enterprise-grade features:

| Feature | GSD Core | GSD Ultra |
|---------|----------|-----------|
| Context engineering | ✓ | ✓ |
| Multi-agent orchestration | ✓ | ✓ |
| Wave-based parallel execution | ✓ | ✓ |
| Plans as prompts | ✓ | ✓ |
| **Git worktree isolation** | — | ✓ |
| **Persistent memory graph** | — | ✓ |
| **Security boundaries** | — | ✓ |
| **News aggregation** | — | ✓ |
| **GitHub Copilot support** | — | ✓ |

**Philosophy:** Same GSD simplicity, more power under the hood.

---

## Getting Started

```bash
npx gsd-ultra
```

The installer prompts for:
1. **Location** — Global (all projects) or local (current project only)

Verify with `/gsd:help` in Claude Code.

### Recommended: Skip Permissions Mode

```bash
claude --dangerously-skip-permissions
```

GSD Ultra is designed for autonomous execution. Stopping to approve every command defeats the purpose.

---

## Core Workflow (from GSD)

### 1. Initialize Project

```
/gsd:new-project
```

Deep questioning → research → requirements → roadmap.

### 2. Discuss Phase

```
/gsd:discuss-phase 1
```

Capture implementation decisions before planning.

### 3. Plan Phase

```
/gsd:plan-phase 1
```

Research + create atomic plans + verify.

### 4. Execute Phase

```
/gsd:execute-phase 1
```

Wave-based parallel execution with fresh context per plan.

### 5. Verify Work

```
/gsd:verify-work 1
```

User acceptance testing with auto-fix for failures.

---

## Ultra Extensions

### Git Worktree Isolation

Each feature gets isolated development:

```
/gsd:worktree create user-auth
→ Creates .worktrees/user-auth/ on branch gsd/user-auth

/gsd:worktree list
→ Shows all active worktrees with status

/gsd:worktree merge user-auth --squash
→ Merges back to main, cleans up

/gsd:worktree discard failed-experiment
→ Abandons without merging
```

**Why?** Parallel feature development without conflicts. Safe experimentation.

---

### Persistent Memory Graph

Knowledge accumulates across sessions:

```
/gsd:memory query authentication
→ Found 3 entities, 2 relationships, 1 insight

/gsd:memory insights
→ Lists all recorded learnings

/gsd:memory add-insight pattern
→ Record what you learned
```

**Stores:**
- **Entities** — Files, functions, APIs, patterns
- **Relationships** — Dependencies, calls, implements
- **Insights** — What worked, what didn't, decisions

**Why?** Claude learns from past sessions. No more repeating discoveries.

---

### Security Boundaries

Safe autonomous execution:

```
/gsd:security scan
→ Detects Node.js, React, PostgreSQL

/gsd:security config
→ Generates .planning/security.json

/gsd:security apply
→ Updates Claude Code settings
```

**Layers:**
- **Command allowlists** — Stack-specific approved commands
- **Filesystem boundaries** — Protected files (.env, secrets/)
- **Intervention controls** — When to pause for human review

**Why?** Autonomous without being reckless.

---

### News Aggregation

Stay current:

```
/gsd:news
→ Latest AI/Claude news from 8 sources

/gsd:news --refresh
→ Force fetch fresh content

/gsd:news --source anthropic
→ Official Anthropic posts only
```

**Sources:**
- Anthropic Blog, Claude Release Notes
- Hacker News, TechCrunch, The Verge
- Reddit r/ClaudeAI, r/MachineLearning

---

### GitHub Copilot Support

Use the same project configuration with both Claude Code and GitHub Copilot:

```
/gsd:copilot generate
→ Creates .github/copilot-instructions.md
→ Creates .github/instructions/*.instructions.md
→ Creates .github/prompts/*.prompt.md
→ Creates .github/agents/*.agent.md
```

**Or install during setup:**
```bash
npx gsd-ultra --local --copilot
```

**Generated files:**
- **copilot-instructions.md** — Repo-wide instructions from PROJECT_SPEC.md
- **instructions/** — Path-specific (JavaScript, TypeScript, Python, tests)
- **prompts/** — Reusable prompts (/review-code, /add-tests, /debug)
- **agents/** — Custom agents (code-reviewer, test-writer, debugger)

**Why?** Same project context works in both Claude Code and GitHub Copilot.

---

## All Commands

### Core Workflow
| Command | What it does |
|---------|--------------|
| `/gsd:new-project` | Initialize with deep questioning |
| `/gsd:discuss-phase [N]` | Capture implementation decisions |
| `/gsd:plan-phase [N]` | Research + plan + verify |
| `/gsd:execute-phase [N]` | Wave-based parallel execution |
| `/gsd:verify-work [N]` | User acceptance testing |
| `/gsd:quick` | Ad-hoc tasks with GSD guarantees |

### Navigation
| Command | What it does |
|---------|--------------|
| `/gsd:progress` | Where am I? What's next? |
| `/gsd:help` | Show all commands |

### Phase Management
| Command | What it does |
|---------|--------------|
| `/gsd:add-phase` | Append phase to roadmap |
| `/gsd:insert-phase [N]` | Insert urgent work |
| `/gsd:remove-phase [N]` | Remove future phase |

### Milestone Management
| Command | What it does |
|---------|--------------|
| `/gsd:audit-milestone` | Verify completion |
| `/gsd:complete-milestone` | Archive and tag release |
| `/gsd:new-milestone [name]` | Start next version |

### Session
| Command | What it does |
|---------|--------------|
| `/gsd:pause-work` | Create handoff notes |
| `/gsd:resume-work` | Restore from last session |

### Ultra Extensions
| Command | What it does |
|---------|--------------|
| `/gsd:worktree [action]` | Git worktree management |
| `/gsd:memory [action]` | Persistent knowledge graph |
| `/gsd:security [action]` | Command allowlists & boundaries |
| `/gsd:news` | AI/Claude news aggregation |
| `/gsd:copilot [action]` | GitHub Copilot config generation |

### Utilities
| Command | What it does |
|---------|--------------|
| `/gsd:settings` | Configure model profile |
| `/gsd:debug [desc]` | Systematic debugging |
| `/gsd:map-codebase` | Analyze existing code |

---

## Configuration

Settings stored in `.planning/config.json`:

```json
{
  "mode": "yolo",
  "depth": "standard",
  "model_profile": "balanced",
  "workflow": {
    "research": true,
    "plan_check": true,
    "verifier": true
  }
}
```

### Model Profiles

| Profile | Planning | Execution | Cost |
|---------|----------|-----------|------|
| `quality` | Opus | Opus | Highest |
| `balanced` | Opus | Sonnet | Moderate |
| `budget` | Sonnet | Sonnet | Lowest |

---

## Why GSD Ultra?

### The Problem

Claude Code degrades as context fills:
- 0-30%: Peak quality
- 50-70%: Degrading
- 70%+: Rushed, minimal work

### The Solution

1. **Atomic plans** — 2-3 tasks max per plan
2. **Fresh context** — 200k tokens per executor
3. **Wave execution** — Parallel where possible
4. **Persistent memory** — Learn across sessions
5. **Worktree isolation** — Safe parallel development
6. **Security boundaries** — Safe autonomous execution

**Result:** Consistent quality on massive codebases.

---

## Credits

GSD Ultra is built on [Get Shit Done](https://github.com/glittercowboy/get-shit-done) by TÂCHES. Ultra extensions developed by the GSD Ultra community.

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**GSD Core makes Claude Code reliable. Ultra makes it unstoppable.**

</div>
