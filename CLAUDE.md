# claude-init

A CLI tool for scaffolding projects with Claude Code best practices, featuring RALPH autonomous development and AI newsletter aggregation.

## Architecture Overview

```
claude-init/
├── bin/                       # CLI entry point
│   └── claude-init.js         # Main CLI with all commands
├── scripts/                   # Core functionality
│   ├── setup-project.js       # Project initialization (main feature)
│   ├── run-ralph.js           # RALPH autonomous agent runner
│   ├── sync-knowledge.js      # Fetch Anthropic docs
│   ├── send-email-summary.js  # Newsletter email sender
│   ├── fetch-news.js          # News aggregation CLI
│   ├── setup/                 # Setup phase modules
│   │   ├── phases.js          # Setup workflow phases
│   │   ├── template-writer.js # Generic template writing
│   │   └── ralph-setup.js     # RALPH-specific setup
│   ├── data/                  # Data registries
│   │   ├── dependency-purposes.js  # 300+ package descriptions
│   │   ├── test-frameworks.js      # 15+ test framework configs
│   │   ├── linting-tools.js        # 20+ linting tool configs
│   │   └── build-tools.js          # 25+ build tool configs
│   └── utils/                 # Shared utilities
│       ├── config-manager.js  # Centralized configuration
│       ├── fs-helper.js       # File system utilities
│       ├── template-engine.js # Template rendering engine
│       ├── http-client.js     # HTTP client with retry logic
│       ├── logger.js          # Debug logging utility
│       ├── project-analyzer.js # Deep project analysis
│       ├── spec-generator.js  # PROJECT_SPEC.md generation
│       ├── prd-validator.js   # PRD schema validation
│       ├── news-aggregator.js # Multi-source news fetcher
│       ├── news-sources.js    # RSS/API source definitions
│       ├── news-fetcher.js    # News formatting
│       ├── email-templates.js # Email template rendering
│       ├── project-registry.js # Global project tracking
│       ├── template-generator.js # Config file generation
│       ├── content-summarizer.js # Doc change summaries
│       ├── diff-checker.js    # Track knowledge base changes
│       └── design-system.js   # CLI UI with themes
├── templates/                 # Project scaffolding templates
│   ├── ralph/                 # RALPH autonomous agent
│   │   ├── CLAUDE.md.template # RALPH prompt template
│   │   ├── ralph.sh.template  # Bash loop script
│   │   └── skills/            # PRD and conversion skills
│   ├── email/                 # Email templates
│   │   ├── newsletter.html    # HTML email template
│   │   ├── newsletter.txt     # Plain text template
│   │   └── styles.css         # CSS documentation
│   ├── rules/                 # Code style rules
│   ├── commands/              # Slash commands
│   ├── agents/                # Custom agents
│   ├── skills/                # Skill definitions
│   └── hooks/                 # Hook scripts
├── tests/                     # Test suite
│   ├── config-manager.test.js
│   ├── template-engine.test.js
│   ├── prd-validator.test.js
│   ├── design-system.test.js
│   ├── project-analyzer.test.js
│   ├── news-aggregator.test.js
│   └── cli-integration.test.js
├── knowledge-base/            # Synced Anthropic docs
└── examples/                  # Example project configs
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 18+ (ES Modules) |
| CLI Framework | Commander.js |
| File Operations | fs-extra |
| User Prompts | Inquirer |
| Terminal UI | Chalk, Ora |
| HTTP | node-fetch |
| XML Parsing | fast-xml-parser |
| Email | Resend API |
| Parsing | Turndown (HTML→MD), YAML |
| Testing | Vitest |

## Key Features

### 1. Project Setup (`claude-init setup`)
- Interactive project configuration
- Deep project analysis (language, framework, patterns, conventions)
- Generates comprehensive PROJECT_SPEC.md from analysis
- Creates CLAUDE.md, rules, commands, agents, skills, hooks
- Auto-compact at 70% context threshold
- RALPH integration with intelligent PRD generation based on project context

### 2. RALPH Autonomous Agent
- Implements features from PRD (prd.json)
- One story per iteration, fresh context each time
- Quality gates: typecheck, lint, tests
- Progress logging and pattern discovery
- PRD validation before execution

### 3. News Aggregation
- RSS feeds: Anthropic, TechCrunch, Verge, Ars Technica
- APIs: Hacker News Algolia, Reddit JSON
- Filters for Claude/Anthropic content only
- Newsletter-style email summaries

### 4. Knowledge Base Sync
- Fetches latest Anthropic documentation
- Tracks changes between syncs
- Summarizes updates for newsletters

## Utility Modules

### config-manager.js
Centralized configuration with environment variable overrides.

```javascript
import { CONFIG, getConfig } from './utils/config-manager.js';

