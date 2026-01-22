<p align="center">
  <img src="https://img.shields.io/badge/RALPH-Autonomous%20AI%20Agent-6366f1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyek0xMiAyMGMtNC40MSAwLTgtMy41OS04LThzMy41OS04IDgtOCA4IDMuNTkgOCA4LTMuNTkgOC04IDh6Ii8+PC9zdmc+&logoColor=white" alt="RALPH"/>
</p>

<h1 align="center">Supreme RALPH</h1>

<p align="center">
  <strong>Intelligent CLI toolkit for Claude Code with autonomous AI development</strong>
</p>

<p align="center">
  Transform product requirements into production code — autonomously.
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-ralph-autonomous-agent">RALPH Agent</a> •
  <a href="#-features">Features</a> •
  <a href="#-commands">Commands</a> •
  <a href="#-configuration">Configuration</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=flat-square&logo=node.js&logoColor=white" alt="Node Version"/>
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License"/>
  <img src="https://img.shields.io/badge/TypeScript-Ready-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Claude-Powered-6366f1?style=flat-square" alt="Claude Powered"/>
</p>

---

## What is Supreme RALPH?

**Supreme RALPH** combines intelligent project scaffolding with **RALPH** (**R**ecursive **A**utonomous **L**oop for **P**roduction **H**armony) — an autonomous AI agent that implements entire features from product requirements documents.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│    📋 Your PRD              🤖 RALPH Loop               ✅ Production Code │
│                                                                             │
│    "Add user auth"    ──▶   ┌─────────────┐    ──▶    Complete Feature    │
│                             │  Read Task  │            ├─ Source Code      │
│    User Stories:            │      ↓      │            ├─ Unit Tests       │
│    - Login form             │ Ask if Unclear│          ├─ Type Definitions │
│    - JWT tokens             │      ↓      │            ├─ Documentation    │
│    - Protected routes       │  Implement  │            └─ Git Commits      │
│    - Session mgmt           │      ↓      │                                │
│                             │   Test ✓    │                                │
│                             │      ↓      │                                │
│                             │   Commit    │                                │
│                             │      ↓      │                                │
│                             │ Next Task ──┘                                │
│                             └─────────────┘                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/doravidan/supreme-ralph.git
cd supreme-ralph

# Install dependencies
npm install

# Link globally (optional)
npm link
```

### Initialize Your Project

```bash
# Interactive setup with prompts
claude-init setup

# Quick setup with defaults
claude-init setup --yes

# Setup + create PRD for a feature
claude-init setup --feature "Add user authentication with JWT"
```

### Run RALPH

```bash
# Start autonomous development (20 iterations)
./scripts/ralph/ralph.sh 20

# Single task mode (no PRD needed)
./scripts/ralph/ralph.sh --task "Fix the navbar styling"

