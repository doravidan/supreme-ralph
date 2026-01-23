# Project Specification: supreme-ralph

> Generated: 2026-01-22
> Version: 2.0.0
> Analyzed by: Deep Project Analysis

## Overview

**supreme-ralph** (formerly claude-init) is a global Claude Code extension that provides autonomous development capabilities via RALPH. After a one-time global installation to `~/.claude/`, all features are available as slash commands in any project.

**Key Change in v2.0.0:** Pure slash command experience - no CLI tool needed after installation. Everything works through Claude Code's native skill system.

### Key Capabilities

1. **Global Installation** - One-time setup to `~/.claude/` that works everywhere
2. **Interactive Project Setup** - `/setup-project` uses AskUserQuestion for 6-8 configuration questions
3. **RALPH Autonomous Agent** - `/ralph-run` implements features from PRD specifications automatically
4. **PRD Generation** - `/prd` creates intelligent, context-aware PRDs from feature descriptions
5. **Deep Project Analysis** - Understand codebase structure, patterns, and conventions
6. **Code Review** - `/code-review` for comprehensive code quality analysis
7. **News Aggregation** - Track Claude/Anthropic updates from 11+ sources
8. **Knowledge Base Sync** - Keep Anthropic documentation up-to-date locally

---

## Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Language | JavaScript (ES Modules) | ES2022+ |
| Runtime | Node.js | >=18.0.0 |
| Package Manager | npm | 9+ |
| CLI Framework | Commander.js | ^12.0.0 |
| File Operations | fs-extra | ^11.2.0 |
| Interactive Prompts | Inquirer | ^9.2.0 |
| Terminal Styling | Chalk | ^5.3.0 |
| Loading Spinners | Ora | ^8.0.0 |
| HTTP Client | node-fetch | ^3.3.0 |
| Email Service | Resend | ^3.0.0 |
| HTML to Markdown | Turndown | ^7.1.0 |
| YAML Parser | yaml | ^2.3.0 |

---

## Architecture

