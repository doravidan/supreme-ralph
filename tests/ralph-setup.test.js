/**
 * Tests for ralph-setup.js
 * Tests the RALPH infrastructure setup functions
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

import {
  buildRalphContext,
  setupWorktreeInfrastructure,
  setupMemoryLayer,
  setupQATemplates,
  writeRalph
} from '../scripts/setup/ralph-setup.js';

describe('ralph-setup', () => {
  let testDir;

  beforeEach(async () => {
    // Create a temporary test directory
    testDir = path.join(os.tmpdir(), `ralph-setup-test-${Date.now()}`);
    await fs.ensureDir(testDir);
    await fs.ensureDir(path.join(testDir, '.ralph'));
  });

  afterEach(async () => {
    // Cleanup test directory
    await fs.remove(testDir);
  });

  describe('buildRalphContext', () => {
    it('should build context with default values', () => {
      const config = {
        projectName: 'test-project',
        language: 'typescript',
        framework: 'react'
      };

      const context = buildRalphContext(config);

      expect(context.projectName).toBe('test-project');
      expect(context.language).toBe('typescript');
      expect(context.framework).toBe('react');
      expect(context.hasTypes).toBe(true);
    });

    it('should include build commands in context', () => {
      const config = {
        projectName: 'test',
        buildCommand: 'npm run build',
        testCommand: 'npm test',
        lintCommand: 'npm run lint'
      };

      const context = buildRalphContext(config);

      expect(context.buildCommand).toBe('npm run build');
      expect(context.testCommand).toBe('npm test');
      expect(context.lintCommand).toBe('npm run lint');
    });

    it('should set hasTypes based on language', () => {
      const tsConfig = { language: 'typescript' };
      const jsConfig = { language: 'javascript' };

      expect(buildRalphContext(tsConfig).hasTypes).toBe(true);
      expect(buildRalphContext(jsConfig).hasTypes).toBe(false);
    });

    it('should build project context string', () => {
      const config = {
        projectName: 'test',
        language: 'typescript',
        framework: 'react',
        buildCommand: 'npm run build'
      };

      const context = buildRalphContext(config);

      expect(context.projectContext).toContain('typescript');
      expect(context.projectContext).toContain('react');
      expect(context.projectContext).toContain('npm run build');
    });
  });

  describe('setupWorktreeInfrastructure', () => {
    it('should create worktrees directory', async () => {
      await setupWorktreeInfrastructure(testDir);

      const worktreesDir = path.join(testDir, '.ralph', 'worktrees');
      expect(await fs.pathExists(worktreesDir)).toBe(true);
    });

    it('should create .gitkeep file', async () => {
      await setupWorktreeInfrastructure(testDir);

      const gitkeepPath = path.join(testDir, '.ralph', 'worktrees', '.gitkeep');
      expect(await fs.pathExists(gitkeepPath)).toBe(true);

      const content = await fs.readFile(gitkeepPath, 'utf-8');
      expect(content).toContain('Git worktrees for parallel story execution');
    });

    it('should add worktrees to .gitignore', async () => {
      await setupWorktreeInfrastructure(testDir);

      const gitignorePath = path.join(testDir, '.gitignore');
      expect(await fs.pathExists(gitignorePath)).toBe(true);

      const content = await fs.readFile(gitignorePath, 'utf-8');
      expect(content).toContain('.ralph/worktrees');
      expect(content).toContain('!.ralph/worktrees/.gitkeep');
    });

    it('should not duplicate gitignore entries on re-run', async () => {
      await setupWorktreeInfrastructure(testDir);
      await setupWorktreeInfrastructure(testDir);

      const gitignorePath = path.join(testDir, '.gitignore');
      const content = await fs.readFile(gitignorePath, 'utf-8');

      // Should only appear once
      const matches = content.match(/\.ralph\/worktrees/g);
      expect(matches.length).toBe(2); // One for the pattern, one for the !.gitkeep
    });
  });

  describe('setupMemoryLayer', () => {
    it('should create memory directory', async () => {
      await setupMemoryLayer(testDir);

      const memoryDir = path.join(testDir, '.ralph', 'memory');
      expect(await fs.pathExists(memoryDir)).toBe(true);
    });

    it('should create patterns.json', async () => {
      await setupMemoryLayer(testDir);

      const patternsPath = path.join(testDir, '.ralph', 'memory', 'patterns.json');
      expect(await fs.pathExists(patternsPath)).toBe(true);

      const content = await fs.readJson(patternsPath);
      expect(Array.isArray(content)).toBe(true);
      expect(content.length).toBe(0);
    });

    it('should create gotchas.json', async () => {
      await setupMemoryLayer(testDir);

      const gotchasPath = path.join(testDir, '.ralph', 'memory', 'gotchas.json');
      expect(await fs.pathExists(gotchasPath)).toBe(true);

      const content = await fs.readJson(gotchasPath);
      expect(Array.isArray(content)).toBe(true);
    });

    it('should create insights.json', async () => {
      await setupMemoryLayer(testDir);

      const insightsPath = path.join(testDir, '.ralph', 'memory', 'insights.json');
      expect(await fs.pathExists(insightsPath)).toBe(true);

      const content = await fs.readJson(insightsPath);
      expect(Array.isArray(content)).toBe(true);
    });

    it('should create index.json with correct structure', async () => {
      await setupMemoryLayer(testDir);

      const indexPath = path.join(testDir, '.ralph', 'memory', 'index.json');
      expect(await fs.pathExists(indexPath)).toBe(true);

      const content = await fs.readJson(indexPath);
      expect(content).toHaveProperty('keywords');
      expect(content).toHaveProperty('categories');
      expect(typeof content.keywords).toBe('object');
      expect(typeof content.categories).toBe('object');
    });
  });

  describe('setupQATemplates', () => {
    it('should create templates directory', async () => {
      const context = buildRalphContext({ projectName: 'test' });
      await setupQATemplates(testDir, context);

      const templatesDir = path.join(testDir, '.ralph', 'templates');
      expect(await fs.pathExists(templatesDir)).toBe(true);
    });

    it('should create QA_REVIEWER.md', async () => {
      const context = buildRalphContext({
        projectName: 'test-project',
        language: 'typescript',
        testCommand: 'npm test'
      });
      await setupQATemplates(testDir, context);

      const reviewerPath = path.join(testDir, '.ralph', 'templates', 'QA_REVIEWER.md');
      expect(await fs.pathExists(reviewerPath)).toBe(true);

      const content = await fs.readFile(reviewerPath, 'utf-8');
      expect(content).toContain('QA Reviewer');
    });

    it('should create QA_FIXER.md', async () => {
      const context = buildRalphContext({
        projectName: 'test-project',
        language: 'typescript'
      });
      await setupQATemplates(testDir, context);

      const fixerPath = path.join(testDir, '.ralph', 'templates', 'QA_FIXER.md');
      expect(await fs.pathExists(fixerPath)).toBe(true);

      const content = await fs.readFile(fixerPath, 'utf-8');
      expect(content).toContain('QA Fixer');
    });

    it('should render templates with project context', async () => {
      const context = buildRalphContext({
        projectName: 'my-awesome-project',
        language: 'typescript',
        framework: 'react',
        testFramework: 'vitest'
      });
      await setupQATemplates(testDir, context);

      const reviewerPath = path.join(testDir, '.ralph', 'templates', 'QA_REVIEWER.md');
      const content = await fs.readFile(reviewerPath, 'utf-8');

      expect(content).toContain('my-awesome-project');
      expect(content).toContain('typescript');
    });
  });

  describe('integration', () => {
    it('should set up complete RALPH infrastructure', async () => {
      // Create necessary directories for writeRalph
      await fs.ensureDir(path.join(testDir, 'scripts', 'ralph'));
      await fs.ensureDir(path.join(testDir, '.claude', 'skills'));
      await fs.ensureDir(path.join(testDir, '.claude', 'commands'));
      await fs.ensureDir(path.join(testDir, 'tasks'));

      // Run all setup functions
      await setupWorktreeInfrastructure(testDir);
      await setupMemoryLayer(testDir);

      const context = buildRalphContext({
        projectName: 'integration-test',
        language: 'typescript',
        framework: 'node'
      });
      await setupQATemplates(testDir, context);

      // Verify all directories exist
      expect(await fs.pathExists(path.join(testDir, '.ralph', 'worktrees'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.ralph', 'memory'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.ralph', 'templates'))).toBe(true);

      // Verify all files exist
      expect(await fs.pathExists(path.join(testDir, '.ralph', 'worktrees', '.gitkeep'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.ralph', 'memory', 'patterns.json'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.ralph', 'memory', 'gotchas.json'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.ralph', 'memory', 'insights.json'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.ralph', 'memory', 'index.json'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.ralph', 'templates', 'QA_REVIEWER.md'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.ralph', 'templates', 'QA_FIXER.md'))).toBe(true);
    });
  });
});