# Check status
node scripts/run-ralph.js --status
```

---

## 🤖 RALPH Autonomous Agent

RALPH is an autonomous AI development loop that transforms product requirements into working code.

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Ask, Don't Assume** | Uses `AskUserQuestion` to clarify ambiguity before coding |
| **One Task Focus** | Implements exactly ONE task per iteration for quality |
| **Quality Gates** | Typecheck, lint, and tests must ALL pass before commit |
| **Fresh Context** | Each iteration starts clean; learnings persist in `progress.txt` |
| **Rules Are Law** | Project rules from `config.yaml` are mandatory |
| **Boundaries Are Sacred** | Protected files are never modified |

### The RALPH Loop

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          RALPH ITERATION CYCLE                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   ┌─────────────────┐                                                      │
│   │  1. READ        │  Load PRD, PROJECT_SPEC.md, progress.txt, config    │
│   │     CONTEXT     │  Review git history for previous work               │
│   └────────┬────────┘                                                      │
│            │                                                               │
│            ▼                                                               │
│   ┌─────────────────┐                                                      │
│   │  2. SELECT      │  Pick highest priority task with status: incomplete │
│   │     TASK        │  Priority 1 = highest                               │
│   └────────┬────────┘                                                      │
│            │                                                               │
│            ▼                                                               │
│   ┌─────────────────┐                                                      │
│   │  3. CLARIFY     │  🔑 KEY STEP: Use AskUserQuestion for:              │
│   │     REQUIREMENTS│     • Ambiguous acceptance criteria                 │
│   │                 │     • Multiple valid approaches                     │
│   │                 │     • Missing technical specs                       │
│   └────────┬────────┘     • Edge cases not documented                     │
│            │                                                               │
│            ▼              ⚠️ Don't guess — asking is faster than rework   │
│   ┌─────────────────┐                                                      │
│   │  4. IMPLEMENT   │  Write clean, production-ready code following:      │
│   │                 │     • Patterns from PROJECT_SPEC.md                 │
│   │                 │     • Rules from .ralph/config.yaml                 │
│   │                 │     • Learnings from progress.txt                   │
│   └────────┬────────┘                                                      │
│            │                                                               │
│            ▼                                                               │
│   ┌─────────────────┐                                                      │
│   │  5. QUALITY     │  Run ALL gates — they must ALL pass:                │
│   │     GATES       │     ✓ Typecheck: npx tsc --noEmit                   │
│   │                 │     ✓ Lint: npm run lint                            │
│   │                 │     ✓ Tests: npm test                               │
│   └────────┬────────┘                                                      │
│            │                                                               │
│            ▼                                                               │
│   ┌─────────────────┐                                                      │
│   │  6. COMMIT      │  git commit -m "feat: US-001 - Task Title"          │
│   │                 │  Co-Authored-By: RALPH <noreply@anthropic.com>      │
│   └────────┬────────┘                                                      │
│            │                                                               │
│            ▼                                                               │
│   ┌─────────────────┐                                                      │
│   │  7. UPDATE      │  Mark task complete in PRD                          │
│   │     STATE       │  Append learnings to .ralph/progress.txt            │
│   └────────┬────────┘                                                      │
│            │                                                               │
│            ▼                                                               │
│   ┌─────────────────┐                                                      │
│   │  8. COMPLETE?   │───Yes───▶  Output: <promise>COMPLETE</promise>      │
│   └────────┬────────┘                                                      │
│            │ No                                                            │
│            ▼                                                               │
│        Exit cleanly → Next iteration                                       │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### PRD Formats

RALPH supports three PRD formats. Choose what works for your workflow:

<details>
<summary><b>📄 JSON Format</b> (prd.json) — Recommended for structured projects</summary>

```json
{
  "project": "User Authentication",
  "branchName": "ralph/user-auth",
  "description": "Implement JWT-based authentication system",
  "createdAt": "2024-01-15",
  "userStories": [
    {
      "id": "US-001",
      "title": "Create User model and auth types",
      "description": "Define TypeScript interfaces for User, Session, and JWT payload",
      "acceptanceCriteria": [
        "User interface with id, email, passwordHash, createdAt",
        "Session interface with userId, token, expiresAt",
        "JWTPayload interface with userId, email, iat, exp",
        "Types exported from src/types/auth.ts",
        "npx tsc --noEmit passes"
      ],
      "priority": 1,
      "passes": false,
      "notes": ""
    },
    {
      "id": "US-002",
      "title": "Implement password hashing service",
      "description": "Create secure password hashing using bcrypt",
      "acceptanceCriteria": [
        "hashPassword(plain) returns bcrypt hash",
        "verifyPassword(plain, hash) returns boolean",
        "Cost factor of 12 for production security",
        "Unit tests in tests/auth/password.test.ts",
        "All tests pass"
      ],
      "priority": 2,
      "passes": false,
      "notes": ""
    }
  ]
}
```

</details>

<details>
<summary><b>📝 Markdown Format</b> (PRD.md) — Great for documentation-first teams</summary>

```markdown
# PRD: User Authentication

## Overview
Implement JWT-based authentication with login, register, and session management.

## Tasks

- [ ] Create User model and auth types
- [ ] Implement password hashing service
- [ ] Create JWT token utilities
- [ ] Add login and register endpoints
- [ ] Implement auth middleware
- [x] Project setup (completed)

## Notes
- Use bcrypt with cost factor 12
- JWT expires in 24 hours
- Refresh tokens stored in httpOnly cookies
```

</details>

<details>
<summary><b>📋 YAML Format</b> (tasks.yaml) — Ideal for CI/CD integration</summary>

```yaml
project: User Authentication
branch: ralph/user-auth
description: JWT-based authentication system

tasks:
  - title: Create User model and auth types
    priority: 1
    completed: false
    acceptance:
      - User interface defined
      - Session interface defined
      - Types exported correctly

  - title: Implement password hashing service
    priority: 2
    completed: false
    acceptance:
      - hashPassword function works
      - verifyPassword function works
      - Unit tests pass
```

</details>

### Configuration

Configure RALPH behavior via `.ralph/config.yaml`:

```yaml
# Project metadata
project:
  name: "my-awesome-app"
  language: "typescript"
  framework: "express"
  description: "A REST API with authentication"

# Quality gate commands — ALL must pass before commit
commands:
  typecheck: "npx tsc --noEmit"
  lint: "npm run lint"
  test: "npm test"
  build: "npm run build"