```
supreme-ralph/
├── bin/                           # CLI Entry Points
│   ├── supreme-ralph.js           # Global installation CLI (npx supreme-ralph install)
│   └── claude-init.js             # Legacy CLI with all commands
│
├── scripts/                       # Core Scripts
│   ├── setup-project.js           # Project initialization (main feature)
│   ├── run-ralph.js               # RALPH autonomous agent runner
│   ├── sync-knowledge.js          # Anthropic docs synchronization
│   ├── fetch-news.js              # News aggregation CLI
│   ├── send-email-summary.js      # Newsletter email sender
│   ├── check-updates.js           # Check for documentation updates
│   ├── view-changes.js            # View changelog
│   ├── list-projects.js           # List tracked projects
│   ├── list-templates.js          # List available templates
│   ├── project-status.js          # Show project status
│   ├── remove-project.js          # Untrack a project
│   ├── setup-scheduler.js         # Setup automatic syncing
│   ├── validate-templates.js      # Validate template files
│   ├── post-install.js            # Post-install hook
│   ├── install-global.js          # Global installation to ~/.claude/
│   │
│   ├── ralph/                     # RALPH Agent Files
│   │   ├── ralph.sh               # RALPH bash loop script
│   │   ├── CLAUDE.md              # RALPH system prompt
│   │   ├── progress.txt.template  # Progress logging template
│   │   └── prd.json.example       # Example PRD structure
│   │
│   └── utils/                     # Shared Utilities
│       ├── project-analyzer.js    # Deep project analysis engine
│       ├── spec-generator.js      # PROJECT_SPEC.md generator
│       ├── template-generator.js  # Template variable processor
│       ├── design-system.js       # CLI UI components
│       ├── news-aggregator.js     # RSS/API news fetching
│       ├── news-fetcher.js        # News formatting
│       ├── news-sources.js        # Source configuration
│       ├── project-registry.js    # Global project tracking
│       ├── doc-fetcher.js         # Anthropic doc fetcher
│       ├── diff-checker.js        # Knowledge base diff tracking
│       ├── content-summarizer.js  # Change summarization
│       └── email-sender.js        # Resend API integration
│
├── templates/                     # Project Scaffolding Templates
│   ├── global/                    # Global installation templates (→ ~/.claude/)
│   │   ├── skills/                # Global skills (available everywhere)
│   │   │   ├── setup-project/SKILL.md   # /setup-project - Interactive project setup
│   │   │   ├── ralph/SKILL.md           # /ralph - Status, validate, reset, analyze
│   │   │   ├── ralph-run/SKILL.md       # /ralph-run - RALPH execution loop
│   │   │   ├── prd/SKILL.md             # /prd - PRD generation
│   │   │   └── code-review/SKILL.md     # /code-review - Code quality analysis
│   │   ├── commands/              # Global commands
│   │   │   ├── commit.md
│   │   │   ├── review.md
│   │   │   ├── test.md
│   │   │   └── deploy.md
│   │   ├── agents/                # Global agents
│   │   │   ├── code-reviewer.md
│   │   │   ├── debugger.md
│   │   │   └── researcher.md
│   │   └── rules/                 # Global rules
│   │       ├── code-style.md
│   │       ├── security.md
│   │       └── javascript-style.md
│   │
│   ├── CLAUDE.md.template         # Main project prompt
│   ├── CLAUDE.local.md.template   # Local project prompt
│   ├── rules/                     # Per-project rules templates
│   ├── commands/                  # Per-project command templates
│   ├── agents/                    # Per-project agent templates
│   ├── skills/                    # Per-project skill templates
│   ├── hooks/                     # Hook scripts
│   ├── settings/                  # Settings templates
│   ├── mcp/                       # MCP configuration
│   └── ralph/                     # RALPH templates (legacy)
│
├── .claude/                       # Claude Code Configuration
│   ├── settings.json              # Permissions and environment
│   ├── settings.local.json        # Local overrides
│   ├── rules/                     # Code style rules
│   ├── commands/                  # Slash commands
│   ├── agents/                    # Custom agents
│   ├── skills/                    # Agent skills
│   └── hooks/                     # Hook scripts
│
├── knowledge-base/                # Synced Anthropic Documentation
│   ├── docs/                      # Documentation files
│   ├── changelog/                 # Change history
│   ├── metadata.json              # Sync metadata
│   ├── last-sync.json             # Last sync timestamp
│   └── .cache/                    # News and API caches
│
├── examples/                      # Example CLAUDE.md Files
│   ├── typescript-project/
│   ├── react-project/
│   ├── python-project/
│   └── full-stack-project/
│
├── vscode-claude-init/            # VSCode Extension
│   ├── src/                       # TypeScript source
│   ├── media/                     # CSS and JS assets
│   ├── resources/                 # Icons and images
│   ├── package.json               # Extension manifest
│   └── tsconfig.json              # TypeScript config
│
├── package.json                   # Project manifest
├── CLAUDE.md                      # Project documentation
└── PROJECT_SPEC.md                # This file
```

---

## Installation

### Global Installation (Recommended)

```bash
# One-time global installation
npx supreme-ralph install

# Or with auto-confirmation
npx supreme-ralph install -y
```

This installs all skills, commands, agents, and rules to `~/.claude/` for global availability.

---

## Slash Commands (After Global Installation)

After installation, these slash commands are available in **any project**:

| Command | Description |
|---------|-------------|
| `/setup-project` | Interactive project setup with 6-8 questions |
| `/ralph` | RALPH status, validate, reset, analyze |
| `/ralph-run` | Start RALPH autonomous development |
| `/ralph-run 20` | Run with 20 iterations |
| `/prd [feature]` | Generate PRD from feature description |
| `/code-review` | Run comprehensive code review |
| `/commit` | Create git commit with formatted message |
| `/review` | Review code changes |
| `/test` | Run tests |
| `/deploy` | Deploy to environment |

---

## Legacy CLI Commands

The legacy CLI (`claude-init`) is still available for advanced operations:

### `claude-init setup`
Initialize or configure a project for Claude Code.

