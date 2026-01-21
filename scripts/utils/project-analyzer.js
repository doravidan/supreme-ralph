/**
 * Project Analyzer - Deep project analysis for intelligent RALPH integration
 *
 * Analyzes project structure, dependencies, patterns, and documentation
 * to generate comprehensive PROJECT_SPEC.md and intelligent PRDs.
 */

import fs from 'fs-extra';
import path from 'path';
import { CONFIG } from './config-manager.js';
import {
  safeReadJson,
  safeReadFile,
  exists,
  readDirRecursive,
  findFilesByPattern
} from './fs-helper.js';
import { analyzerLogger as logger } from './logger.js';

// Import registries from data files
import { DEPENDENCY_PURPOSES, getDependencyPurpose } from '../data/dependency-purposes.js';
import { TEST_FRAMEWORKS, detectTestFramework } from '../data/test-frameworks.js';
import { LINTING_TOOLS, detectLintingTools } from '../data/linting-tools.js';
import { BUILD_TOOLS, detectBuildTools, getBuildCommands } from '../data/build-tools.js';

// =============================================================================
// CACHING LAYER
// =============================================================================

/**
 * Cache storage for analysis results
 * Maps normalized paths to cached data with timestamps
 */
const analysisCache = new Map();
const markdownCache = new Map();
const directoryPurposeCache = new Map();

/**
 * Get normalized cache key from path
 * @param {string} targetPath - Path to normalize
 * @returns {string} Normalized path for cache key
 */
function getCacheKey(targetPath) {
  return path.resolve(targetPath).toLowerCase();
}

/**
 * Get directory modification time for cache validation
 * @param {string} dirPath - Directory path
 * @returns {Promise<number>} Modification time in ms, or 0 if unavailable
 */
async function getDirMtime(dirPath) {
  try {
    const stats = await fs.stat(dirPath);
    return stats.mtimeMs;
  } catch (e) {
    return 0;
  }
}

/**
 * Check if cached data is still valid
 * @param {object} cached - Cached entry with mtime
 * @param {string} targetPath - Path to check
 * @returns {Promise<boolean>} True if cache is valid
 */
async function isCacheValid(cached, targetPath) {
  if (!cached) return false;

  const currentMtime = await getDirMtime(targetPath);

  // If we can't get mtime, invalidate cache
  if (currentMtime === 0) return false;

  // Cache is valid if directory hasn't been modified
  return cached.mtime >= currentMtime;
}

/**
 * Clear all analysis caches
 * Call this to force a fresh analysis
 */
export function clearCache() {
  analysisCache.clear();
  markdownCache.clear();
  directoryPurposeCache.clear();
}

/**
 * Clear cache for a specific path
 * @param {string} targetPath - Path to clear from cache
 */
export function clearCacheForPath(targetPath) {
  const key = getCacheKey(targetPath);
  analysisCache.delete(key);
  markdownCache.delete(key);
  directoryPurposeCache.delete(key);

  // Also clear any sub-paths
  for (const cacheKey of analysisCache.keys()) {
    if (cacheKey.startsWith(key)) {
      analysisCache.delete(cacheKey);
    }
  }
  for (const cacheKey of markdownCache.keys()) {
    if (cacheKey.startsWith(key)) {
      markdownCache.delete(cacheKey);
    }
  }
  for (const cacheKey of directoryPurposeCache.keys()) {
    if (cacheKey.startsWith(key)) {
      directoryPurposeCache.delete(cacheKey);
    }
  }
}

/**
 * Get cache statistics for debugging
 * @returns {object} Cache statistics
 */
export function getCacheStats() {
  return {
    analysisEntries: analysisCache.size,
    markdownEntries: markdownCache.size,
    directoryPurposeEntries: directoryPurposeCache.size,
    totalEntries: analysisCache.size + markdownCache.size + directoryPurposeCache.size
  };
}

// =============================================================================
// MAIN ANALYSIS FUNCTION
// =============================================================================

/**
 * Main project analysis function
 * Results are cached based on directory modification time
 */
