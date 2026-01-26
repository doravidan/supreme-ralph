/**
 * Filesystem Boundary Validator
 *
 * Restricts file operations to project directory with explicit boundaries.
 * Validates before any Write/Edit operation.
 *
 * @module boundary-validator
 */

import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';

// Default boundaries
const DEFAULT_BOUNDARIES = {
  never_touch: [
    '.git/**',
    '.env',
    '.env.*',
    '**/*.key',
    '**/*.pem',
    '**/*.crt',
    '**/secrets/**',
    '**/credentials/**',
    'node_modules/**',
    'dist/**',
    'build/**',
    'coverage/**',
    '.next/**',
    '.nuxt/**',
    '__pycache__/**',
    '*.pyc',
    'venv/**',
    '.venv/**',
    'target/**',  // Rust
    'vendor/**'   // Go
  ],
  read_only: [
    'LICENSE',
    'LICENSE.*',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'Pipfile.lock',
    'poetry.lock',
    'Cargo.lock',
    'go.sum'
  ],
  warn_before_modify: [
    'package.json',
    'tsconfig.json',
    'README.md',
    'CLAUDE.md',
    'PROJECT_SPEC.md',
    '.ralph/config.yaml'
  ]
};

/**
 * Load boundaries from config
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Object>} Boundaries configuration
 */
async function loadBoundaries(projectRoot = process.cwd()) {
  const configPath = path.join(projectRoot, '.ralph', 'config.yaml');

  if (await fs.pathExists(configPath)) {
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const config = yaml.parse(content);

      return {
        never_touch: [
          ...DEFAULT_BOUNDARIES.never_touch,
          ...(config.boundaries?.never_touch || [])
        ],
        read_only: [
          ...DEFAULT_BOUNDARIES.read_only,
          ...(config.boundaries?.read_only || [])
        ],
        warn_before_modify: [
          ...DEFAULT_BOUNDARIES.warn_before_modify,
          ...(config.boundaries?.warn_before_modify || [])
        ]
      };
    } catch (error) {
      return DEFAULT_BOUNDARIES;
    }
  }

  return DEFAULT_BOUNDARIES;
}

/**
 * Check if a path matches a glob pattern
 * @param {string} filePath - File path to check
 * @param {string} pattern - Glob pattern
 * @returns {boolean} Whether path matches pattern
 */
function matchesPattern(filePath, pattern) {
  // Normalize paths
  const normalizedPath = filePath.replace(/\\/g, '/');
  const normalizedPattern = pattern.replace(/\\/g, '/');

  // Handle ** (any depth)
  if (normalizedPattern.includes('**')) {
    const regex = new RegExp(
      '^' +
      normalizedPattern
        .replace(/\./g, '\\.')
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*') +
      '$'
    );
    return regex.test(normalizedPath);
  }

  // Handle * (single level)
  if (normalizedPattern.includes('*')) {
    const regex = new RegExp(
      '^' +
      normalizedPattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '[^/]*') +
      '$'
    );
    return regex.test(normalizedPath);
  }

  // Exact match or ends with
  return normalizedPath === normalizedPattern ||
         normalizedPath.endsWith('/' + normalizedPattern) ||
         normalizedPath.endsWith(normalizedPattern);
}

/**
 * Validate a file operation against boundaries
 * @param {string} operation - Operation type: 'read', 'write', 'edit', 'delete'
 * @param {string} filePath - Target file path
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<{allowed: boolean, reason: string, requiresConfirmation: boolean}>}
 */
async function validateFileOperation(operation, filePath, projectRoot = process.cwd()) {
  const boundaries = await loadBoundaries(projectRoot);

  // Get relative path
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(projectRoot, filePath);
  const relativePath = path.relative(projectRoot, absolutePath);

  // Check if path is outside project
  if (relativePath.startsWith('..')) {
    return {
      allowed: false,
      reason: `Path is outside project directory: ${filePath}`,
      requiresConfirmation: false
    };
  }

  // Check never_touch for all operations
  for (const pattern of boundaries.never_touch) {
    if (matchesPattern(relativePath, pattern)) {
      return {
        allowed: false,
        reason: `File matches 'never_touch' boundary: ${pattern}`,
        requiresConfirmation: false
      };
    }
  }

  // Check read_only for write operations
  if (['write', 'edit', 'delete'].includes(operation)) {
    for (const pattern of boundaries.read_only) {
      if (matchesPattern(relativePath, pattern)) {
        return {
          allowed: false,
          reason: `File matches 'read_only' boundary: ${pattern}`,
          requiresConfirmation: false
        };
      }
    }
  }

  // Check warn_before_modify for write operations
  if (['write', 'edit'].includes(operation)) {
    for (const pattern of boundaries.warn_before_modify) {
      if (matchesPattern(relativePath, pattern)) {
        return {
          allowed: true,
          reason: `File matches 'warn_before_modify' boundary: ${pattern}`,
          requiresConfirmation: true
        };
      }
    }
  }

  // All checks passed
  return {
    allowed: true,
    reason: 'No boundary restrictions apply',
    requiresConfirmation: false
  };
}