// Access nested config
const threshold = getConfig('compact.threshold', 70);
const retries = CONFIG.http.retries;
```

**Key configurations:**
- `compact.threshold` - Auto-compact at N% context (default: 70)
- `compact.maxContextTokens` - Max tokens before compacting (default: 200000)
- `ralph.defaultMaxIterations` - RALPH iterations (default: 10)
- `http.retries` - HTTP retry count (default: 3)
- `http.timeout` - HTTP timeout in ms (default: 30000)
- `news.cacheTtl` - News cache duration (default: 2 hours)

### fs-helper.js
File system utilities with consistent error handling.

```javascript
import { safeReadJson, safeWriteFile, ensureDirs, findFilesByPattern } from './utils/fs-helper.js';

// Read JSON with fallback
const config = await safeReadJson('./config.json', { default: true });

// Find files with caching
const mdFiles = await findFilesByPattern('/project', '**/*.md');

// Batch directory creation
await ensureDirs(['/a/b', '/c/d']);
```

### template-engine.js
Template rendering with conditionals and loops.

```javascript
import { render, validate, TemplateEngine } from './utils/template-engine.js';

// Simple rendering
const output = render('Hello {{name}}!', { name: 'World' });

// With conditionals and loops
const template = `
{{#if hasItems}}
  {{#each items}}
    - {{name}} ({{@index}})
  {{/each}}
{{else}}
  No items
{{/if}}
`;

// Strict mode engine
const engine = new TemplateEngine({ strictMode: true });
```

### http-client.js
HTTP client with retry logic and exponential backoff.

```javascript
import httpClient, { fetchWithRetry, fetchAllSettled } from './utils/http-client.js';

// GET with retries
const data = await httpClient.getJson('https://api.example.com/data');

// Parallel fetches with partial failure handling
const results = await fetchAllSettled([url1, url2, url3]);
```

### logger.js
Debug logging with configurable levels.

```javascript
import { createLogger } from './utils/logger.js';

const logger = createLogger('my-module');
logger.debug('Detailed info');
logger.info('General info');
logger.warn('Warning message');
logger.error('Error occurred');
```

**Environment variables:**
- `DEBUG=1` - Enable debug logging
- `LOG_LEVEL=debug|info|warn|error|silent`

### prd-validator.js
PRD schema validation and statistics.

```javascript
import { validatePrd, getPrdStats, formatValidationResult } from './utils/prd-validator.js';

const result = validatePrd(prdJson);
if (!result.valid) {
  console.log('Errors:', result.errors);
  console.log('Warnings:', result.warnings);
}

const stats = getPrdStats(prdJson);
console.log(`Progress: ${stats.complete}/${stats.total} (${stats.percentComplete}%)`);
```

### design-system.js
CLI UI components with theme support.

```javascript
import { ui, icons, colors, setTheme, getAvailableThemes } from './utils/design-system.js';

// Status messages
ui.success('Operation completed');
ui.error('Something failed');
ui.warning('Be careful');
ui.info('FYI');

// Icons (40+ available)
console.log(icons.success, icons.error, icons.file, icons.folder);

// Theme-aware colors
console.log(colors.primary('Blue text'));
console.log(colors.success('Green text'));

// Theme control
setTheme('dark'); // 'default', 'light', 'dark', 'no-color'
console.log(getAvailableThemes()); // ['default', 'light', 'dark', 'no-color']

// Respects NO_COLOR environment variable
```

## Data Registries

### dependency-purposes.js
Maps 300+ npm packages to their purposes.

```javascript
import { DEPENDENCY_PURPOSES, getDependencyPurpose } from '../data/dependency-purposes.js';

const purpose = getDependencyPurpose('react'); // "UI library for building user interfaces"
```

### test-frameworks.js
Detects test frameworks from dependencies and config files.

```javascript
import { TEST_FRAMEWORKS, detectTestFramework } from '../data/test-frameworks.js';

const framework = detectTestFramework(['vitest', 'react'], ['vitest.config.js']);
// Returns: { key: 'vitest', name: 'Vitest', ... }
```

### linting-tools.js & build-tools.js
Similar registries for linting tools and build systems.

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run setup` | Run project setup |
| `npm run sync` | Sync knowledge base |
| `npm run check` | Check for doc updates |
| `npm run validate` | Validate templates |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `node scripts/fetch-news.js --refresh` | Fetch live news |
| `node scripts/send-email-summary.js --dry-run` | Preview newsletter |

## CLI Commands

```bash
claude-init setup [options]      # Initialize project
claude-init setup --feature "..." # Setup + create PRD
claude-init sync                  # Sync Anthropic docs
claude-init news --refresh        # Fetch latest news
claude-init ralph --status        # Show PRD status
claude-init ralph --validate      # Validate prd.json
claude-init ralph --analyze       # Re-analyze project
claude-init ralph --reset         # Reset progress.txt
claude-init ralph 20              # Run 20 iterations
claude-init projects              # List tracked projects
claude-init email --dry-run       # Preview newsletter
```