# Rules — Instructions RALPH MUST follow on every task
rules:
  - "Always use TypeScript strict mode"
  - "Follow existing patterns in src/utils/"
  - "Write unit tests for all new functions"
  - "Use Zod for runtime validation"
  - "Handle errors with custom AppError class"
  - "Log important operations with the logger utility"

# Boundaries — Files RALPH should NEVER modify
boundaries:
  never_touch:
    - "src/legacy/**"           # Legacy code
    - "migrations/**"           # Database migrations
    - "*.lock"                  # Lock files
    - ".env*"                   # Environment files
    - "src/generated/**"        # Auto-generated code

# Execution settings
settings:
  max_retries: 3                # Retry failed iterations
  retry_delay: 5                # Seconds between retries
  auto_commit: true             # Commit after each task
  branch_per_task: false        # Create branch for each task
```

### CLI Options

```bash
# ─────────────────────────────────────────────────────────────
#  PRD Loop Mode (implement features from PRD)
# ─────────────────────────────────────────────────────────────

./scripts/ralph/ralph.sh 20                    # Run 20 iterations
./scripts/ralph/ralph.sh --skip-tests 20       # Skip test gate
./scripts/ralph/ralph.sh --skip-lint 20        # Skip lint gate
./scripts/ralph/ralph.sh --dry-run 20          # No commits
./scripts/ralph/ralph.sh --branch feat/auth 20 # Custom branch

# ─────────────────────────────────────────────────────────────
#  Single-Task Mode (quick fixes without PRD)
# ─────────────────────────────────────────────────────────────

./scripts/ralph/ralph.sh --task "Fix the header alignment"
./scripts/ralph/ralph.sh --task "Add error boundary to App component"
./scripts/ralph/ralph.sh --task "Update dependencies to latest versions"

# ─────────────────────────────────────────────────────────────
#  Status & Management
# ─────────────────────────────────────────────────────────────

node scripts/run-ralph.js --status     # Show completion progress
node scripts/run-ralph.js --validate   # Validate PRD schema
node scripts/run-ralph.js --analyze    # Re-run project analysis
node scripts/run-ralph.js --reset      # Reset progress.txt
```

---

## ✨ Features

### 🔍 Intelligent Project Analysis

Supreme RALPH analyzes your entire codebase to understand:

- **Language & Framework** — TypeScript, JavaScript, Python, Go, Rust, and more
- **Test Framework** — Vitest, Jest, Mocha, pytest, go test, etc.
- **Linting Tools** — ESLint, Biome, Prettier, Ruff, golangci-lint
- **Build System** — Vite, Webpack, esbuild, Rollup, Turbopack
- **Module System** — ES Modules, CommonJS, mixed
- **Dependencies** — 300+ known packages with purpose descriptions
- **Code Patterns** — Naming conventions, import order, project structure

### 📄 Generated Files

```
your-project/
├── CLAUDE.md                    # Main Claude instructions
├── PROJECT_SPEC.md              # Auto-generated project analysis
│
├── .claude/
│   ├── settings.json            # Permissions & environment
│   ├── rules/
│   │   ├── code-style.md        # General code style
│   │   ├── javascript-style.md  # JS/TS specific rules
│   │   └── security.md          # Security best practices
│   ├── commands/
│   │   ├── review.md            # /review command
│   │   ├── test.md              # /test command
│   │   └── deploy.md            # /deploy command
│   ├── agents/
│   │   ├── code-reviewer.md     # Code review specialist
│   │   └── debugger.md          # Debugging specialist
│   ├── skills/
│   │   ├── prd/                 # PRD generation
│   │   ├── ralph/               # RALPH conversion
│   │   └── ralph-run/           # RALPH runner
│   └── hooks/
│       ├── hooks.json           # Hook configuration
│       ├── validate-bash.sh     # Command validation
│       └── auto-compact.sh      # Context monitoring (70%)
│
├── .ralph/
│   ├── config.yaml              # RALPH configuration
│   └── progress.txt             # Iteration learnings
│
├── scripts/ralph/
│   ├── ralph.sh                 # Main RALPH script
│   ├── CLAUDE.md                # RALPH-specific prompt
│   └── prd.json.example         # Example PRD
│
└── tasks/
    └── prd-*.md                 # Generated PRD documents
```

### 📚 Knowledge Base Sync

Keep up-to-date with Anthropic documentation:

```bash
# Sync latest docs
claude-init sync

# Check for updates
claude-init check
```

### 📧 AI Newsletter Aggregation

Curated Claude/Anthropic news from multiple sources:

```bash
# Fetch latest news
claude-init news --refresh

# Preview newsletter
claude-init email --dry-run

