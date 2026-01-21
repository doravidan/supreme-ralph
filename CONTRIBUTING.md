# Contributing to claude-init

Thank you for your interest in contributing to claude-init! This document provides guidelines and information for contributors.

## Development Setup

### Prerequisites

- Node.js 18 or later
- npm (comes with Node.js)
- Git

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/claude-init.git
   cd claude-init
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Link for local development:
   ```bash
   npm link
   ```

4. Run tests to verify setup:
   ```bash
   npm test
   ```

## Project Structure

```
claude-init/
├── bin/                    # CLI entry point
├── scripts/                # Core functionality
│   ├── setup/              # Setup phase modules
│   ├── data/               # Data registries
│   └── utils/              # Shared utilities
├── templates/              # Template files
├── tests/                  # Test suite
├── knowledge-base/         # Synced documentation
└── examples/               # Example configurations
```

## Development Workflow

### Running the CLI Locally

```bash
# Run directly with node
node bin/claude-init.js setup --yes -t ./test-project

# Or if linked
claude-init setup --yes -t ./test-project
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Code Style

This project uses ES Modules and follows these conventions:

- **ES Modules**: Use `import`/`export`, add `.js` extension to local imports
- **Async/await**: Always use async/await over raw Promises
- **File operations**: Use `fs-extra` for all file operations
- **CLI output**: Use `chalk` for colors, `ora` for spinners
- **Naming**: camelCase for variables/functions, PascalCase for classes

See [.claude/rules/](../templates/rules/) for detailed style guides.

### Adding Features

#### Adding a News Source

1. Edit `scripts/utils/news-sources.js`:
   ```javascript
   export const RSS_FEEDS = {
     // ... existing feeds
     your_source: {
       name: 'Your Source Name',
       url: 'https://example.com/feed.xml',
       category: 'tech_news',
       priority: 2,
       icon: '📰'
     }
   };
   ```

2. If it's an API (not RSS), add to `API_SOURCES` and implement a fetch function in `news-aggregator.js`

3. Update relevance keywords if needed in `isRelevant()` function

#### Adding Framework Detection

1. Edit the appropriate data file in `scripts/data/`:
   - `test-frameworks.js` for test frameworks
   - `linting-tools.js` for linters
   - `build-tools.js` for build tools
   - `dependency-purposes.js` for package descriptions

2. Example for test framework:
   ```javascript
   export const TEST_FRAMEWORKS = {
     // ... existing frameworks
     myframework: {
       name: 'My Framework',
       packages: ['my-test-framework'],
       configFiles: ['myframework.config.js'],
       category: 'unit',
       description: 'A test framework for X'
     }
   };
   ```

#### Adding a Template Type

1. Create template files in `templates/<type>/`

2. Add type configuration to `scripts/setup/template-writer.js`:
   ```javascript
   export const TEMPLATE_TYPES = {
     // ... existing types
     mytype: {
       templateDir: 'mytype',
       targetDir: '.claude/mytype',
       extension: '.md',
       description: 'My template type'
     }
   };
   ```

3. Call `writeTemplates('mytype', templates, targetPath, variables)` from setup-project.js

### Testing Guidelines

#### Unit Tests

Located in `tests/*.test.js`. Each utility module should have corresponding tests.

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { myFunction } from '../scripts/utils/my-module.js';

describe('my-module', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

#### Integration Tests

Located in `tests/cli-integration.test.js`. Tests complete CLI workflows.

```javascript
it('should create .claude directory', async () => {
  const result = await runCLI(['setup', '--yes', '-t', tempDir]);
  expect(await fs.pathExists(path.join(tempDir, '.claude'))).toBe(true);
});
```

#### Test Patterns

- Use temp directories for file-based tests
- Mock `fetch` for network tests
- Clean up after tests in `afterEach`
- Use descriptive test names

## Pull Request Process

1. **Fork and branch**: Create a feature branch from `main`
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes**: Follow the code style and add tests

3. **Test**: Ensure all tests pass
   ```bash
   npm test
   ```

4. **Commit**: Use clear commit messages
   ```bash
   git commit -m "Add: Feature description"
   ```

5. **Push and PR**: Push to your fork and create a pull request

### Commit Message Format

```
<type>: <description>

[optional body]
```

Types:
- `Add`: New feature
- `Fix`: Bug fix
- `Update`: Enhancement to existing feature
- `Refactor`: Code change that doesn't add features or fix bugs
- `Docs`: Documentation only changes
- `Test`: Adding or updating tests
- `Chore`: Maintenance tasks

## Reporting Issues

When reporting issues, please include:

1. **Description**: Clear description of the issue
2. **Steps to reproduce**: How to reproduce the behavior
3. **Expected behavior**: What you expected to happen
4. **Actual behavior**: What actually happened
5. **Environment**: Node.js version, OS, etc.
6. **Logs**: Any relevant error messages (use `DEBUG=1`)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