export async function analyzeProject(targetPath, options = {}) {
  const { forceRefresh = false } = options;
  const cacheKey = getCacheKey(targetPath);

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = analysisCache.get(cacheKey);
    if (cached && await isCacheValid(cached, targetPath)) {
      return cached.data;
    }
  }

  // Clear logger for fresh analysis
  logger.clearLogs();
  logger.debug(`Starting analysis of: ${targetPath}`);

  // Perform fresh analysis
  const analysis = {
    overview: await extractProjectOverview(targetPath),
    techStack: await detectTechStack(targetPath),
    structure: await scanDirectoryStructure(targetPath),
    dependencies: await detectDependencies(targetPath),
    scripts: await extractScripts(targetPath),
    patterns: await analyzeCodePatterns(targetPath),
    documentation: await findDocumentation(targetPath),
    conventions: await detectConventions(targetPath),
    // Track warnings and errors that occurred during analysis
    warnings: [],
    errors: []
  };

  // Collect warnings and errors from logger
  analysis.warnings = logger.getWarnings();
  analysis.errors = logger.getErrors();

  // Log summary if there were issues
  if (analysis.warnings.length > 0 || analysis.errors.length > 0) {
    logger.info(`Analysis completed with ${analysis.warnings.length} warnings, ${analysis.errors.length} errors`);
  } else {
    logger.debug('Analysis completed successfully');
  }

  // Cache the result
  const mtime = await getDirMtime(targetPath);
  analysisCache.set(cacheKey, { data: analysis, mtime });

  return analysis;
}

/**
 * Extract project overview from package.json, README, etc.
 */
async function extractProjectOverview(targetPath) {
  const overview = {
    name: path.basename(targetPath),
    description: '',
    purpose: '',
    version: '0.0.0'
  };

  // Try package.json first
  const packageJsonPath = path.join(targetPath, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    try {
      const pkg = await fs.readJson(packageJsonPath);
      overview.name = pkg.name || overview.name;
      overview.description = pkg.description || '';
      overview.version = pkg.version || '0.0.0';
    } catch (e) {
      logger.debug(`Failed to parse package.json: ${e.message}`, { path: packageJsonPath });
    }
  }

  // Try pyproject.toml for Python
  const pyprojectPath = path.join(targetPath, 'pyproject.toml');
  if (await fs.pathExists(pyprojectPath)) {
    try {
      const content = await fs.readFile(pyprojectPath, 'utf-8');
      const nameMatch = content.match(/name\s*=\s*"([^"]+)"/);
      const descMatch = content.match(/description\s*=\s*"([^"]+)"/);
      const versionMatch = content.match(/version\s*=\s*"([^"]+)"/);
      if (nameMatch) overview.name = nameMatch[1];
      if (descMatch) overview.description = descMatch[1];
      if (versionMatch) overview.version = versionMatch[1];
    } catch (e) {
      logger.debug(`Failed to parse pyproject.toml: ${e.message}`, { path: pyprojectPath });
    }
  }

  // Try go.mod for Go
  const goModPath = path.join(targetPath, 'go.mod');
  if (await fs.pathExists(goModPath)) {
    try {
      const content = await fs.readFile(goModPath, 'utf-8');
      const moduleMatch = content.match(/module\s+(\S+)/);
      if (moduleMatch) {
        overview.name = moduleMatch[1].split('/').pop();
      }
    } catch (e) {
      logger.debug(`Failed to parse go.mod: ${e.message}`, { path: goModPath });
    }
  }

  // Extract purpose from README
  const readmePath = await findReadme(targetPath);
  if (readmePath) {
    try {
      const readme = await fs.readFile(readmePath, 'utf-8');
      overview.purpose = extractPurposeFromReadme(readme);
      if (!overview.description) {
        overview.description = extractDescriptionFromReadme(readme);
      }
    } catch (e) {
      logger.warn(`Failed to read README: ${e.message}`, { path: readmePath });
    }
  }

  return overview;
}

/**
 * Find README file (case-insensitive)
 */
async function findReadme(targetPath) {
  const possibleNames = ['README.md', 'readme.md', 'Readme.md', 'README', 'readme', 'README.txt'];
  for (const name of possibleNames) {
    const readmePath = path.join(targetPath, name);
    if (await fs.pathExists(readmePath)) {
      return readmePath;
    }
  }
  return null;
}

/**
 * Extract purpose from README content
 */