```bash
claude-init setup [options]
  -t, --target <path>          # Target directory (default: current)
  -m, --merge                  # Merge with existing config
  -y, --yes                    # Skip prompts, use defaults
  -f, --feature <description>  # Create initial PRD for RALPH
```

### `claude-init sync`
Sync knowledge base from Anthropic documentation.

### `claude-init news`
Fetch Claude/Anthropic news from multiple sources.

### `claude-init projects`
List all tracked projects.

---

## Key Features

### 1. Project Setup Workflow

When running `claude-init setup`, the tool:

1. **Checks for KB Updates** - Prompts to sync if updates available
2. **Gathers Configuration** - Interactive prompts (or defaults with `--yes`)
3. **Creates Directory Structure** - `.claude/` with all subdirectories
4. **Generates CLAUDE.md** - Project-specific documentation
5. **Writes Settings** - `settings.json` with permissions
6. **Installs Rules** - Code style, security, testing, documentation
7. **Installs Commands** - /review, /test, /commit, /deploy
8. **Installs Agents** - code-reviewer, debugger, researcher
9. **Installs Skills** - code-review, prd, ralph, ralph-run
10. **Configures Hooks** - Auto-compact, validation
11. **Analyzes Project** - Deep analysis of structure and patterns
12. **Generates PROJECT_SPEC.md** - Comprehensive specification
13. **Sets Up RALPH** - Autonomous agent configuration
14. **Creates Initial PRD** - If `--feature` specified
15. **Registers Project** - In global project registry

### 2. RALPH Autonomous Development

RALPH (Recursive Autonomous Loop for Production Harmony) implements features automatically via `/ralph-run`:

**Workflow:**
1. Load `prd.json` with user stories
2. Select highest-priority incomplete story
3. **Use AskUserQuestion for any ambiguity** (critical!)
4. Implement the story following project patterns
5. Run quality gates (typecheck, lint, tests)
6. Commit changes if all pass
7. Update story status in prd.json
8. Log to `.ralph/progress.txt`
9. Repeat until all stories complete or max iterations reached

**PRD Structure:**
```json
{
  "project": "Feature Name",
  "branchName": "ralph/feature-slug",
  "description": "Overview",
  "userStories": [
    {
      "id": "US-001",
      "title": "Story Title",
      "description": "As a... I want... So that...",
      "acceptanceCriteria": ["Criterion 1", "Tests pass"],
      "priority": 1,
      "passes": false,
      "notes": ""
    }
  ]
}
```

### 3. Deep Project Analysis

The `project-analyzer.js` module detects:

| Category | Detection |
|----------|-----------|
| **Language** | TypeScript, JavaScript, Python, Go, Rust, C# |
| **Framework** | React, Next.js, Vue, Angular, Express, FastAPI, etc. |
| **Test Framework** | Jest, Vitest, Mocha, Playwright, Cypress |
| **Linting** | ESLint, Prettier, Biome |
| **Type System** | TypeScript (strict mode detection) |
| **Package Manager** | npm, pnpm, yarn, pip, cargo |
| **Dependencies** | 200+ known packages with purposes |
| **Conventions** | Naming style, module system, import order |

### 4. News Aggregation

Sources tracked (11 total):

**RSS Feeds:**
- Anthropic Official (news, engineering, research, changelog)
- TechCrunch AI, The Verge AI, Ars Technica AI
- VentureBeat AI, WIRED AI, MIT Technology Review

**API Sources:**
- Hacker News (Algolia API)
- r/ClaudeAI, r/Anthropic (Reddit)

**Categories:**
- Product, Research, Business, Viral
- Community, Tutorial, Opinion, Changelog

### 5. Global Skills System

Skills are installed globally to `~/.claude/skills/*/SKILL.md` and available in any project:

| Skill | Trigger | Purpose |
|-------|---------|---------|
| `/setup-project` | New project setup | Interactive 6-8 question project configuration |
| `/ralph` | Management | PRD status, validation, reset, re-analysis |
| `/ralph-run` | Execution | Autonomous development loop with AskUserQuestion |
| `/prd` | PRD creation | Generate intelligent PRD from feature description |
| `/code-review` | Quality | Review code for best practices and issues |