# Send newsletter (requires RESEND_API_KEY)
claude-init email
```

**Sources:** Anthropic Blog, TechCrunch, The Verge, Ars Technica, Hacker News, Reddit

---

## 📋 Commands Reference

| Command | Description |
|---------|-------------|
| `claude-init setup` | Initialize project with Claude Code best practices |
| `claude-init setup --yes` | Setup with all defaults |
| `claude-init setup --feature "..."` | Setup + create PRD for feature |
| `claude-init ralph 20` | Run RALPH for 20 iterations |
| `claude-init ralph --status` | Show PRD completion status |
| `claude-init ralph --validate` | Validate prd.json schema |
| `claude-init ralph --analyze` | Re-analyze project |
| `claude-init ralph --reset` | Reset progress.txt |
| `claude-init sync` | Sync Anthropic documentation |
| `claude-init news --refresh` | Fetch latest AI news |
| `claude-init email --dry-run` | Preview newsletter |
| `claude-init projects` | List tracked projects |
| `claude-init validate` | Validate template files |

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `COMPACT_THRESHOLD` | Auto-compact at N% context usage | `70` |
| `RALPH_MAX_ITERATIONS` | Maximum RALPH iterations | `10` |
| `HTTP_RETRIES` | HTTP retry attempts | `3` |
| `HTTP_TIMEOUT` | HTTP timeout in milliseconds | `30000` |
| `DEBUG` | Enable debug logging | — |
| `LOG_LEVEL` | Log level (debug/info/warn/error) | `info` |
| `NO_COLOR` | Disable colored output | — |
| `CLAUDE_INIT_THEME` | UI theme (default/light/dark) | `default` |
| `RESEND_API_KEY` | Resend API key for emails | — |
| `EMAIL_TO` | Newsletter recipient | — |
| `EMAIL_FROM` | Newsletter sender | — |

---

## 🏗️ Project Structure

```
supreme-ralph/
├── bin/
│   └── claude-init.js              # CLI entry point
│
├── scripts/
│   ├── setup-project.js            # Main setup logic
│   ├── run-ralph.js                # RALPH runner
│   ├── sync-knowledge.js           # Knowledge base sync
│   ├── fetch-news.js               # News aggregation
│   ├── send-email-summary.js       # Newsletter sender
│   │
│   ├── setup/
│   │   ├── phases.js               # Setup workflow phases
│   │   ├── template-writer.js      # Template file writing
│   │   └── ralph-setup.js          # RALPH-specific setup
│   │
│   ├── data/
│   │   ├── dependency-purposes.js  # 300+ npm package descriptions
│   │   ├── test-frameworks.js      # Test framework detection
│   │   ├── linting-tools.js        # Linter detection
│   │   └── build-tools.js          # Build tool detection
│   │
│   └── utils/
│       ├── project-analyzer.js     # Deep project analysis
│       ├── spec-generator.js       # PROJECT_SPEC.md generation
│       ├── template-engine.js      # Handlebars-like templates
│       ├── prd-validator.js        # PRD schema validation
│       ├── config-manager.js       # Configuration management
│       ├── http-client.js          # HTTP with retry logic
│       ├── design-system.js        # CLI UI components
│       └── ...
│
├── templates/
│   ├── ralph/
│   │   ├── CLAUDE.md.template      # RALPH prompt template
│   │   ├── ralph.sh.template       # Bash loop script
│   │   ├── config.yaml.template    # Config template
│   │   └── skills/                 # RALPH skills
│   ├── rules/                      # Code style templates
│   ├── commands/                   # Slash commands
│   ├── agents/                     # Agent templates
│   └── hooks/                      # Hook scripts
│
├── knowledge-base/                 # Synced Anthropic docs
├── tests/                          # Vitest test suite
└── examples/                       # Example configurations
```

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Runtime** | Node.js 18+ (ES Modules) |
| **CLI Framework** | Commander.js |
| **File Operations** | fs-extra |
| **User Prompts** | Inquirer |
| **Terminal UI** | Chalk, Ora |
| **HTTP Client** | node-fetch with retry |
| **Template Engine** | Custom (Handlebars-like) |
| **Testing** | Vitest |
| **Email** | Resend API |
| **Parsing** | fast-xml-parser, Turndown, YAML |

---

## 🧪 Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Setup on current project
npm run setup

# Validate templates
npm run validate
```

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

Please ensure your PR:
- Passes all tests (`npm test`)
- Follows existing code style
- Includes relevant documentation updates

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <sub>Built with Claude • Autonomous AI development, done right.</sub>
</p>

<p align="center">
  <a href="https://github.com/doravidan/supreme-ralph/issues">Report Bug</a> •
  <a href="https://github.com/doravidan/supreme-ralph/issues">Request Feature</a> •
  <a href="https://github.com/doravidan/supreme-ralph/stargazers">Star on GitHub</a>
</p>