function extractPurposeFromReadme(content) {
  // Look for common purpose indicators
  const patterns = [
    /^#+\s*(?:About|Overview|Purpose|What is|Introduction)\s*\n+([^\n#]+)/mi,
    /^([A-Z][^.!?\n]+(?:is|provides|helps|enables|allows)[^.!?\n]+[.!?])/m,
    /^>\s*([^\n]+)/m  // Blockquote often contains tagline
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim().substring(0, 500);
    }
  }

  // Fall back to first paragraph after title
  const firstParagraph = content.match(/^#[^\n]+\n+([^\n#]+)/);
  if (firstParagraph && firstParagraph[1]) {
    return firstParagraph[1].trim().substring(0, 500);
  }

  return '';
}

/**
 * Extract description from README
 */
function extractDescriptionFromReadme(content) {
  // Get first meaningful paragraph
  const lines = content.split('\n');
  let inParagraph = false;
  let paragraph = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip headers, badges, empty lines at start
    if (trimmed.startsWith('#') || trimmed.startsWith('!') || trimmed.startsWith('[')) {
      continue;
    }

    if (trimmed && !inParagraph) {
      inParagraph = true;
      paragraph = trimmed;
    } else if (trimmed && inParagraph) {
      paragraph += ' ' + trimmed;
    } else if (!trimmed && inParagraph) {
      break;
    }
  }

  return paragraph.substring(0, 300);
}

/**
 * Detect tech stack (language, framework, runtime)
 */
async function detectTechStack(targetPath) {
  const techStack = {
    language: 'unknown',
    framework: 'none',
    runtime: '',
    packageManager: 'unknown'
  };

  // Check for language indicators
  const hasPackageJson = await fs.pathExists(path.join(targetPath, 'package.json'));
  const hasTsConfig = await fs.pathExists(path.join(targetPath, 'tsconfig.json'));
  const hasJsConfig = await fs.pathExists(path.join(targetPath, 'jsconfig.json'));
  const hasPyProject = await fs.pathExists(path.join(targetPath, 'pyproject.toml'));
  const hasRequirementsTxt = await fs.pathExists(path.join(targetPath, 'requirements.txt'));
  const hasGoMod = await fs.pathExists(path.join(targetPath, 'go.mod'));
  const hasCargoToml = await fs.pathExists(path.join(targetPath, 'Cargo.toml'));
  const hasCsproj = (await fs.readdir(targetPath)).some(f => f.endsWith('.csproj'));

  // Determine language
  if (hasTsConfig) {
    techStack.language = 'typescript';
  } else if (hasPackageJson || hasJsConfig) {
    techStack.language = 'javascript';
  } else if (hasPyProject || hasRequirementsTxt) {
    techStack.language = 'python';
  } else if (hasGoMod) {
    techStack.language = 'go';
  } else if (hasCargoToml) {
    techStack.language = 'rust';
  } else if (hasCsproj) {
    techStack.language = 'csharp';
  }

  // Determine package manager
  if (await fs.pathExists(path.join(targetPath, 'pnpm-lock.yaml'))) {
    techStack.packageManager = 'pnpm';
  } else if (await fs.pathExists(path.join(targetPath, 'yarn.lock'))) {
    techStack.packageManager = 'yarn';
  } else if (await fs.pathExists(path.join(targetPath, 'bun.lockb'))) {
    techStack.packageManager = 'bun';
  } else if (await fs.pathExists(path.join(targetPath, 'package-lock.json'))) {
    techStack.packageManager = 'npm';
  } else if (hasPyProject || hasRequirementsTxt) {
    techStack.packageManager = 'pip';
  } else if (hasGoMod) {
    techStack.packageManager = 'go mod';
  } else if (hasCargoToml) {
    techStack.packageManager = 'cargo';
  }

  // Detect framework from dependencies
  if (hasPackageJson) {
    try {
      const pkg = await fs.readJson(path.join(targetPath, 'package.json'));
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

      // Check for frameworks (order matters - more specific first)
      if (allDeps['next']) techStack.framework = 'Next.js';
      else if (allDeps['nuxt']) techStack.framework = 'Nuxt';
      else if (allDeps['@nestjs/core']) techStack.framework = 'NestJS';
      else if (allDeps['@sveltejs/kit']) techStack.framework = 'SvelteKit';
      else if (allDeps['react']) techStack.framework = 'React';
      else if (allDeps['vue']) techStack.framework = 'Vue';
      else if (allDeps['svelte']) techStack.framework = 'Svelte';
      else if (allDeps['express']) techStack.framework = 'Express';
      else if (allDeps['fastify']) techStack.framework = 'Fastify';
      else if (allDeps['koa']) techStack.framework = 'Koa';
      else if (allDeps['hono']) techStack.framework = 'Hono';

      // Detect runtime from engines
      if (pkg.engines?.node) {
        techStack.runtime = `Node.js ${pkg.engines.node}`;
      }
    } catch (e) {
      logger.debug(`Failed to detect framework from package.json: ${e.message}`);
    }
  }

  // Python framework detection
  if (hasPyProject || hasRequirementsTxt) {
    const depsContent = hasPyProject
      ? await fs.readFile(path.join(targetPath, 'pyproject.toml'), 'utf-8').catch(() => '')
      : await fs.readFile(path.join(targetPath, 'requirements.txt'), 'utf-8').catch(() => '');

    if (depsContent.includes('fastapi')) techStack.framework = 'FastAPI';
    else if (depsContent.includes('django')) techStack.framework = 'Django';
    else if (depsContent.includes('flask')) techStack.framework = 'Flask';
    else if (depsContent.includes('starlette')) techStack.framework = 'Starlette';
  }

  return techStack;
}