## Code Style

### ES Modules
- Use `import`/`export` exclusively
- Add `.js` extension to local imports
- Use `type: "module"` in package.json

### Async Patterns
```javascript
// Always use async/await
async function fetchData() {
  try {
    const result = await fetch(url);
    return result.json();
  } catch (error) {
    console.error(chalk.red('Failed:'), error.message);
    process.exit(1);
  }
}
```

### File Operations
- Use `fs-extra` for all file operations
- Use `fs.ensureDir()` before writing
- Use `fs.pathExists()` to check existence
- Prefer `fs-helper.js` utilities for common patterns

### CLI Output
- Use `chalk` for colored output
- Use `ora` for spinners
- Use `inquirer` for prompts
- Follow design-system.js patterns for consistency

### Path Handling
```javascript
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `RESEND_API_KEY` | Email sending API key | - |
| `EMAIL_TO` | Newsletter recipient | - |
| `EMAIL_FROM` | Newsletter sender | - |
| `COMPACT_THRESHOLD` | Auto-compact threshold | 70 |
| `RALPH_MAX_ITERATIONS` | Max RALPH iterations | 10 |
| `HTTP_RETRIES` | HTTP retry count | 3 |
| `HTTP_TIMEOUT` | HTTP timeout (ms) | 30000 |
| `DEBUG` | Enable debug logging | - |
| `LOG_LEVEL` | Log level | info |
| `NO_COLOR` | Disable colored output | - |
| `CLAUDE_INIT_THEME` | UI theme | default |

## Key Files

| File | Purpose |
|------|---------|
| `bin/claude-init.js` | CLI entry point, all commands |
| `scripts/setup-project.js` | Main setup logic, RALPH integration |
| `scripts/run-ralph.js` | RALPH runner with status/validate/reset/analyze |
| `scripts/setup/phases.js` | Setup workflow phases |
| `scripts/setup/template-writer.js` | Generic template writing |
| `scripts/setup/ralph-setup.js` | RALPH-specific setup |
| `scripts/utils/config-manager.js` | Centralized configuration |
| `scripts/utils/template-engine.js` | Template rendering |
| `scripts/utils/http-client.js` | HTTP with retry logic |
| `scripts/utils/logger.js` | Debug logging |
| `scripts/utils/project-analyzer.js` | Deep project analysis |
| `scripts/utils/spec-generator.js` | PROJECT_SPEC.md generation |
| `scripts/utils/prd-validator.js` | PRD validation |
| `scripts/utils/design-system.js` | CLI UI with themes |
| `scripts/utils/news-aggregator.js` | RSS/API fetching |
| `scripts/utils/email-templates.js` | Email rendering |
| `scripts/data/dependency-purposes.js` | Package descriptions |
| `scripts/data/test-frameworks.js` | Test framework configs |
| `templates/ralph/CLAUDE.md.template` | RALPH prompt |
| `templates/ralph/ralph.sh.template` | RALPH bash loop |

## Security

### Do NOT
- Commit API keys or secrets
- Store credentials in code
- Log sensitive information

### Do
- Use environment variables for secrets
- Validate user input in templates
- Sanitize file paths

## Files to Avoid Reading

```
node_modules/
knowledge-base/.cache/
*.log
.env
.env.*
coverage/
```

## RALPH Workflow

```bash
# 1. Setup with feature
claude-init setup --yes --feature "User authentication"

# 2. Review/customize PRD
cat prd.json
edit prd.json  # Adjust stories as needed

# 3. Validate PRD
claude-init ralph --validate

# 4. Run RALPH
./scripts/ralph/ralph.sh 20

# 5. Check status
claude-init ralph --status
```

## Testing

The project uses Vitest for testing.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

**Test categories:**
- Unit tests: `tests/*-*.test.js` (config-manager, template-engine, etc.)
- Integration tests: `tests/cli-integration.test.js`

**Test fixtures:**
- Project analyzer tests use temp directories with mock projects
- News aggregator tests mock fetch responses

## Summary Instructions

When compacting context, prioritize:
1. Current file being edited and its purpose
2. Error messages and their solutions
3. RALPH PRD status and current story
4. Config values being used

Deprioritize:
1. Full file contents after initial read
2. Large template files
3. Example project configurations
4. Node module contents
5. Test file contents

## Adding New Features

### Adding a News Source
1. Add RSS feed or API to `scripts/utils/news-sources.js`
2. Update `fetchAllRSSFeeds()` or add new fetch function in `news-aggregator.js`
3. Add relevance keywords if needed

### Adding a Framework Detection
1. Add entry to `scripts/data/test-frameworks.js`, `linting-tools.js`, or `build-tools.js`
2. Update `project-analyzer.js` if needed

### Adding a Template Type
1. Create template file in `templates/<type>/`
2. Add type config to `scripts/setup/template-writer.js`
3. Call `writeTemplates()` from setup-project.js
