# claude-init

[![npm version](https://badge.fury.io/js/claude-init.svg)](https://badge.fury.io/js/claude-init)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A CLI tool for scaffolding projects with Claude Code best practices. Features intelligent project analysis, RALPH autonomous development, and AI newsletter aggregation.

## Features

- **Intelligent Project Setup** - Automatically analyzes your project structure, dependencies, and patterns to generate tailored configuration
- **RALPH Autonomous Development** - PRD-driven autonomous agent that implements features iteratively with quality gates
- **Comprehensive Templates** - Rules, commands, agents, skills, and hooks for Claude Code
- **AI News Aggregation** - Curated Claude/Anthropic news from RSS feeds, Hacker News, and Reddit
- **Knowledge Base Sync** - Keep up-to-date with Anthropic documentation changes

## Installation

```bash
# Install globally
npm install -g claude-init

# Or run directly with npx
npx claude-init setup
```

## Quick Start

```bash
# Initialize a new project with Claude Code best practices
claude-init setup

# Setup with automatic yes to all prompts
claude-init setup --yes

# Setup and create a PRD for a feature
claude-init setup --yes --feature "User authentication system"

# Check RALPH status
claude-init ralph --status

# Run RALPH for 20 iterations
claude-init ralph 20
```

## Commands

| Command | Description |
|---------|-------------|
| `claude-init setup` | Initialize project with Claude Code configuration |
| `claude-init ralph` | Run RALPH autonomous development |
| `claude-init sync` | Sync Anthropic documentation to knowledge base |
| `claude-init news` | Fetch and display Claude/Anthropic news |
| `claude-init email` | Send/preview newsletter summary |
| `claude-init validate` | Validate template files |
| `claude-init projects` | List tracked projects |

### Setup Options

```bash
claude-init setup [options]

Options:
  -t, --target <path>   Target directory (default: current directory)
  -y, --yes             Accept all defaults
  --feature <name>      Create PRD for a feature
  --skip-analysis       Skip project analysis
  --skip-ralph          Skip RALPH setup
```

### RALPH Options

```bash
claude-init ralph [iterations] [options]

Options:
  -t, --target <path>   Target project directory
  --status              Show PRD status
  --validate            Validate prd.json
  --analyze             Re-analyze project
  --reset               Reset progress.txt
  --init                Initialize RALPH in existing project
```

## What Gets Created

When you run `claude-init setup`, the following structure is created:

```
your-project/
├── CLAUDE.md              # Project-specific instructions for Claude
├── PROJECT_SPEC.md        # Auto-generated project specification
├── .claude/
│   ├── settings.json      # Claude Code settings
│   ├── rules/             # Code style rules
│   │   ├── code-style.md
│   │   ├── javascript-style.md
│   │   └── security.md
│   ├── commands/          # Slash commands
│   │   ├── review-code.md
│   │   └── run-tests.md
│   ├── agents/            # Custom agents
│   │   └── code-reviewer.md
│   ├── skills/            # Skills
│   │   └── ralph/
│   └── hooks/             # Event hooks
│       └── post-tool.sh
├── scripts/
│   └── ralph/             # RALPH autonomous agent
│       ├── ralph.sh
│       └── CLAUDE.md
├── tasks/                 # PRD tasks (if --feature used)
│   └── prd-*.md
├── prd.json              # PRD for RALPH (if --feature used)
└── progress.txt          # RALPH progress log
```

## RALPH Workflow

RALPH (Rapid Autonomous Loop for Product Hypotheses) is an autonomous development system that:

1. **Reads** user stories from `prd.json`
2. **Implements** one story per iteration
3. **Validates** against quality gates (typecheck, lint, tests)
4. **Records** learnings in `progress.txt`
5. **Loops** until all stories pass or max iterations reached

### Creating a PRD

```bash
# Option 1: Setup with feature
claude-init setup --feature "Add dark mode toggle"

# Option 2: Use the PRD skill in Claude Code
/prd Create a PRD for user authentication

# Option 3: Manual prd.json
# See examples/prd.json for format
```

### Running RALPH

```bash
# Run for 20 iterations
./scripts/ralph/ralph.sh 20

# Or via CLI
claude-init ralph 20

# Check status anytime
claude-init ralph --status

# Validate PRD before running
claude-init ralph --validate
```

## News Aggregation

Stay updated with Claude/Anthropic news:

```bash
# Fetch latest news
claude-init news --refresh

# Limit results
claude-init news --limit 5

# Preview newsletter
claude-init email --dry-run
```

## Configuration

### Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `COMPACT_THRESHOLD` | Auto-compact at N% context | 70 |
| `RALPH_MAX_ITERATIONS` | Max RALPH iterations | 10 |
| `HTTP_RETRIES` | HTTP retry count | 3 |
| `HTTP_TIMEOUT` | HTTP timeout (ms) | 30000 |
| `DEBUG` | Enable debug logging | - |
| `LOG_LEVEL` | Log level (debug/info/warn/error) | info |
| `NO_COLOR` | Disable colored output | - |
| `CLAUDE_INIT_THEME` | UI theme (default/light/dark/no-color) | default |
| `RESEND_API_KEY` | Email sending API key | - |
| `EMAIL_TO` | Newsletter recipient | - |
| `EMAIL_FROM` | Newsletter sender | - |

## Requirements

- Node.js 18+
- npm, yarn, pnpm, or bun

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## API Documentation

See [API.md](API.md) for detailed module documentation.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for system design and data flow.

## License

MIT - see [LICENSE](LICENSE) for details.

## Links

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [RALPH Methodology](https://docs.anthropic.com/en/docs/claude-code/tutorials/autonomous)
- [Report Issues](https://github.com/anthropics/claude-code/issues)