/**
 * Scan directory structure
 */
async function scanDirectoryStructure(targetPath) {
  const structure = {
    rootFiles: [],
    directories: {
      src: { exists: false, purpose: '' },
      tests: { exists: false, framework: '' },
      docs: { exists: false, files: [] },
      config: { exists: false, files: [] }
    },
    entryPoints: []
  };

  try {
    const entries = await fs.readdir(targetPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }

      if (entry.isFile()) {
        structure.rootFiles.push(entry.name);

        // Detect entry points
        if (['index.js', 'index.ts', 'main.js', 'main.ts', 'app.js', 'app.ts', 'server.js', 'server.ts', 'main.py', 'app.py', 'main.go'].includes(entry.name)) {
          structure.entryPoints.push(entry.name);
        }
      } else if (entry.isDirectory()) {
        const dirName = entry.name.toLowerCase();

        // Check for src directory
        if (['src', 'lib', 'source', 'app'].includes(dirName)) {
          structure.directories.src = {
            exists: true,
            purpose: await detectDirectoryPurpose(path.join(targetPath, entry.name))
          };

          // Look for entry points in src
          const srcFiles = await fs.readdir(path.join(targetPath, entry.name)).catch(() => []);
          for (const f of srcFiles) {
            if (['index.js', 'index.ts', 'main.js', 'main.ts', 'app.js', 'app.ts'].includes(f)) {
              structure.entryPoints.push(path.join(entry.name, f));
            }
          }
        }

        // Check for test directories
        if (['test', 'tests', '__tests__', 'spec', 'specs', 'e2e'].includes(dirName)) {
          structure.directories.tests = {
            exists: true,
            framework: await detectProjectTestFramework(targetPath)
          };
        }

        // Check for docs
        if (['docs', 'doc', 'documentation'].includes(dirName)) {
          const docFiles = await fs.readdir(path.join(targetPath, entry.name)).catch(() => []);
          structure.directories.docs = {
            exists: true,
            files: docFiles.filter(f => f.endsWith('.md'))
          };
        }

        // Check for config
        if (['config', 'configs', 'configuration'].includes(dirName)) {
          const configFiles = await fs.readdir(path.join(targetPath, entry.name)).catch(() => []);
          structure.directories.config = {
            exists: true,
            files: configFiles
          };
        }
      }
    }

    // Check for bin entry point from package.json
    const packageJsonPath = path.join(targetPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      try {
        const pkg = await fs.readJson(packageJsonPath);
        if (pkg.main && !structure.entryPoints.includes(pkg.main)) {
          structure.entryPoints.push(pkg.main);
        }
        if (pkg.bin) {
          const bins = typeof pkg.bin === 'string' ? [pkg.bin] : Object.values(pkg.bin);
          for (const bin of bins) {
            if (!structure.entryPoints.includes(bin)) {
              structure.entryPoints.push(bin);
            }
          }
        }
      } catch (e) {
        logger.debug(`Failed to read package.json for entry points: ${e.message}`);
      }
    }

  } catch (e) {
    logger.warn(`Failed to scan directory structure: ${e.message}`, { path: targetPath });
  }

  return structure;
}

