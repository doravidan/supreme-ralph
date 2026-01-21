/**
 * Tests for project-analyzer.js
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';

describe('project-analyzer', () => {
  let tempDir;
  let analyzeProject, findDocumentation, buildDirectoryTree;
  let clearCache, clearCacheForPath, getCacheStats;

  beforeEach(async () => {
    // Create a fresh temp directory for each test
    tempDir = path.join(os.tmpdir(), `project-analyzer-test-${Date.now()}`);
    await fs.ensureDir(tempDir);

    // Reset modules to clear caches
    vi.resetModules();

    // Import fresh
    const analyzer = await import('../scripts/utils/project-analyzer.js');
    analyzeProject = analyzer.analyzeProject;
    findDocumentation = analyzer.findDocumentation;
    buildDirectoryTree = analyzer.buildDirectoryTree;
    clearCache = analyzer.clearCache;
    clearCacheForPath = analyzer.clearCacheForPath;
    getCacheStats = analyzer.getCacheStats;

    // Clear caches before each test
    clearCache();
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.remove(tempDir);
  });

  // ==========================================================================
  // Test Fixtures - Project Types
  // ==========================================================================

  async function createReactProject() {
    await fs.writeJson(path.join(tempDir, 'package.json'), {
      name: 'test-react-app',
      version: '1.0.0',
      description: 'A test React application',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        test: 'vitest',
        lint: 'eslint src/'
      },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0'
      },
      devDependencies: {
        vite: '^5.0.0',
        vitest: '^1.0.0',
        eslint: '^8.0.0',
        '@types/react': '^18.2.0'
      },
      engines: {
        node: '>=18.0.0'
      }
    });

    await fs.writeJson(path.join(tempDir, 'tsconfig.json'), {
      compilerOptions: {
        strict: true,
        jsx: 'react-jsx'
      }
    });

    await fs.ensureDir(path.join(tempDir, 'src', 'components'));
    await fs.writeFile(path.join(tempDir, 'src', 'index.tsx'), 'export default function App() {}');
    await fs.writeFile(path.join(tempDir, 'src', 'components', 'Button.tsx'), 'export const Button = () => null;');

    await fs.ensureDir(path.join(tempDir, 'tests'));
    await fs.writeFile(path.join(tempDir, 'tests', 'App.test.tsx'), 'test("renders", () => {});');

    await fs.writeFile(path.join(tempDir, 'README.md'), '# Test React App\n\nA sample React application for testing.');
    await fs.writeFile(path.join(tempDir, '.eslintrc.json'), '{}');
    await fs.writeFile(path.join(tempDir, '.prettierrc'), '{}');

    return tempDir;
  }

  async function createNodeExpressProject() {
    await fs.writeJson(path.join(tempDir, 'package.json'), {
      name: 'test-express-api',
      version: '2.0.0',
      description: 'An Express.js API server',
      main: 'src/index.js',
      type: 'module',
      scripts: {
        start: 'node src/index.js',
        dev: 'nodemon src/index.js',
        test: 'jest',
        lint: 'eslint .'
      },
      dependencies: {
        express: '^4.18.0',
        cors: '^2.8.0'
      },
      devDependencies: {
        jest: '^29.0.0',
        nodemon: '^3.0.0',
        eslint: '^8.0.0'
      }
    });

    await fs.ensureDir(path.join(tempDir, 'src', 'routes'));
    await fs.ensureDir(path.join(tempDir, 'src', 'services'));
    await fs.writeFile(path.join(tempDir, 'src', 'index.js'), 'import express from "express";');
    await fs.writeFile(path.join(tempDir, 'src', 'routes', 'api.js'), 'export default router;');
    await fs.writeFile(path.join(tempDir, 'src', 'services', 'userService.js'), 'export class UserService {}');

    await fs.ensureDir(path.join(tempDir, '__tests__'));
    await fs.writeFile(path.join(tempDir, '__tests__', 'api.test.js'), 'test("api", () => {});');

    await fs.writeFile(path.join(tempDir, 'package-lock.json'), '{}');

    return tempDir;
  }

  async function createVueProject() {
    await fs.writeJson(path.join(tempDir, 'package.json'), {
      name: 'test-vue-app',
      version: '1.0.0',
      dependencies: {
        vue: '^3.4.0',
        'vue-router': '^4.0.0'
      },
      devDependencies: {
        vite: '^5.0.0',
        '@vitejs/plugin-vue': '^5.0.0'
      }
    });

    await fs.ensureDir(path.join(tempDir, 'src'));
    await fs.writeFile(path.join(tempDir, 'src', 'App.vue'), '<template></template>');

    return tempDir;
  }

  async function createPythonProject() {
    await fs.writeFile(path.join(tempDir, 'pyproject.toml'), `
[project]
name = "test-python-app"
version = "1.0.0"
description = "A Python application"

[project.dependencies]
fastapi = ">=0.100.0"
uvicorn = ">=0.20.0"
`);

    await fs.writeFile(path.join(tempDir, 'requirements.txt'), 'fastapi\nuvicorn\npytest');

    await fs.ensureDir(path.join(tempDir, 'src'));
    await fs.writeFile(path.join(tempDir, 'src', 'main.py'), 'from fastapi import FastAPI');

    await fs.ensureDir(path.join(tempDir, 'tests'));
    await fs.writeFile(path.join(tempDir, 'tests', 'test_main.py'), 'def test_main(): pass');

    await fs.writeFile(path.join(tempDir, 'README.md'), '# Python App\n\nThis is a FastAPI application.');

    return tempDir;
  }

  async function createGoProject() {
    await fs.writeFile(path.join(tempDir, 'go.mod'), 'module github.com/test/myapp\n\ngo 1.21');
    await fs.writeFile(path.join(tempDir, 'go.sum'), '');
    await fs.writeFile(path.join(tempDir, 'main.go'), 'package main\n\nfunc main() {}');

    await fs.ensureDir(path.join(tempDir, 'pkg'));
    await fs.writeFile(path.join(tempDir, 'pkg', 'handler.go'), 'package pkg');

    await fs.writeFile(path.join(tempDir, 'Makefile'), 'build:\n\tgo build\n\ntest:\n\tgo test');

    return tempDir;
  }

  // ==========================================================================
  // Main Analysis Tests
  // ==========================================================================

  describe('analyzeProject', () => {
    it('should analyze a React TypeScript project', async () => {
      await createReactProject();

      const analysis = await analyzeProject(tempDir);

      expect(analysis.overview.name).toBe('test-react-app');
      expect(analysis.overview.version).toBe('1.0.0');
      expect(analysis.overview.description).toBe('A test React application');

      expect(analysis.techStack.language).toBe('typescript');
      expect(analysis.techStack.framework).toBe('React');
      expect(analysis.techStack.runtime).toContain('Node.js');
      expect(analysis.techStack.packageManager).toBe('npm');

      expect(analysis.patterns.types.language).toBe('TypeScript');
      expect(analysis.patterns.types.strict).toBe(true);
      expect(analysis.patterns.linting.tool).toBe('eslint');
      expect(analysis.patterns.formatting.tool).toBe('prettier');
    });

    it('should analyze a Node.js Express project', async () => {
      await createNodeExpressProject();

      const analysis = await analyzeProject(tempDir);

      expect(analysis.overview.name).toBe('test-express-api');
      expect(analysis.techStack.language).toBe('javascript');
      expect(analysis.techStack.framework).toBe('Express');
      expect(analysis.techStack.packageManager).toBe('npm');

      expect(analysis.patterns.testing.framework).toBe('jest');
      expect(analysis.structure.directories.tests.exists).toBe(true);
    });

    it('should analyze a Vue project', async () => {
      await createVueProject();

      const analysis = await analyzeProject(tempDir);

      expect(analysis.techStack.framework).toBe('Vue');
      expect(analysis.dependencies.production.some(d => d.name === 'vue')).toBe(true);
    });

    it('should analyze a Python FastAPI project', async () => {
      await createPythonProject();

      const analysis = await analyzeProject(tempDir);

      expect(analysis.overview.name).toBe('test-python-app');
      expect(analysis.techStack.language).toBe('python');
      expect(analysis.techStack.framework).toBe('FastAPI');
      expect(analysis.techStack.packageManager).toBe('pip');
    });

    it('should analyze a Go project', async () => {
      await createGoProject();

      const analysis = await analyzeProject(tempDir);

      expect(analysis.overview.name).toBe('myapp');
      expect(analysis.techStack.language).toBe('go');
      expect(analysis.techStack.packageManager).toBe('go mod');
      expect(analysis.scripts).toHaveProperty('make:build');
      expect(analysis.scripts).toHaveProperty('make:test');
    });

    it('should handle empty project directory', async () => {
      // tempDir is already empty
      const analysis = await analyzeProject(tempDir);

      expect(analysis.overview.name).toBe(path.basename(tempDir));
      expect(analysis.techStack.language).toBe('unknown');
      expect(analysis.techStack.framework).toBe('none');
      expect(analysis.dependencies.production).toHaveLength(0);
      expect(analysis.dependencies.development).toHaveLength(0);
    });

    it('should handle corrupted package.json gracefully', async () => {
      await fs.writeFile(path.join(tempDir, 'package.json'), 'not valid json');

      const analysis = await analyzeProject(tempDir);

      // Should not throw, should return default values
      expect(analysis.overview.name).toBe(path.basename(tempDir));
      expect(analysis.techStack.language).toBe('unknown');
      expect(analysis.warnings.length).toBeGreaterThanOrEqual(0);
    });

    it('should include warnings and errors arrays', async () => {
      await createReactProject();

      const analysis = await analyzeProject(tempDir);

      expect(Array.isArray(analysis.warnings)).toBe(true);
      expect(Array.isArray(analysis.errors)).toBe(true);
    });
  });

  // ==========================================================================
  // Dependency Detection Tests
  // ==========================================================================

  describe('dependency detection', () => {
    it('should detect production and dev dependencies', async () => {
      await createReactProject();

      const analysis = await analyzeProject(tempDir);

      expect(analysis.dependencies.production.some(d => d.name === 'react')).toBe(true);
      expect(analysis.dependencies.production.some(d => d.name === 'react-dom')).toBe(true);
      expect(analysis.dependencies.development.some(d => d.name === 'vitest')).toBe(true);
      expect(analysis.dependencies.development.some(d => d.name === 'eslint')).toBe(true);
    });

    it('should add purpose to known dependencies', async () => {
      await createReactProject();

      const analysis = await analyzeProject(tempDir);

      const reactDep = analysis.dependencies.production.find(d => d.name === 'react');
      expect(reactDep.purpose).toBeDefined();
      expect(reactDep.purpose.length).toBeGreaterThan(0);
    });

    it('should infer purpose for unknown dependencies', async () => {
      await fs.writeJson(path.join(tempDir, 'package.json'), {
        name: 'test',
        dependencies: {
          'my-custom-test-lib': '^1.0.0',
          'auth-helper': '^2.0.0',
          'db-connector': '^3.0.0'
        }
      });

      const analysis = await analyzeProject(tempDir);

      const testDep = analysis.dependencies.production.find(d => d.name === 'my-custom-test-lib');
      expect(testDep.purpose).toContain('Test');

      const authDep = analysis.dependencies.production.find(d => d.name === 'auth-helper');
      expect(authDep.purpose).toContain('Authentication');

      const dbDep = analysis.dependencies.production.find(d => d.name === 'db-connector');
      expect(dbDep.purpose).toContain('Database');
    });
  });

  // ==========================================================================
  // Framework Detection Tests
  // ==========================================================================

  describe('framework detection', () => {
    it('should detect Next.js over React', async () => {
      await fs.writeJson(path.join(tempDir, 'package.json'), {
        name: 'nextjs-app',
        dependencies: {
          next: '^14.0.0',
          react: '^18.2.0'
        }
      });

      const analysis = await analyzeProject(tempDir);
      expect(analysis.techStack.framework).toBe('Next.js');
    });

    it('should detect NestJS', async () => {
      await fs.writeJson(path.join(tempDir, 'package.json'), {
        name: 'nestjs-app',
        dependencies: {
          '@nestjs/core': '^10.0.0',
          '@nestjs/common': '^10.0.0'
        }
      });

      const analysis = await analyzeProject(tempDir);
      expect(analysis.techStack.framework).toBe('NestJS');
    });

    it('should detect SvelteKit over Svelte', async () => {
      await fs.writeJson(path.join(tempDir, 'package.json'), {
        name: 'sveltekit-app',
        dependencies: {
          svelte: '^4.0.0'
        },
        devDependencies: {
          '@sveltejs/kit': '^2.0.0'
        }
      });

      const analysis = await analyzeProject(tempDir);
      expect(analysis.techStack.framework).toBe('SvelteKit');
    });

    it('should detect Django for Python', async () => {
      await fs.writeFile(path.join(tempDir, 'requirements.txt'), 'django>=4.0\ngunicorn');

      const analysis = await analyzeProject(tempDir);
      expect(analysis.techStack.framework).toBe('Django');
    });

    it('should detect Flask for Python', async () => {
      await fs.writeFile(path.join(tempDir, 'pyproject.toml'), `
[project]
name = "flask-app"
dependencies = ["flask>=2.0"]
`);

      const analysis = await analyzeProject(tempDir);
      expect(analysis.techStack.framework).toBe('Flask');
    });
  });

  // ==========================================================================
  // Convention Detection Tests
  // ==========================================================================

  describe('convention detection', () => {
    it('should detect ES modules', async () => {
      await fs.writeJson(path.join(tempDir, 'package.json'), {
        name: 'esm-project',
        type: 'module'
      });

      const analysis = await analyzeProject(tempDir);
      expect(analysis.conventions.moduleSystem).toBe('ES modules');
    });

    it('should detect CommonJS', async () => {
      await fs.writeJson(path.join(tempDir, 'package.json'), {
        name: 'cjs-project'
      });

      const analysis = await analyzeProject(tempDir);
      expect(analysis.conventions.moduleSystem).toBe('CommonJS');
    });

    it('should detect module system from code', async () => {
      await fs.writeJson(path.join(tempDir, 'package.json'), {
        name: 'test-project'
      });
      await fs.ensureDir(path.join(tempDir, 'src'));
      await fs.writeFile(path.join(tempDir, 'src', 'index.js'), `
import path from 'path';
import chalk from 'chalk';
import { helper } from './utils.js';

const config = {};
export default config;
`);

      const analysis = await analyzeProject(tempDir);
      expect(analysis.conventions.moduleSystem).toBe('ES modules');
      expect(analysis.conventions.importOrder).toContain('Node built-ins');
      expect(analysis.conventions.importOrder).toContain('External packages');
      expect(analysis.conventions.importOrder).toContain('Local modules');
    });
  });

  // ==========================================================================
  // Directory Structure Tests
  // ==========================================================================

  describe('directory structure', () => {
    it('should detect src directory', async () => {
      await createReactProject();

      const analysis = await analyzeProject(tempDir);

      expect(analysis.structure.directories.src.exists).toBe(true);
      expect(analysis.structure.directories.src.purpose).toContain('component');
    });

    it('should detect tests directory', async () => {
      await createReactProject();

      const analysis = await analyzeProject(tempDir);

      expect(analysis.structure.directories.tests.exists).toBe(true);
      expect(analysis.structure.directories.tests.framework).toBeDefined();
    });

    it('should find entry points', async () => {
      await createNodeExpressProject();

      const analysis = await analyzeProject(tempDir);

      expect(analysis.structure.entryPoints.length).toBeGreaterThan(0);
      expect(analysis.structure.entryPoints).toContain('src/index.js');
    });

    it('should detect entry points from package.json bin', async () => {
      await fs.writeJson(path.join(tempDir, 'package.json'), {
        name: 'cli-tool',
        bin: {
          'my-cli': './bin/cli.js'
        }
      });

      const analysis = await analyzeProject(tempDir);

      expect(analysis.structure.entryPoints).toContain('./bin/cli.js');
    });
  });

  // ==========================================================================
  // Documentation Tests
  // ==========================================================================

  describe('findDocumentation', () => {
    it('should find README.md', async () => {
      await fs.writeFile(path.join(tempDir, 'README.md'), '# My Project\n\nA great project.');

      const docs = await findDocumentation(tempDir);

      expect(docs.readme.exists).toBe(true);
      expect(docs.readme.summary).toContain('great project');
    });

    it('should find all markdown files', async () => {
      await fs.writeFile(path.join(tempDir, 'README.md'), '# Readme');
      await fs.ensureDir(path.join(tempDir, 'docs'));
      await fs.writeFile(path.join(tempDir, 'docs', 'API.md'), '# API Docs');
      await fs.writeFile(path.join(tempDir, 'docs', 'CONTRIBUTING.md'), '# Contributing');
      await fs.writeFile(path.join(tempDir, 'CHANGELOG.md'), '# Changelog');

      const docs = await findDocumentation(tempDir);

      expect(docs.files.length).toBeGreaterThanOrEqual(4);
      expect(docs.files.some(f => f.path.includes('API.md'))).toBe(true);
    });

    it('should identify spec/PRD files', async () => {
      await fs.ensureDir(path.join(tempDir, 'tasks'));
      await fs.writeFile(path.join(tempDir, 'tasks', 'prd-feature.md'), '# PRD');
      await fs.writeFile(path.join(tempDir, 'SPEC.md'), '# Specification');
      await fs.writeFile(path.join(tempDir, 'design-doc.md'), '# Design');

      const docs = await findDocumentation(tempDir);

      expect(docs.existingSpecs.length).toBeGreaterThanOrEqual(2);
    });

    it('should exclude node_modules and .git', async () => {
      await fs.ensureDir(path.join(tempDir, 'node_modules', 'some-pkg'));
      await fs.writeFile(path.join(tempDir, 'node_modules', 'some-pkg', 'README.md'), '# Pkg');
      await fs.ensureDir(path.join(tempDir, '.git'));
      await fs.writeFile(path.join(tempDir, '.git', 'config.md'), '# Git');

      const docs = await findDocumentation(tempDir);

      expect(docs.files.every(f => !f.path.includes('node_modules'))).toBe(true);
      expect(docs.files.every(f => !f.path.includes('.git'))).toBe(true);
    });
  });

  // ==========================================================================
  // Directory Tree Tests
  // ==========================================================================

  describe('buildDirectoryTree', () => {
    it('should build a directory tree string', async () => {
      await createReactProject();

      const tree = await buildDirectoryTree(tempDir);

      expect(tree).toContain('src/');
      expect(tree).toContain('tests/');
      expect(tree).toContain('package.json');
      expect(tree).not.toContain('node_modules');
    });

    it('should respect max depth', async () => {
      await fs.ensureDir(path.join(tempDir, 'a', 'b', 'c', 'd', 'e'));
      await fs.writeFile(path.join(tempDir, 'a', 'b', 'c', 'd', 'e', 'deep.txt'), 'content');

      const shallowTree = await buildDirectoryTree(tempDir, 2);
      const deepTree = await buildDirectoryTree(tempDir, 5);

      // Shallow tree shouldn't have deep content
      expect(shallowTree.split('\n').length).toBeLessThan(deepTree.split('\n').length);
    });
  });

  // ==========================================================================
  // Caching Tests
  // ==========================================================================

  describe('caching', () => {
    it('should cache analysis results', async () => {
      await createReactProject();

      // First call
      const analysis1 = await analyzeProject(tempDir);
      const stats1 = getCacheStats();

      // Second call should use cache
      const analysis2 = await analyzeProject(tempDir);
      const stats2 = getCacheStats();

      expect(analysis1.overview.name).toBe(analysis2.overview.name);
      expect(stats1.analysisEntries).toBe(1);
      expect(stats2.analysisEntries).toBe(1);
    });

    it('should force refresh when requested', async () => {
      await createReactProject();

      const analysis1 = await analyzeProject(tempDir);

      // Modify project
      await fs.writeJson(path.join(tempDir, 'package.json'), {
        name: 'updated-name',
        version: '2.0.0'
      });

      // Force refresh
      const analysis2 = await analyzeProject(tempDir, { forceRefresh: true });

      expect(analysis2.overview.name).toBe('updated-name');
    });

    it('should clear all caches', async () => {
      await createReactProject();
      await analyzeProject(tempDir);

      const statsBefore = getCacheStats();
      expect(statsBefore.totalEntries).toBeGreaterThan(0);

      clearCache();

      const statsAfter = getCacheStats();
      expect(statsAfter.totalEntries).toBe(0);
    });

    it('should clear cache for specific path', async () => {
      await createReactProject();
      await analyzeProject(tempDir);

      clearCacheForPath(tempDir);

      const stats = getCacheStats();
      expect(stats.analysisEntries).toBe(0);
    });
  });

  // ==========================================================================
  // Edge Cases Tests
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle project with only README', async () => {
      await fs.writeFile(path.join(tempDir, 'README.md'), '# Just a README\n\nNothing else here.');

      const analysis = await analyzeProject(tempDir);

      expect(analysis.documentation.readme.exists).toBe(true);
      expect(analysis.techStack.language).toBe('unknown');
    });

    it('should handle deeply nested src structure', async () => {
      await fs.writeJson(path.join(tempDir, 'package.json'), { name: 'nested' });
      await fs.ensureDir(path.join(tempDir, 'src', 'features', 'auth', 'components'));
      await fs.writeFile(
        path.join(tempDir, 'src', 'features', 'auth', 'components', 'Login.tsx'),
        'export const Login = () => null;'
      );

      const analysis = await analyzeProject(tempDir);

      expect(analysis.structure.directories.src.exists).toBe(true);
    });

    it('should handle mixed case README files', async () => {
      await fs.writeFile(path.join(tempDir, 'Readme.md'), '# Mixed Case');

      const docs = await findDocumentation(tempDir);

      expect(docs.readme.exists).toBe(true);
    });

    it('should handle project with multiple package managers', async () => {
      await fs.writeJson(path.join(tempDir, 'package.json'), { name: 'multi' });
      await fs.writeFile(path.join(tempDir, 'yarn.lock'), '');
      await fs.writeFile(path.join(tempDir, 'package-lock.json'), '{}');

      const analysis = await analyzeProject(tempDir);

      // Should prefer yarn when yarn.lock exists
      expect(analysis.techStack.packageManager).toBe('yarn');
    });

    it('should handle bun package manager', async () => {
      await fs.writeJson(path.join(tempDir, 'package.json'), { name: 'bun-project' });
      await fs.writeFile(path.join(tempDir, 'bun.lockb'), '');

      const analysis = await analyzeProject(tempDir);

      expect(analysis.techStack.packageManager).toBe('bun');
    });

    it('should handle pnpm package manager', async () => {
      await fs.writeJson(path.join(tempDir, 'package.json'), { name: 'pnpm-project' });
      await fs.writeFile(path.join(tempDir, 'pnpm-lock.yaml'), '');

      const analysis = await analyzeProject(tempDir);

      expect(analysis.techStack.packageManager).toBe('pnpm');
    });
  });

  // ==========================================================================
  // Scripts Extraction Tests
  // ==========================================================================

  describe('scripts extraction', () => {
    it('should extract npm scripts', async () => {
      await createReactProject();

      const analysis = await analyzeProject(tempDir);

      expect(analysis.scripts.dev).toBe('vite');
      expect(analysis.scripts.build).toBe('vite build');
      expect(analysis.scripts.test).toBe('vitest');
    });

    it('should extract Makefile targets', async () => {
      await createGoProject();

      const analysis = await analyzeProject(tempDir);

      expect(analysis.scripts['make:build']).toBe('make build');
      expect(analysis.scripts['make:test']).toBe('make test');
    });
  });

  // ==========================================================================
  // Code Patterns Tests
  // ==========================================================================

  describe('code patterns', () => {
    it('should detect test coverage configuration', async () => {
      await fs.writeJson(path.join(tempDir, 'package.json'), {
        name: 'coverage-project',
        scripts: {
          test: 'jest',
          'test:coverage': 'jest --coverage'
        },
        jest: {
          collectCoverage: true,
          coverageDirectory: 'coverage'
        },
        devDependencies: {
          jest: '^29.0.0'
        }
      });

      const analysis = await analyzeProject(tempDir);

      expect(analysis.patterns.testing.coverage).toBe(true);
    });

    it('should detect biome as linter and formatter', async () => {
      await fs.writeJson(path.join(tempDir, 'package.json'), { name: 'biome-project' });
      await fs.writeFile(path.join(tempDir, 'biome.json'), '{}');

      const analysis = await analyzeProject(tempDir);

      expect(analysis.patterns.linting.tool).toBe('biome');
      expect(analysis.patterns.formatting.tool).toBe('biome');
    });
  });
});
