# API Documentation

This document describes the public API for claude-init modules.

## Table of Contents

- [config-manager](#config-manager)
- [fs-helper](#fs-helper)
- [template-engine](#template-engine)
- [http-client](#http-client)
- [logger](#logger)
- [prd-validator](#prd-validator)
- [design-system](#design-system)
- [project-analyzer](#project-analyzer)
- [news-aggregator](#news-aggregator)
- [Data Registries](#data-registries)

---

## config-manager

Centralized configuration management with environment variable overrides.

### Import

```javascript
import { CONFIG, getConfig, getFlatConfig } from './scripts/utils/config-manager.js';
```

### CONFIG

The main configuration object with all settings.

```javascript
CONFIG.compact.threshold       // 70
CONFIG.compact.maxContextTokens // 200000
CONFIG.ralph.defaultMaxIterations // 10
CONFIG.http.retries           // 3
CONFIG.http.timeout           // 30000
CONFIG.news.cacheTtl          // 7200000 (2 hours)
```

### getConfig(path, defaultValue)

Get a nested configuration value.

| Parameter | Type | Description |
|-----------|------|-------------|
| path | string | Dot-notation path (e.g., 'compact.threshold') |
| defaultValue | any | Value to return if path not found |

```javascript
const threshold = getConfig('compact.threshold', 70);
const apiUrl = getConfig('api.endpoint.url', 'https://default.com');
```

### getFlatConfig()

Returns a flattened configuration object.

```javascript
const flat = getFlatConfig();
// { 'compact.threshold': 70, 'http.retries': 3, ... }
```

### Environment Variable Overrides

| Variable | Config Path |
|----------|-------------|
| `COMPACT_THRESHOLD` | compact.threshold |
| `MAX_CONTEXT_TOKENS` | compact.maxContextTokens |
| `RALPH_MAX_ITERATIONS` | ralph.defaultMaxIterations |
| `HTTP_RETRIES` | http.retries |
| `HTTP_TIMEOUT` | http.timeout |

---

## fs-helper

File system utilities with consistent error handling.

### Import

```javascript
import {
  safeReadJson,
  safeReadFile,
  safeWriteFile,
  safeWriteJson,
  ensureDirs,
  findFilesByPattern,
  readDirRecursive,
  exists,
  isDirectory,
  isFile
} from './scripts/utils/fs-helper.js';
```

### safeReadJson(filePath, defaultValue)

Read and parse a JSON file with fallback.

| Parameter | Type | Description |
|-----------|------|-------------|
| filePath | string | Path to JSON file |
| defaultValue | any | Value to return on error |

```javascript
const config = await safeReadJson('./config.json', { version: '1.0.0' });
```

### safeReadFile(filePath, defaultValue)

Read a file as text with fallback.

| Parameter | Type | Description |
|-----------|------|-------------|
| filePath | string | Path to file |
| defaultValue | string | Value to return on error (default: '') |

```javascript
const content = await safeReadFile('./readme.txt', 'No readme');
```

### safeWriteFile(filePath, content)

Write content to file, creating directories as needed.

| Parameter | Type | Description |
|-----------|------|-------------|
| filePath | string | Path to file |
| content | string | Content to write |

Returns: `Promise<boolean>` - true on success

```javascript
const success = await safeWriteFile('./output/file.txt', 'content');
```

### safeWriteJson(filePath, data, options)

Write JSON to file with formatting.

| Parameter | Type | Description |
|-----------|------|-------------|
| filePath | string | Path to file |
| data | object | Data to write |
| options | object | fs-extra options (default: { spaces: 2 }) |

```javascript
await safeWriteJson('./config.json', { key: 'value' });
```

### ensureDirs(paths)

Create multiple directories.

| Parameter | Type | Description |
|-----------|------|-------------|
| paths | string[] | Array of directory paths |

```javascript
await ensureDirs(['./output/a', './output/b', './output/c']);
```

### findFilesByPattern(dir, pattern, options)

Find files matching a glob pattern with caching.

| Parameter | Type | Description |
|-----------|------|-------------|
| dir | string | Directory to search |
| pattern | string | Glob pattern |
| options.cache | boolean | Use cache (default: true) |

```javascript
const mdFiles = await findFilesByPattern('/project', '**/*.md');
const jsFiles = await findFilesByPattern('/src', '*.js', { cache: false });
```

### readDirRecursive(dir, options)

Read directory recursively.

| Parameter | Type | Description |
|-----------|------|-------------|
| dir | string | Directory to read |
| options.maxDepth | number | Max recursion depth |
| options.filter | function | Filter function for entries |

```javascript
const files = await readDirRecursive('/project', {
  maxDepth: 3,
  filter: entry => !entry.name.startsWith('.')
});
```

### exists(path)

Check if path exists.

```javascript
if (await exists('./config.json')) { ... }
```

### isDirectory(path) / isFile(path)

Check path type.

```javascript
if (await isDirectory('./src')) { ... }
if (await isFile('./package.json')) { ... }
```

---

## template-engine

Template rendering with variables, conditionals, and loops.

### Import

```javascript
import {
  TemplateEngine,
  render,
  validate,
  createEngine,
  applyVariables
} from './scripts/utils/template-engine.js';
```

### render(template, variables)

Render a template string with variables.

| Parameter | Type | Description |
|-----------|------|-------------|
| template | string | Template with {{placeholders}} |
| variables | object | Values to substitute |

```javascript
const output = render('Hello {{name}}!', { name: 'World' });
// "Hello World!"
```

### Template Syntax

**Variables:**
```
{{name}}           - Simple variable
{{user.name}}      - Nested path
{{@index}}         - Loop index (0-based)
{{@first}}         - Is first iteration (boolean)
{{@last}}          - Is last iteration (boolean)
{{this}}           - Current item in loop
```

**Conditionals:**
```
{{#if condition}}
  Content when true
{{else}}
  Content when false
{{/if}}
```

**Loops:**
```
{{#each items}}
  {{name}} at index {{@index}}
{{/each}}
```

### validate(template)

Validate template syntax.

| Parameter | Type | Description |
|-----------|------|-------------|
| template | string | Template to validate |

Returns:
```javascript
{
  valid: boolean,
  errors: string[],
  variables: string[],    // Found variables
  conditionals: string[], // Found conditionals
  loops: string[]         // Found loops
}
```

```javascript
const result = validate('{{#if active}}{{name}}{{/if}}');
// { valid: true, errors: [], variables: ['name'], conditionals: ['active'], loops: [] }
```

### TemplateEngine

Class for custom template engines.

```javascript
const engine = new TemplateEngine({
  strictMode: true,      // Throw on missing variables
  warnOnMissing: true,   // Console warn on missing
  undefinedValue: 'N/A'  // Replace missing with this
});

const output = engine.render(template, variables);
```

### createEngine(options)

Factory function for creating engines.

```javascript
const strictEngine = createEngine({ strictMode: true });
```

---

## http-client

HTTP client with retry logic and exponential backoff.

### Import

```javascript
import httpClient, {
  fetchWithRetry,
  fetchAllSettled,
  HttpClient
} from './scripts/utils/http-client.js';
```

### httpClient (default export)

Pre-configured client instance.

```javascript
// GET request with retries
const data = await httpClient.getJson('https://api.example.com/data');

// GET request with options
const response = await httpClient.get('https://example.com', {
  headers: { 'Authorization': 'Bearer token' }
});
```

### HttpClient Class

```javascript
const client = new HttpClient({
  retries: 3,           // Max retry attempts
  retryDelay: 1000,     // Initial delay (ms)
  backoffFactor: 2,     // Exponential backoff multiplier
  timeout: 30000,       // Request timeout (ms)
  userAgent: 'MyApp/1.0'
});
```

**Methods:**

| Method | Description |
|--------|-------------|
| `get(url, options)` | GET request |
| `getJson(url, options)` | GET and parse JSON |
| `post(url, data, options)` | POST request |
| `postJson(url, data, options)` | POST JSON data |

### fetchWithRetry(url, options)

Fetch with automatic retries.

```javascript
const response = await fetchWithRetry('https://api.example.com', {
  retries: 5,
  timeout: 10000
});
```

### fetchAllSettled(urls, options)

Fetch multiple URLs, handling partial failures.

```javascript
const results = await fetchAllSettled([url1, url2, url3]);
results.forEach((result, i) => {
  if (result.status === 'fulfilled') {
    console.log('Success:', result.value);
  } else {
    console.log('Failed:', result.reason);
  }
});
```

---

## logger

Debug logging with configurable levels.

### Import

```javascript
import {
  createLogger,
  Logger,
  analyzerLogger,
  newsLogger
} from './scripts/utils/logger.js';
```

### createLogger(name)

Create a named logger.

| Parameter | Type | Description |
|-----------|------|-------------|
| name | string | Logger name (appears in output) |

```javascript
const logger = createLogger('my-module');
logger.debug('Detailed debug info');
logger.info('General information');
logger.warn('Warning message');
logger.error('Error occurred');
```

### Logger Class

```javascript
const logger = new Logger('my-module', {
  level: 'debug',        // Minimum level to log
  prefix: '[MY-MOD]',    // Custom prefix
  timestamps: true       // Include timestamps
});
```

**Methods:**

| Method | Description |
|--------|-------------|
| `debug(msg, data?)` | Debug level |
| `info(msg, data?)` | Info level |
| `warn(msg, data?)` | Warning level |
| `error(msg, data?)` | Error level |
| `getWarnings()` | Get accumulated warnings |
| `getErrors()` | Get accumulated errors |
| `clearLogs()` | Clear accumulated logs |

### Pre-configured Loggers

```javascript
import { analyzerLogger, newsLogger } from './scripts/utils/logger.js';
```

### Environment Variables

| Variable | Effect |
|----------|--------|
| `DEBUG=1` | Enable debug level |
| `LOG_LEVEL=debug` | Set log level |

---

## prd-validator

PRD schema validation and statistics.

### Import

```javascript
import {
  validatePrd,
  getPrdStats,
  formatValidationResult
} from './scripts/utils/prd-validator.js';
```

### validatePrd(prd)

Validate PRD against schema.

| Parameter | Type | Description |
|-----------|------|-------------|
| prd | object | PRD object to validate |

Returns:
```javascript
{
  valid: boolean,
  errors: string[],
  warnings: string[]
}
```

```javascript
const result = validatePrd(prdJson);
if (!result.valid) {
  result.errors.forEach(e => console.error(e));
}
```

### getPrdStats(prd)

Get PRD progress statistics.

| Parameter | Type | Description |
|-----------|------|-------------|
| prd | object | PRD object |

Returns:
```javascript
{
  total: number,         // Total stories
  complete: number,      // Stories with passes: true
  remaining: number,     // Stories not passed
  percentComplete: number, // Completion percentage
  nextStory: object|null // First incomplete story
}
```

```javascript
const stats = getPrdStats(prd);
console.log(`Progress: ${stats.complete}/${stats.total} (${stats.percentComplete}%)`);
```

### formatValidationResult(result)

Format validation result for display.

```javascript
const formatted = formatValidationResult(result);
console.log(formatted);
// ✓ PRD validation passed
// or
// ✗ PRD validation failed
// - Error 1
// - Error 2
```

---

## design-system

CLI UI components with theme support.

### Import

```javascript
import {
  ui,
  icons,
  colors,
  getTheme,
  setTheme,
  getAvailableThemes,
  hasColors
} from './scripts/utils/design-system.js';
```

### ui

Main UI object with all methods.

**Status Messages:**
```javascript
ui.success('Operation completed');
ui.error('Something failed');
ui.warning('Be careful');
ui.info('FYI');
ui.muted('Less important');
```

**Text Only (no icons):**
```javascript
ui.successText('green text');
ui.errorText('red text');
ui.warningText('yellow text');
ui.mutedText('gray text');
```

**Headers:**
```javascript
ui.header('Main Header');
ui.subheader('Sub Header');
ui.section('Section Title');
```

**Lists:**
```javascript
ui.bullet('List item');
ui.numbered(1, 'First item');
ui.added('New item');
ui.modified('Changed item');
ui.removed('Deleted item');
ui.fileItem('file.js');
ui.folderItem('src/');
```

**Dividers:**
```javascript
ui.divider(50);       // Single line
ui.doubleDivider(50); // Double line
ui.blank();           // Empty line
ui.newline();         // Newline character
```

**Spinner:**
```javascript
const spinner = ui.spinner('Loading...');
spinner.start();
spinner.succeed('Done!');
// or
spinner.fail('Failed');
```

### icons

40+ Unicode icons for CLI output.

```javascript
icons.success    // ✓
icons.error      // ✗
icons.warning    // ⚠
icons.info       // ℹ
icons.add        // +
icons.modify     // ~
icons.remove     // -
icons.file       // 📄
icons.folder     // 📁
icons.arrowRight // →
icons.branch     // ⎇
icons.commit     // ●
icons.test       // 🧪
// ... and more
```

### colors

Theme-aware color functions.

```javascript
colors.primary('blue text');
colors.secondary('cyan text');
colors.success('green text');
colors.warning('yellow text');
colors.error('red text');
colors.muted('gray text');
colors.highlight('bright text');
```

### Theme Functions

```javascript
// Get current theme
const theme = getTheme(); // 'default', 'light', 'dark', 'no-color'

// Set theme
setTheme('dark');

// List available themes
const themes = getAvailableThemes(); // ['default', 'light', 'dark', 'no-color']

// Check if colors are enabled
if (hasColors()) {
  // Use colors
}
```

### Environment Variables

| Variable | Effect |
|----------|--------|
| `NO_COLOR` | Force no-color theme |
| `CLAUDE_INIT_THEME` | Set default theme |

---

## project-analyzer

Deep project analysis for intelligent configuration.

### Import

```javascript
import {
  analyzeProject,
  findDocumentation,
  buildDirectoryTree,
  clearCache,
  clearCacheForPath,
  getCacheStats
} from './scripts/utils/project-analyzer.js';
```

### analyzeProject(targetPath, options)

Analyze a project directory.

| Parameter | Type | Description |
|-----------|------|-------------|
| targetPath | string | Path to project |
| options.forceRefresh | boolean | Bypass cache |

Returns comprehensive analysis object:
```javascript
{
  overview: {
    name: string,
    description: string,
    purpose: string,
    version: string
  },
  techStack: {
    language: string,    // 'typescript', 'javascript', 'python', etc.
    framework: string,   // 'React', 'Express', 'FastAPI', etc.
    runtime: string,     // 'Node.js >=18'
    packageManager: string // 'npm', 'yarn', 'pnpm', 'pip', etc.
  },
  structure: {
    rootFiles: string[],
    directories: {
      src: { exists: boolean, purpose: string },
      tests: { exists: boolean, framework: string },
      docs: { exists: boolean, files: string[] },
      config: { exists: boolean, files: string[] }
    },
    entryPoints: string[]
  },
  dependencies: {
    production: [{ name, version, purpose }],
    development: [{ name, version, purpose }]
  },
  scripts: { [name]: command },
  patterns: {
    testing: { framework, location, coverage },
    types: { language, strict },
    linting: { tool, config },
    formatting: { tool, config }
  },
  documentation: {
    readme: { exists, summary },
    files: [{ path, title, summary }],
    existingSpecs: string[]
  },
  conventions: {
    namingStyle: string,
    moduleSystem: string,
    importOrder: string[]
  },
  warnings: string[],
  errors: string[]
}
```

### findDocumentation(targetPath)

Find documentation files in project.

Returns:
```javascript
{
  readme: { exists: boolean, summary: string },
  files: [{ path, title, summary }],
  existingSpecs: string[]
}
```

### buildDirectoryTree(targetPath, maxDepth)

Build ASCII directory tree.

```javascript
const tree = await buildDirectoryTree('/project', 3);
console.log(tree);
// project/
// ├── src/
// │   ├── index.js
// │   └── utils/
// └── package.json
```

### Cache Functions

```javascript
// Clear all caches
clearCache();

// Clear cache for specific path
clearCacheForPath('/project');

// Get cache statistics
const stats = getCacheStats();
// { analysisEntries: 2, markdownEntries: 5, totalEntries: 7 }
```

---

## news-aggregator

Multi-source news fetching and aggregation.

### Import

```javascript
import {
  aggregateNews,
  getNewsByCategory,
  getTopStory,
  getNewsStats,
  clearCache
} from './scripts/utils/news-aggregator.js';
```

### aggregateNews(options)

Fetch and aggregate news from all sources.

| Parameter | Type | Description |
|-----------|------|-------------|
| options.forceRefresh | boolean | Bypass cache |
| options.limit | number | Max items to return |

Returns:
```javascript
[
  {
    id: string,
    title: string,
    description: string,
    url: string,
    date: string,         // ISO date
    author: string,
    source: string,       // Source name
    sourceIcon: string,   // Emoji icon
    category: string,     // 'official', 'product', 'research', etc.
    relevanceScore: number,
    credibilityScore: number,
    totalScore: number,
    isRelevant: boolean,
    points?: number,      // HN points
    numComments?: number
  }
]
```

### getNewsByCategory(category, limit)

Get news filtered by category.

```javascript
const officialNews = await getNewsByCategory('official', 5);
```

Categories: `official`, `product`, `research`, `community`, `tutorial`, `opinion`

### getTopStory()

Get the highest-scored news item.

```javascript
const top = await getTopStory();
```

### getNewsStats()

Get news statistics.

```javascript
const stats = await getNewsStats();
// { total, byCategory, bySource, latestDate, oldestDate }
```

### clearCache()

Clear the news cache.

```javascript
await clearCache();
```

---

## Data Registries

### dependency-purposes.js

```javascript
import {
  DEPENDENCY_PURPOSES,
  getDependencyPurpose
} from './scripts/data/dependency-purposes.js';

// Get purpose for known package
const purpose = getDependencyPurpose('react');
// "UI library for building user interfaces"

// Access full registry
DEPENDENCY_PURPOSES['express']; // "Fast, minimalist web framework"
```

### test-frameworks.js

```javascript
import {
  TEST_FRAMEWORKS,
  detectTestFramework
} from './scripts/data/test-frameworks.js';

// Detect from packages and files
const framework = detectTestFramework(
  ['vitest', 'react'],        // packages
  ['vitest.config.js']        // config files
);
// { key: 'vitest', name: 'Vitest', category: 'unit', ... }

// Access registry
TEST_FRAMEWORKS.jest.packages; // ['jest']
```

### linting-tools.js

```javascript
import {
  LINTING_TOOLS,
  detectLintingTools
} from './scripts/data/linting-tools.js';

const tools = detectLintingTools(['eslint'], ['.eslintrc.js']);
// [{ key: 'eslint', name: 'ESLint', ... }]
```

### build-tools.js

```javascript
import {
  BUILD_TOOLS,
  detectBuildTools,
  getBuildCommands
} from './scripts/data/build-tools.js';

const tools = detectBuildTools(['vite'], ['vite.config.js']);
const commands = getBuildCommands(tools[0]);
// { build: 'vite build', dev: 'vite', ... }
```