/**
 * Detect the purpose of a directory (with caching)
 */
async function detectDirectoryPurpose(dirPath) {
  const cacheKey = getCacheKey(dirPath) + ':purpose';
  const cached = directoryPurposeCache.get(cacheKey);

  if (cached && await isCacheValid(cached, dirPath)) {
    return cached.data;
  }

  // Perform fresh detection
  const purpose = await detectDirectoryPurposeInternal(dirPath);

  // Cache the result
  const mtime = await getDirMtime(dirPath);
  directoryPurposeCache.set(cacheKey, { data: purpose, mtime });

  return purpose;
}

/**
 * Internal directory purpose detection (no caching)
 */
async function detectDirectoryPurposeInternal(dirPath) {
  try {
    const files = await fs.readdir(dirPath);

    // Check for common patterns
    if (files.some(f => f.includes('component') || f.includes('Component'))) {
      return 'React/UI components';
    }
    if (files.some(f => f.includes('route') || f.includes('Route'))) {
      return 'API routes and handlers';
    }
    if (files.some(f => f.includes('model') || f.includes('Model'))) {
      return 'Data models';
    }
    if (files.some(f => f.includes('service') || f.includes('Service'))) {
      return 'Business logic services';
    }
    if (files.some(f => f.includes('util') || f.includes('helper'))) {
      return 'Utility functions';
    }

    return 'Source code';
  } catch (e) {
    logger.debug(`Failed to detect directory purpose: ${e.message}`, { path: dirPath });
    return 'Source code';
  }
}

/**
 * Detect test framework for a project
 * Uses the detectTestFramework from data/test-frameworks.js
 */
async function detectProjectTestFramework(targetPath) {
  const packageJsonPath = path.join(targetPath, 'package.json');
  const rootFiles = await fs.readdir(targetPath).catch(() => []);

  // Get package list
  let packages = [];
  if (await fs.pathExists(packageJsonPath)) {
    try {
      const pkg = await fs.readJson(packageJsonPath);
      packages = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    } catch (e) {
      logger.debug(`Failed to read package.json for test framework detection: ${e.message}`);
    }
  }

  // Use the registry-based detection
  const detected = detectTestFramework(packages, rootFiles);
  return detected ? detected.key : 'unknown';
}

/**
 * Detect and parse dependencies
 */
async function detectDependencies(targetPath) {
  const dependencies = {
    production: [],
    development: []
  };

  const packageJsonPath = path.join(targetPath, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    try {
      const pkg = await fs.readJson(packageJsonPath);

      // Production dependencies
      if (pkg.dependencies) {
        for (const [name, version] of Object.entries(pkg.dependencies)) {
          dependencies.production.push({
            name,
            version,
            purpose: DEPENDENCY_PURPOSES[name] || inferDependencyPurpose(name)
          });
        }
      }

      // Development dependencies
      if (pkg.devDependencies) {
        for (const [name, version] of Object.entries(pkg.devDependencies)) {
          dependencies.development.push({
            name,
            version,
            purpose: DEPENDENCY_PURPOSES[name] || inferDependencyPurpose(name)
          });
        }
      }
    } catch (e) {
      logger.warn(`Failed to parse dependencies from package.json: ${e.message}`);
    }
  }

  return dependencies;
}

/**
 * Infer purpose from dependency name
 */
function inferDependencyPurpose(name) {
  const lower = name.toLowerCase();

  if (lower.includes('test') || lower.includes('spec')) return 'Testing utility';
  if (lower.includes('lint') || lower.includes('eslint')) return 'Linting';
  if (lower.includes('type') || lower.includes('ts-')) return 'TypeScript utility';
  if (lower.includes('db') || lower.includes('sql') || lower.includes('mongo')) return 'Database';
  if (lower.includes('auth')) return 'Authentication';
  if (lower.includes('log')) return 'Logging';
  if (lower.includes('cache') || lower.includes('redis')) return 'Caching';
  if (lower.includes('http') || lower.includes('fetch') || lower.includes('axios')) return 'HTTP client';
  if (lower.includes('ui') || lower.includes('component')) return 'UI components';
  if (lower.includes('util') || lower.includes('helper')) return 'Utilities';
  if (lower.includes('config')) return 'Configuration';
  if (lower.includes('plugin')) return 'Plugin';
  if (lower.startsWith('@types/')) return `Type definitions for ${name.replace('@types/', '')}`;

  return 'Utility';
}

