# Project Specification: claude-init

> Generated: 2026-01-21
> Version: 1.0.0
> Analyzed by: Deep Project Analysis

## Overview

**claude-init** is a comprehensive CLI tool for scaffolding projects with Claude Code best practices. It provides intelligent project analysis, autonomous development via RALPH, news aggregation for Claude/Anthropic updates, and a complete template system for customizing project configurations.

### Key Capabilities

1. **Interactive Project Setup** - Analyze and configure any project for Claude Code
2. **RALPH Autonomous Agent** - Implement features from PRD specifications automatically
3. **Deep Project Analysis** - Understand codebase structure, patterns, and conventions
4. **News Aggregation** - Track Claude/Anthropic updates from 11+ sources
5. **Knowledge Base Sync** - Keep Anthropic documentation up-to-date locally
6. **Template System** - Customizable configurations with variable substitution
7. **VSCode Extension** - GUI for project initialization

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
claude-init/
├── bin/                           # CLI Entry Point
│   └── claude-init.js             # Main CLI with all commands
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
│   ├── CLAUDE.md.template         # Main project prompt
│   ├── CLAUDE.local.md.template   # Local project prompt
│   ├── rules/                     # Code style rules
│   │   ├── code-style.md.template
│   │   ├── security.md.template
│   │   ├── testing.md.template
│   │   └── documentation.md.template
│   ├── commands/                  # Slash commands
│   │   ├── review.md.template
│   │   ├── test.md.template
│   │   ├── commit.md.template
│   │   └── deploy.md.template
│   ├── agents/                    # Custom agents
│   │   ├── code-reviewer.md.template
│   │   ├── debugger.md.template
│   │   └── researcher.md.template
│   ├── skills/                    # Agent skills
│   │   └── code-review/SKILL.md.template
│   ├── hooks/                     # Hook scripts
│   │   ├── hooks.json.template
│   │   ├── auto-compact.sh
│   │   └── auto-compact.js
│   ├── settings/                  # Settings templates
│   │   ├── settings.json.template
│   │   └── settings.local.json.template
│   ├── mcp/                       # MCP configuration
│   │   └── .mcp.json.template
│   └── ralph/                     # RALPH templates
│       ├── CLAUDE.md.template
│       ├── ralph.sh.template
│       ├── progress.txt.template
│       ├── prd.json.example
│       └── skills/
│           ├── prd/SKILL.md
│           ├── ralph/SKILL.md
│           └── ralph-run/SKILL.md
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

## CLI Commands

### `claude-init setup`
Initialize or configure a project for Claude Code.

```bash
claude-init setup [options]
  -t, --target <path>          # Target directory (default: current)
  -m, --merge                  # Merge with existing config
  -y, --yes                    # Skip prompts, use defaults
  -f, --feature <description>  # Create initial PRD for RALPH
  --no-ralph                   # Skip RALPH setup
  --no-hooks                   # Skip hooks setup
  --no-agents                  # Skip agents setup
  --no-commands                # Skip commands setup
  --no-rules                   # Skip rules setup
  --no-skills                  # Skip skills setup
```

### `claude-init ralph`
Run RALPH autonomous development agent.

```bash
claude-init ralph [max-iterations] [options]
  -t, --target <path>          # Target directory
  --init                       # Initialize RALPH in project
  --status                     # Show PRD completion status
  --reset                      # Reset progress.txt
  --analyze                    # Re-analyze project
```

### `claude-init sync`
Sync knowledge base from Anthropic documentation.

```bash
claude-init sync
```

### `claude-init news`
Fetch Claude/Anthropic news from multiple sources.

```bash
claude-init news [options]
  -r, --refresh                # Force refresh from sources
  -j, --json                   # Output as JSON
  -s, --stats                  # Show statistics
  -l, --limit <number>         # Max items (default: 10)
  -c, --category <category>    # Filter by category
  -t, --text                   # Plain text format
```

### `claude-init projects`
List all tracked projects.

```bash
claude-init projects [options]
  --status <status>            # Filter: active|archived|orphaned
  --language <language>        # Filter by language
  --json                       # Output as JSON
  --validate                   # Validate all paths
```

### Other Commands

| Command | Description |
|---------|-------------|
| `claude-init check` | Check for knowledge base updates |
| `claude-init changes` | View changelog since last setup |
| `claude-init templates` | List available templates |
| `claude-init validate` | Validate template files |
| `claude-init email` | Send newsletter (--test, --dry-run) |
| `claude-init scheduler` | Setup automatic syncing |
| `claude-init untrack <path>` | Remove project from tracking |
| `claude-init status [path]` | Show project status |

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

RALPH (Recursive Autonomous LLM Pull-based Handler) implements features automatically:

**Workflow:**
1. Load `prd.json` with user stories
2. Select highest-priority incomplete story
3. Generate context-aware prompt
4. Call Claude API for implementation
5. Run quality gates (typecheck, lint, tests)
6. Commit changes if all pass
7. Update story status in prd.json
8. Log to progress.txt
9. Repeat until complete

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

### 5. Skills System

Skills are reusable capabilities located in `.claude/skills/*/SKILL.md`:

| Skill | Purpose |
|-------|---------|
| `/code-review` | Review code for quality and best practices |
| `/prd` | Generate PRD from feature description |
| `/ralph` | Convert PRD markdown to prd.json |
| `/ralph-run` | Execute RALPH autonomous loop |

**Skill Format:**
```markdown
---
name: skill-name
description: What the skill does
allowed-tools: Read, Edit, Write, Bash
---

# Skill Title

## Process
Steps to execute...
```

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