**Skill Format:**
```markdown
---
name: skill-name
description: What the skill does
allowed-tools: Read, Edit, Write, Bash, AskUserQuestion
---

# Skill Title

## Process
Steps to execute...
```

**Key Feature:** Skills use `AskUserQuestion` tool for interactive clarification instead of guessing.

---

## Code Patterns & Conventions

### Module System
- **ES Modules** exclusively (`import`/`export`)
- `type: "module"` in package.json
- `.js` extension in local imports
- Import order: Node built-ins → External → Local

### Async Patterns
- Always use `async`/`await`
- Try/catch for error handling
- User-friendly error messages via chalk

### File Operations
- Use `fs-extra` (not native `fs`)
- `fs.ensureDir()` before writing
- `fs.pathExists()` for checks
- `fs.readJson()` for JSON parsing

### CLI Output
- `chalk` for colors
- `ora` for spinners
- `inquirer` for prompts
- Centralized in `design-system.js`

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Functions | camelCase | `analyzeProject` |
| Variables | camelCase | `projectName` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Files | kebab-case | `project-analyzer.js` |
| Classes | PascalCase | `TemplateGenerator` |

### Error Handling
- Graceful degradation
- Continue with warnings when possible
- Log errors but don't block
- Exit with code 1 on fatal errors

---

## Template System

Templates use `{{variableName}}` placeholders:

### Available Variables
```
{{projectName}}           # Project display name
{{projectDescription}}    # One-line description
{{techStack}}             # Technology summary
{{buildCommand}}          # Build command
{{testCommand}}           # Test command
{{lintCommand}}           # Lint command
{{devCommand}}            # Dev server command
{{hasTypeScript}}         # Boolean
{{hasPython}}             # Boolean
{{hasDocker}}             # Boolean
{{hasDatabase}}           # Boolean
{{databaseType}}          # PostgreSQL, MySQL, etc.
```

### Conditional Blocks
```markdown
{{#if hasTypeScript}}
TypeScript-specific content
{{/if}}

{{#unless hasPython}}
Non-Python content
{{/unless}}
```

---

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `RESEND_API_KEY` | Email API key | - |
| `EMAIL_TO` | Newsletter recipient | - |
| `EMAIL_FROM` | Newsletter sender | - |
| `COMPACT_THRESHOLD` | Auto-compact threshold | 70 |

---

## Quality Gates for RALPH

```bash
# TypeScript projects
npm run typecheck

# All projects
npm run lint
npm test
```

---

## File Outputs from Setup

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project documentation |
| `.claude/settings.json` | Permissions config |
| `.claude/rules/*.md` | Code style rules |
| `.claude/commands/*.md` | Slash commands |
| `.claude/agents/*.md` | Custom agents |
| `.claude/skills/*/SKILL.md` | Agent skills |
| `.claude/hooks/hooks.json` | Hook configuration |
| `PROJECT_SPEC.md` | This specification |
| `prd.json` | Feature PRD (if requested) |
| `progress.txt` | RALPH progress log |
| `scripts/ralph/` | RALPH agent files |

---

## Development

### Running Locally
```bash
# Install dependencies
npm install

# Run setup on current directory
npm run setup

# Run setup with defaults
node bin/claude-init.js setup --yes

# Test RALPH
node bin/claude-init.js ralph --status
```

### Testing Templates
```bash
# Validate all templates
node bin/claude-init.js validate

# List available templates
node bin/claude-init.js templates
```

### News and Updates
```bash
# Fetch latest news
node bin/claude-init.js news --refresh

# Sync knowledge base
node bin/claude-init.js sync

# Check for updates
node bin/claude-init.js check
```

---

## Security Considerations

### Do NOT
- Commit API keys or secrets
- Store credentials in code
- Log sensitive information
- Read .env files (blocked by default)

### Do
- Use environment variables for secrets
- Validate user input in templates
- Sanitize file paths
- Follow principle of least privilege

---

*This specification was generated by deep project analysis. Review and customize as needed.*