/**
 * Extract scripts from package.json
 */
async function extractScripts(targetPath) {
  const scripts = {};

  const packageJsonPath = path.join(targetPath, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    try {
      const pkg = await fs.readJson(packageJsonPath);
      if (pkg.scripts) {
        for (const [name, command] of Object.entries(pkg.scripts)) {
          scripts[name] = command;
        }
      }
    } catch (e) {
      logger.debug(`Failed to extract scripts from package.json: ${e.message}`);
    }
  }

  // Also check for Makefile
  const makefilePath = path.join(targetPath, 'Makefile');
  if (await fs.pathExists(makefilePath)) {
    try {
      const content = await fs.readFile(makefilePath, 'utf-8');
      const targets = content.match(/^([a-zA-Z_-]+):/gm);
      if (targets) {
        for (const target of targets) {
          const name = target.replace(':', '');
          if (!scripts[name]) {
            scripts[`make:${name}`] = `make ${name}`;
          }
        }
      }
    } catch (e) {
      logger.debug(`Failed to parse Makefile: ${e.message}`);
    }
  }

  return scripts;
}

/**
 * Analyze code patterns (testing, types, linting, formatting)
 */
async function analyzeCodePatterns(targetPath) {
  const patterns = {
    testing: {
      framework: 'unknown',
      location: '',
      coverage: false
    },
    types: {
      language: 'none',
      strict: false
    },
    linting: {
      tool: 'none',
      config: ''
    },
    formatting: {
      tool: 'none',
      config: ''
    }
  };

  // Detect test framework
  patterns.testing.framework = await detectProjectTestFramework(targetPath);

  // Find test location
  const testDirs = ['__tests__', 'tests', 'test', 'spec', 'e2e'];
  for (const dir of testDirs) {
    if (await fs.pathExists(path.join(targetPath, dir))) {
      patterns.testing.location = dir;
      break;
    }
  }

  // Check for coverage config
  const packageJsonPath = path.join(targetPath, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    try {
      const pkg = await fs.readJson(packageJsonPath);
      if (pkg.jest?.collectCoverage || pkg.jest?.coverageDirectory) {
        patterns.testing.coverage = true;
      }
      if (pkg.scripts?.coverage || pkg.scripts?.['test:coverage']) {
        patterns.testing.coverage = true;
      }
    } catch (e) {
      logger.debug(`Failed to check coverage config: ${e.message}`);
    }
  }

  // Detect TypeScript
  const tsconfigPath = path.join(targetPath, 'tsconfig.json');
  if (await fs.pathExists(tsconfigPath)) {
    patterns.types.language = 'TypeScript';
    try {
      const tsconfig = await fs.readJson(tsconfigPath);
      patterns.types.strict = tsconfig.compilerOptions?.strict === true;
    } catch (e) {
      logger.debug(`Failed to parse tsconfig.json: ${e.message}`);
    }
  }

  // Detect linting
  for (const [tool, config] of Object.entries(LINTING_TOOLS)) {
    for (const configFile of config.configFiles) {
      if (await fs.pathExists(path.join(targetPath, configFile))) {
        patterns.linting.tool = tool;
        patterns.linting.config = configFile;
        break;
      }
    }
    if (patterns.linting.tool !== 'none') break;
  }

  // Detect formatting (Prettier)
  if (patterns.linting.tool !== 'biome') {
    const prettierConfigs = ['.prettierrc', '.prettierrc.js', '.prettierrc.json', 'prettier.config.js'];
    for (const config of prettierConfigs) {
      if (await fs.pathExists(path.join(targetPath, config))) {
        patterns.formatting.tool = 'prettier';
        patterns.formatting.config = config;
        break;
      }
    }
  } else {
    patterns.formatting.tool = 'biome';
    patterns.formatting.config = patterns.linting.config;
  }

  return patterns;
}

/**
 * Find all documentation files
 */