/**
 * Get validation result as formatted string
 * @param {Object} result - Validation result
 * @param {string} filePath - File path
 * @param {string} operation - Operation type
 * @returns {string} Formatted message
 */
function formatValidationResult(result, filePath, operation) {
  if (!result.allowed) {
    return `
╔════════════════════════════════════════════════════════════════╗
║                 BOUNDARY VIOLATION                              ║
╚════════════════════════════════════════════════════════════════╝

Operation: ${operation}
File: ${filePath}

❌ Operation blocked: ${result.reason}

This file is protected by security boundaries configured in
.ralph/config.yaml. If you need to modify this file:

1. Check if the modification is truly necessary
2. Manually edit the file outside of RALPH
3. Add an exception to .ralph/config.yaml
`;
  }

  if (result.requiresConfirmation) {
    return `
╔════════════════════════════════════════════════════════════════╗
║                 CONFIRMATION REQUIRED                           ║
╚════════════════════════════════════════════════════════════════╝

Operation: ${operation}
File: ${filePath}

⚠ ${result.reason}

This file is marked for warning before modification.
Please confirm you want to proceed with this change.
`;
  }

  return '';  // No message needed for allowed operations
}

/**
 * List all boundaries for a project
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<string>} Formatted boundaries list
 */
async function listBoundaries(projectRoot = process.cwd()) {
  const boundaries = await loadBoundaries(projectRoot);

  return `
╔════════════════════════════════════════════════════════════════╗
║                 Filesystem Boundaries                           ║
╚════════════════════════════════════════════════════════════════╝

Never Touch (${boundaries.never_touch.length} patterns):
${boundaries.never_touch.map(p => `  ✗ ${p}`).join('\n')}

Read Only (${boundaries.read_only.length} patterns):
${boundaries.read_only.map(p => `  📖 ${p}`).join('\n')}

Warn Before Modify (${boundaries.warn_before_modify.length} patterns):
${boundaries.warn_before_modify.map(p => `  ⚠ ${p}`).join('\n')}

Customize in: .ralph/config.yaml

Example:
  boundaries:
    never_touch:
      - "production/**"
    read_only:
      - "database/schema.sql"
    warn_before_modify:
      - "config/*.json"
`;
}

/**
 * Check if a file is protected
 * @param {string} filePath - File path to check
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<{protected: boolean, level: string|null, pattern: string|null}>}
 */
async function isFileProtected(filePath, projectRoot = process.cwd()) {
  const boundaries = await loadBoundaries(projectRoot);
  const relativePath = path.isAbsolute(filePath)
    ? path.relative(projectRoot, filePath)
    : filePath;

  for (const pattern of boundaries.never_touch) {
    if (matchesPattern(relativePath, pattern)) {
      return { protected: true, level: 'never_touch', pattern };
    }
  }

  for (const pattern of boundaries.read_only) {
    if (matchesPattern(relativePath, pattern)) {
      return { protected: true, level: 'read_only', pattern };
    }
  }

  for (const pattern of boundaries.warn_before_modify) {
    if (matchesPattern(relativePath, pattern)) {
      return { protected: true, level: 'warn_before_modify', pattern };
    }
  }

  return { protected: false, level: null, pattern: null };
}

/**
 * Add a custom boundary
 * @param {string} level - Boundary level: 'never_touch', 'read_only', 'warn_before_modify'
 * @param {string} pattern - Glob pattern to add
 * @param {string} projectRoot - Project root directory
 */
async function addBoundary(level, pattern, projectRoot = process.cwd()) {
  const configPath = path.join(projectRoot, '.ralph', 'config.yaml');

  let config = {};
  if (await fs.pathExists(configPath)) {
    const content = await fs.readFile(configPath, 'utf-8');
    config = yaml.parse(content) || {};
  }

  if (!config.boundaries) {
    config.boundaries = {};
  }

  if (!config.boundaries[level]) {
    config.boundaries[level] = [];
  }

  if (!config.boundaries[level].includes(pattern)) {
    config.boundaries[level].push(pattern);

    await fs.ensureDir(path.dirname(configPath));
    await fs.writeFile(configPath, yaml.stringify(config));
  }
}

/**
 * Remove a custom boundary
 * @param {string} level - Boundary level
 * @param {string} pattern - Glob pattern to remove
 * @param {string} projectRoot - Project root directory
 */
async function removeBoundary(level, pattern, projectRoot = process.cwd()) {
  const configPath = path.join(projectRoot, '.ralph', 'config.yaml');

  if (!await fs.pathExists(configPath)) {
    return;
  }

  const content = await fs.readFile(configPath, 'utf-8');
  const config = yaml.parse(content) || {};

  if (config.boundaries?.[level]) {
    config.boundaries[level] = config.boundaries[level].filter(p => p !== pattern);
    await fs.writeFile(configPath, yaml.stringify(config));
  }
}

export {
  DEFAULT_BOUNDARIES,
  loadBoundaries,
  matchesPattern,
  validateFileOperation,
  formatValidationResult,
  listBoundaries,
  isFileProtected,
  addBoundary,
  removeBoundary
};
