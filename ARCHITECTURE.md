# Architecture

This document describes the high-level architecture and data flow of claude-init.

## System Overview

claude-init is a CLI tool that scaffolds projects with Claude Code best practices. It consists of several interconnected subsystems:

```
┌────────────────────────────────────────────────────────────────────────┐
│                              CLI Layer                                  │
│  bin/claude-init.js → Commander.js → Routes to appropriate script      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Core Scripts                                   │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ setup-project.js│  │ run-ralph.js │  │ sync-knowledge.js        │   │
│  │                 │  │              │  │ fetch-news.js            │   │
│  │ Project setup   │  │ RALPH runner │  │ send-email-summary.js    │   │
│  └────────┬────────┘  └──────┬───────┘  └────────────┬─────────────┘   │
└───────────┼──────────────────┼───────────────────────┼─────────────────┘
            │                  │                       │
            ▼                  ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Utility Layer                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │ config-manager  │  │ template-engine │  │ project-analyzer        │ │
│  │ fs-helper       │  │ http-client     │  │ spec-generator          │ │
│  │ logger          │  │ prd-validator   │  │ news-aggregator         │ │
│  │ design-system   │  │ email-templates │  │ content-summarizer      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
            │                  │                       │
            ▼                  ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Data Layer                                     │
│  ┌──────────────────────┐  ┌──────────────────┐  ┌────────────────────┐│
│  │ dependency-purposes  │  │ templates/       │  │ knowledge-base/    ││
│  │ test-frameworks      │  │   ralph/         │  │   docs/            ││
│  │ linting-tools        │  │   rules/         │  │   .cache/          ││
│  │ build-tools          │  │   commands/      │  │                    ││
│  └──────────────────────┘  └──────────────────┘  └────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Setup Flow

```
User runs: claude-init setup --yes --feature "Auth"
                              │
                              ▼
                    ┌─────────────────┐
                    │ Parse CLI args  │
                    │ Commander.js    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Validate target │
                    │ directory       │
                    └────────┬────────┘
                             │
                             ▼
          ┌──────────────────┴──────────────────┐
          │                                     │
          ▼                                     ▼
┌─────────────────┐                   ┌─────────────────┐
│ Gather config   │                   │ Analyze project │
│ (prompts or     │                   │ project-analyzer│
│  defaults)      │                   │                 │
└────────┬────────┘                   └────────┬────────┘
         │                                     │
         └──────────────────┬──────────────────┘
                            │
                            ▼
                  ┌─────────────────┐
                  │ Generate spec   │
                  │ PROJECT_SPEC.md │
                  │ spec-generator  │
                  └────────┬────────┘
                           │
                           ▼
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Write        │  │ Write        │  │ Write        │
│ CLAUDE.md    │  │ .claude/     │  │ scripts/     │
│              │  │ (rules,      │  │ ralph/       │
│              │  │  commands,   │  │              │
│              │  │  agents...)  │  │              │
└──────────────┘  └──────────────┘  └──────┬───────┘
                                           │
                                           ▼
                                   ┌──────────────┐
                                   │ Generate PRD │
                                   │ (if feature) │
                                   │ prd.json     │
                                   └──────────────┘
```

### RALPH Flow

```
User runs: claude-init ralph 20
                    │
                    ▼
          ┌─────────────────┐
          │ Load prd.json   │
          │ Validate schema │
          │ prd-validator   │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ Show status     │
          │ getPrdStats()   │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ Execute         │
          │ ralph.sh        │
          └────────┬────────┘
                   │
          ┌────────┴────────┐
          │  For each       │
          │  iteration:     │
          ├─────────────────┤
          │                 │
          ▼                 │
┌─────────────────┐        │
│ Fresh Claude    │        │
│ context with    │        │
│ CLAUDE.md       │        │
└────────┬────────┘        │
         │                 │
         ▼                 │
┌─────────────────┐        │
│ Work on current │        │
│ user story      │        │
└────────┬────────┘        │
         │                 │
         ▼                 │
┌─────────────────┐        │
│ Quality gates:  │        │
│ typecheck/lint/ │        │
│ tests           │        │
└────────┬────────┘        │
         │                 │
         ▼                 │
┌─────────────────┐        │
│ Update prd.json │        │
│ passes: true/   │        │
│ false           │        │
└────────┬────────┘        │
         │                 │
         ▼                 │
┌─────────────────┐        │
│ Append to       │        │
│ progress.txt    │        │
└────────┬────────┘        │
         │                 │
         └────────►────────┘
```

### News Aggregation Flow

```
User runs: claude-init news --refresh
                    │
                    ▼
          ┌─────────────────┐
          │ Check cache     │
          │ news-aggregator │
          └────────┬────────┘
                   │
       ┌───────────┴───────────┐ Cache miss or
       │                       │ --refresh
       ▼                       ▼
┌─────────────┐  ┌──────────────────────────────────────────┐
│ Return      │  │         Parallel Fetch                   │
│ cached data │  │  ┌────────────┬─────────────┬──────────┐ │
└─────────────┘  │  ▼            ▼             ▼          │ │
                 │ RSS feeds   HN API      Reddit API     │ │
                 │ (xmlparser) (http-client) (http-client)│ │
                 │  └────────────┴─────────────┴──────────┘ │
                 │                    │                     │
                 └────────────────────┼─────────────────────┘
                                      │
                                      ▼
                            ┌─────────────────┐
                            │ Process items:  │
                            │ - Parse dates   │
                            │ - Filter Claude │
                            │   /Anthropic    │
                            │ - Score items   │
                            │ - Deduplicate   │
                            └────────┬────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │ Cache results   │
                            │ Return to user  │
                            └─────────────────┘