export async function findDocumentation(targetPath) {
  const documentation = {
    readme: { exists: false, summary: '' },
    files: [],
    existingSpecs: []
  };

  // Find README
  const readmePath = await findReadme(targetPath);
  if (readmePath) {
    documentation.readme.exists = true;
    try {
      const content = await fs.readFile(readmePath, 'utf-8');
      documentation.readme.summary = extractDescriptionFromReadme(content);
    } catch (e) {
      logger.debug(`Failed to read README for documentation: ${e.message}`);
    }
  }

  // Find all .md files (excluding node_modules, .git, etc.)
  const mdFiles = await findMarkdownFiles(targetPath);

  for (const filePath of mdFiles) {
    const relativePath = path.relative(targetPath, filePath);

    // Skip if in excluded directories
    if (relativePath.includes('node_modules') ||
        relativePath.includes('.git') ||
        relativePath.startsWith('.claude')) {
      continue;
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const title = extractTitleFromMarkdown(content) || path.basename(filePath, '.md');
      const summary = extractSummaryFromMarkdown(content);

      const docEntry = {
        path: relativePath,
        title,
        summary
      };

      documentation.files.push(docEntry);

      // Check if it's a spec/PRD
      const lowerPath = relativePath.toLowerCase();
      if (lowerPath.includes('prd') ||
          lowerPath.includes('spec') ||
          lowerPath.includes('requirement') ||
          lowerPath.includes('design')) {
        documentation.existingSpecs.push(relativePath);
      }
    } catch (e) {
      logger.debug(`Failed to process documentation file: ${e.message}`, { path: filePath });
    }
  }

  return documentation;
}

/**
 * Find all markdown files recursively (with caching)
 */
async function findMarkdownFiles(dirPath, maxDepth = CONFIG.analysis.markdownScanDepth, currentDepth = 0) {
  // Only cache at top level (currentDepth === 0)
  if (currentDepth === 0) {
    const cacheKey = getCacheKey(dirPath) + `:md:${maxDepth}`;
    const cached = markdownCache.get(cacheKey);

    if (cached && await isCacheValid(cached, dirPath)) {
      return cached.data;
    }

    // Perform fresh scan
    const files = await findMarkdownFilesRecursive(dirPath, maxDepth, 0);

    // Cache the result
    const mtime = await getDirMtime(dirPath);
    markdownCache.set(cacheKey, { data: files, mtime });

    return files;
  }

  // Non-cached recursive call
  return findMarkdownFilesRecursive(dirPath, maxDepth, currentDepth);
}

/**
 * Internal recursive markdown file finder (no caching)
 */
async function findMarkdownFilesRecursive(dirPath, maxDepth, currentDepth) {
  const files = [];

  if (currentDepth > maxDepth) {
    return files;
  }

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      // Skip excluded directories
      if (entry.isDirectory()) {
        if (['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', 'venv', '.venv'].includes(entry.name)) {
          continue;
        }
        const subFiles = await findMarkdownFilesRecursive(fullPath, maxDepth, currentDepth + 1);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (e) {
    logger.debug(`Failed to scan directory for markdown files: ${e.message}`, { path: dirPath });
  }

  return files;
}

/**
 * Extract title from markdown content
 */
function extractTitleFromMarkdown(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

/**
 * Extract summary from markdown content
 */
function extractSummaryFromMarkdown(content) {
  // Get first meaningful paragraph after title
  const lines = content.split('\n');
  let foundTitle = false;
  let summary = '';

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('#')) {
      foundTitle = true;
      continue;
    }

    if (foundTitle && trimmed && !trimmed.startsWith('!') && !trimmed.startsWith('[')) {
      summary = trimmed;
      break;
    }
  }

  return summary.substring(0, 300);
}

/**
 * Detect code conventions
 */
