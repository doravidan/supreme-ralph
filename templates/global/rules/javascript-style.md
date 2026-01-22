# JavaScript/Node.js Style Rules

## Module System
- Use ES6 modules (`import`/`export`) exclusively
- Use `type: "module"` in package.json
- Import order: Node built-ins → external packages → local modules

```javascript
// Good
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';
import { loadTemplate } from './utils/template-generator.js';

// Bad - CommonJS
const fs = require('fs-extra');
```

## Async Patterns
- Always use `async`/`await` over raw Promises
- Handle errors with try/catch blocks
- Provide user-friendly error messages via chalk

```javascript
// Good
async function fetchData() {
  try {
    const result = await fetch(url);
    return result.json();
  } catch (error) {
    console.error(chalk.red('Failed to fetch data:'), error.message);
    process.exit(1);
  }
}

// Bad
function fetchData() {
  return fetch(url)
    .then(r => r.json())
    .catch(e => console.log(e));
}
```

## File Operations
- Use `fs-extra` for all file operations (not native `fs`)
- Use `fs.ensureDir()` before writing to directories
- Use `fs.pathExists()` to check file existence

```javascript
// Good
import fs from 'fs-extra';
await fs.ensureDir(targetDir);
await fs.writeJson(filePath, data, { spaces: 2 });

// Bad
import fs from 'fs';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
```

## Terminal Output
- Use `chalk` for all colored output
- Use `ora` for spinners/loading states
- Use `inquirer` for user prompts

```javascript
// Good
const spinner = ora('Loading...').start();
spinner.succeed('Complete!');
console.log(chalk.green('✓ Success'));
console.log(chalk.yellow('⚠ Warning'));
console.log(chalk.red('✗ Error'));

// Bad
console.log('\x1b[32mSuccess\x1b[0m');
```

## Naming Conventions
- camelCase for variables and functions
- PascalCase for classes
- UPPER_SNAKE_CASE for constants
- kebab-case for file names

```javascript
const projectName = 'my-project';     // camelCase
const DEFAULT_TIMEOUT = 30000;        // UPPER_SNAKE_CASE
class TemplateGenerator {}            // PascalCase
// File: template-generator.js        // kebab-case
```

## Path Handling
- Use `path.join()` for all path construction
- Use `fileURLToPath(import.meta.url)` for __dirname equivalent

```javascript
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, '..', 'config');
```

## Error Handling
- Catch and handle all errors
- Provide context in error messages
- Exit with non-zero code on fatal errors

```javascript
main().catch(error => {
  console.error(chalk.red('\n❌ Operation failed:'), error.message);
  process.exit(1);
});
```

## Project-Specific Patterns

### CLI Command Structure
All commands follow this pattern in `bin/claude-init.js`:
```javascript
program
  .command('name')
  .description('Description')
  .option('-f, --flag', 'Flag description')
  .action((options) => {
    const args = [];
    if (options.flag) args.push('--flag');
    spawn('node', [path.join(scriptsDir, 'script.js'), ...args], {
      stdio: 'inherit'
    });
  });
```

### Setup Script Pattern
New setup features follow this flow in `setup-project.js`:
1. Add CLI option: `.option('--feature', 'description')`
2. Add to defaults in `gatherProjectConfig()` for `--yes` mode
3. Add inquirer prompt for interactive mode
4. Create `writeFeature()` function
5. Call in main try block after directory setup
6. Add to output file list and next steps

### News Source Pattern
Add new sources in `scripts/utils/news-sources.js`:
```javascript
export const RSS_FEEDS = {
  source_name: {
    name: 'Display Name',
    url: 'https://feed-url.xml',
    category: 'official|tech_news|community',
    priority: 1-3,
    icon: '📰'
  }
};
```

### Template Variable Pattern
Templates use `{{variableName}}` placeholders replaced in setup:
```javascript
const content = template
  .replace(/\{\{varName\}\}/g, value);
```