```

## Module Dependencies

```
bin/claude-init.js
├── scripts/setup-project.js
│   ├── scripts/setup/phases.js
│   ├── scripts/setup/template-writer.js
│   │   └── scripts/utils/template-engine.js
│   ├── scripts/setup/ralph-setup.js
│   │   └── scripts/utils/template-engine.js
│   ├── scripts/utils/project-analyzer.js
│   │   ├── scripts/utils/config-manager.js
│   │   ├── scripts/utils/fs-helper.js
│   │   ├── scripts/utils/logger.js
│   │   ├── scripts/data/dependency-purposes.js
│   │   ├── scripts/data/test-frameworks.js
│   │   ├── scripts/data/linting-tools.js
│   │   └── scripts/data/build-tools.js
│   ├── scripts/utils/spec-generator.js
│   │   └── scripts/utils/template-engine.js
│   ├── scripts/utils/design-system.js
│   └── scripts/utils/config-manager.js
│
├── scripts/run-ralph.js
│   ├── scripts/utils/prd-validator.js
│   ├── scripts/utils/project-analyzer.js
│   ├── scripts/utils/spec-generator.js
│   ├── scripts/utils/config-manager.js
│   └── scripts/utils/template-engine.js
│
├── scripts/fetch-news.js
│   └── scripts/utils/news-aggregator.js
│       ├── scripts/utils/news-sources.js
│       ├── scripts/utils/http-client.js
│       ├── scripts/utils/config-manager.js
│       └── scripts/utils/logger.js
│
└── scripts/send-email-summary.js
    ├── scripts/utils/email-templates.js
    │   └── scripts/utils/template-engine.js
    ├── scripts/utils/news-aggregator.js
    └── scripts/utils/design-system.js
```

## Key Design Decisions

### 1. ES Modules

All code uses ES modules (`import`/`export`) for:
- Better static analysis
- Native Node.js support (18+)
- Clearer dependency graphs
- Future-proof codebase

### 2. Centralized Configuration

`config-manager.js` provides:
- Single source of truth for all settings
- Environment variable overrides
- Easy testing with different configs
- Documentation of all options

### 3. Caching Strategy

Multiple caching layers:
- **Project analyzer**: Caches analysis by directory mtime
- **News aggregator**: Caches results for 2 hours
- **File pattern search**: Caches glob results

### 4. Error Handling

Consistent error handling pattern:
- Graceful degradation (partial failures don't break everything)
- Debug logging for troubleshooting
- User-friendly error messages via chalk

### 5. Template System

Custom template engine supporting:
- Simple variable substitution `{{var}}`
- Conditionals `{{#if}}...{{/if}}`
- Loops `{{#each}}...{{/each}}`
- Validation with helpful error messages

### 6. Theme Support

Design system with themes:
- `default`: Standard colors
- `light`: Light terminal colors
- `dark`: High contrast for dark terminals
- `no-color`: Plain text (respects NO_COLOR standard)

## File Organization

### scripts/setup/

Setup-specific modules extracted from setup-project.js:
- `phases.js`: Workflow phase functions
- `template-writer.js`: Generic template writing
- `ralph-setup.js`: RALPH-specific setup

### scripts/data/

Data registries for detection:
- Framework/tool definitions
- Package purpose descriptions
- Detection logic

### scripts/utils/

Shared utilities:
- Each module is single-responsibility
- Minimal cross-dependencies
- Well-documented APIs

### templates/

Template files organized by type:
- `ralph/`: RALPH autonomous agent
- `email/`: Email templates
- `rules/`, `commands/`, `agents/`, `skills/`, `hooks/`: Claude Code config

## Extension Points

### Adding a New CLI Command

1. Add command in `bin/claude-init.js`:
   ```javascript
   program
     .command('mycommand')
     .description('My command')
     .action(() => spawn('node', [path.join(scriptsDir, 'my-script.js')]));
   ```

2. Create `scripts/my-script.js`

### Adding a New Utility Module

1. Create `scripts/utils/my-module.js`
2. Add exports to module
3. Import where needed
4. Add tests in `tests/my-module.test.js`

### Adding a New Data Registry

1. Create `scripts/data/my-registry.js`
2. Export registry object and helper functions
3. Import in project-analyzer.js or relevant module

## Performance Considerations

### Startup Time

- Lazy loading of expensive modules
- No synchronous file operations at startup
- Minimal dependency tree

### Memory Usage

- Stream large files when possible
- Clear caches when done
- Avoid loading entire directories into memory

### Network

- Parallel fetches with `Promise.allSettled`
- Retry with exponential backoff
- Configurable timeouts
- Response caching

## Testing Strategy

### Unit Tests

- Each utility module has tests
- Mock external dependencies
- Test edge cases and error paths

### Integration Tests

- Test complete CLI workflows
- Use temp directories
- Verify file creation and content

### Test Coverage

- Target 80%+ for critical modules
- Focus on business logic
- Skip trivial getters/setters