async function detectConventions(targetPath) {
  const conventions = {
    namingStyle: 'camelCase',
    moduleSystem: 'unknown',
    importOrder: []
  };

  const packageJsonPath = path.join(targetPath, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    try {
      const pkg = await fs.readJson(packageJsonPath);
      conventions.moduleSystem = pkg.type === 'module' ? 'ES modules' : 'CommonJS';
    } catch (e) {
      logger.debug(`Failed to parse package.json for module system: ${e.message}`);
      conventions.moduleSystem = 'CommonJS';
    }
  }

  // Try to detect from existing code
  const srcDir = path.join(targetPath, 'src');
  const libDir = path.join(targetPath, 'lib');
  const codeDir = await fs.pathExists(srcDir) ? srcDir :
                  await fs.pathExists(libDir) ? libDir : targetPath;

  try {
    const files = await fs.readdir(codeDir);
    const jsFiles = files.filter(f => f.endsWith('.js') || f.endsWith('.ts'));

    if (jsFiles.length > 0) {
      const sampleFile = path.join(codeDir, jsFiles[0]);
      const content = await fs.readFile(sampleFile, 'utf-8');

      // Detect module system from imports
      if (content.includes('import ') && content.includes(' from ')) {
        conventions.moduleSystem = 'ES modules';
      } else if (content.includes('require(')) {
        conventions.moduleSystem = 'CommonJS';
      }

      // Detect naming style from variable declarations
      if (content.match(/const\s+[A-Z][A-Z_]+\s*=/)) {
        // Has UPPER_SNAKE_CASE constants
      }
      if (content.match(/const\s+[a-z][a-zA-Z]+\s*=/)) {
        conventions.namingStyle = 'camelCase';
      }
      if (content.match(/const\s+[a-z][a-z_]+\s*=/)) {
        conventions.namingStyle = 'snake_case';
      }

      // Detect import order pattern
      const imports = content.match(/^import .+ from ['"][^'"]+['"];?$/gm) || [];
      if (imports.length > 0) {
        const hasNodeImports = imports.some(i => i.includes("from 'fs") || i.includes("from 'path") || i.includes("from 'node:"));
        const hasExternalImports = imports.some(i => !i.includes('./') && !i.includes('../') && !i.includes("from 'fs") && !i.includes("from 'path"));
        const hasLocalImports = imports.some(i => i.includes('./') || i.includes('../'));

        if (hasNodeImports) conventions.importOrder.push('Node built-ins');
        if (hasExternalImports) conventions.importOrder.push('External packages');
        if (hasLocalImports) conventions.importOrder.push('Local modules');
      }
    }
  } catch (e) {
    logger.debug(`Failed to detect conventions from source files: ${e.message}`, { path: codeDir });
  }

  // Check for file naming conventions
  try {
    const srcFiles = await fs.readdir(codeDir).catch(() => []);
    const jsFiles = srcFiles.filter(f => f.endsWith('.js') || f.endsWith('.ts'));

    if (jsFiles.some(f => f.includes('-'))) {
      conventions.namingStyle = 'kebab-case (files)';
    } else if (jsFiles.some(f => f.includes('_'))) {
      conventions.namingStyle = 'snake_case (files)';
    } else if (jsFiles.some(f => /^[A-Z]/.test(f))) {
      conventions.namingStyle = 'PascalCase (files)';
    }
  } catch (e) {
    logger.debug(`Failed to detect file naming conventions: ${e.message}`);
  }

  return conventions;
}

/**
 * Build a directory tree string
 */
export async function buildDirectoryTree(targetPath, maxDepth = CONFIG.analysis.directoryScanDepth) {
  const tree = [];

  async function walk(dir, prefix = '', depth = 0) {
    if (depth > maxDepth) return;

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const filtered = entries.filter(e =>
        !e.name.startsWith('.') &&
        e.name !== 'node_modules' &&
        e.name !== '__pycache__' &&
        e.name !== 'venv' &&
        e.name !== '.venv' &&
        e.name !== 'dist' &&
        e.name !== 'build'
      );

      for (let i = 0; i < filtered.length; i++) {
        const entry = filtered[i];
        const isLast = i === filtered.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        const newPrefix = prefix + (isLast ? '    ' : '│   ');

        if (entry.isDirectory()) {
          tree.push(`${prefix}${connector}${entry.name}/`);
          await walk(path.join(dir, entry.name), newPrefix, depth + 1);
        } else {
          tree.push(`${prefix}${connector}${entry.name}`);
        }
      }
    } catch (e) {
      logger.debug(`Failed to walk directory for tree: ${e.message}`, { path: dir });
    }
  }

  tree.push(path.basename(targetPath) + '/');
  await walk(targetPath);

  return tree.join('\n');
}

export default {
  analyzeProject,
  findDocumentation,
  buildDirectoryTree,
  clearCache,
  clearCacheForPath,
  getCacheStats
};
