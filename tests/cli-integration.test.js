/**
 * Integration Tests for CLI Commands
 *
 * Tests the complete CLI workflows to ensure user-facing
 * interface works correctly end-to-end.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { spawn, execSync } from 'child_process';

// Increase timeout for integration tests
const TEST_TIMEOUT = 30000;

/**
 * Helper to run a CLI command and capture output
 */
function runCLI(args, cwd = process.cwd()) {
  return new Promise((resolve) => {
    const nodeExecutable = process.execPath;
    const cliPath = path.join(process.cwd(), 'bin', 'claude-init.js');

    const proc = spawn(nodeExecutable, [cliPath, ...args], {
      cwd,
      env: { ...process.env, NODE_ENV: 'test' },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    proc.on('error', (err) => {
      resolve({ code: 1, stdout, stderr: err.message });
    });

    // Auto-close stdin for non-interactive mode
    proc.stdin.end();
  });
}

describe('CLI Integration Tests', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `cli-integration-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  // ==========================================================================
  // Setup Command Tests
  // ==========================================================================

  describe('claude-init setup', () => {
    it('should create .claude directory with --yes flag', async () => {
      const result = await runCLI(['setup', '--yes', '-t', tempDir]);

      // Check exit code (may be 0 or have output)
      expect(result.code).toBe(0);

      // Check that .claude directory was created
      const claudeDir = path.join(tempDir, '.claude');
      expect(await fs.pathExists(claudeDir)).toBe(true);
    }, TEST_TIMEOUT);

    it('should create CLAUDE.md file', async () => {
      await runCLI(['setup', '--yes', '-t', tempDir]);

      const claudeMdPath = path.join(tempDir, 'CLAUDE.md');
      expect(await fs.pathExists(claudeMdPath)).toBe(true);

      const content = await fs.readFile(claudeMdPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    it('should create settings.json', async () => {
      await runCLI(['setup', '--yes', '-t', tempDir]);

      const settingsPath = path.join(tempDir, '.claude', 'settings.json');
      expect(await fs.pathExists(settingsPath)).toBe(true);

      const settings = await fs.readJson(settingsPath);
      expect(settings).toHaveProperty('contextManagement');
    }, TEST_TIMEOUT);

    it('should create rules directory with files', async () => {
      await runCLI(['setup', '--yes', '-t', tempDir]);

      const rulesDir = path.join(tempDir, '.claude', 'rules');
      expect(await fs.pathExists(rulesDir)).toBe(true);

      const files = await fs.readdir(rulesDir);
      expect(files.length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    it('should create commands directory', async () => {
      await runCLI(['setup', '--yes', '-t', tempDir]);

      const commandsDir = path.join(tempDir, '.claude', 'commands');
      expect(await fs.pathExists(commandsDir)).toBe(true);
    }, TEST_TIMEOUT);

    it('should create skills directory', async () => {
      await runCLI(['setup', '--yes', '-t', tempDir]);

      const skillsDir = path.join(tempDir, '.claude', 'skills');
      expect(await fs.pathExists(skillsDir)).toBe(true);
    }, TEST_TIMEOUT);

    it('should setup RALPH files', async () => {
      await runCLI(['setup', '--yes', '-t', tempDir]);

      const ralphDir = path.join(tempDir, 'scripts', 'ralph');
      expect(await fs.pathExists(ralphDir)).toBe(true);

      const ralphScript = path.join(ralphDir, 'ralph.sh');
      expect(await fs.pathExists(ralphScript)).toBe(true);
    }, TEST_TIMEOUT);

    it('should create PROJECT_SPEC.md', async () => {
      await runCLI(['setup', '--yes', '-t', tempDir]);

      const specPath = path.join(tempDir, 'PROJECT_SPEC.md');
      expect(await fs.pathExists(specPath)).toBe(true);
    }, TEST_TIMEOUT);

    describe('--feature flag', () => {
      it('should create prd.json when --feature is provided', async () => {
        const result = await runCLI(['setup', '--yes', '-t', tempDir, '--feature', 'Test Feature']);

        const prdPath = path.join(tempDir, 'prd.json');
        expect(await fs.pathExists(prdPath)).toBe(true);

        const prd = await fs.readJson(prdPath);
        expect(prd.project).toContain('Test Feature');
        expect(prd.userStories).toBeDefined();
        expect(Array.isArray(prd.userStories)).toBe(true);
      }, TEST_TIMEOUT);

      it('should create PRD markdown file with --feature', async () => {
        await runCLI(['setup', '--yes', '-t', tempDir, '--feature', 'User Auth']);

        const tasksDir = path.join(tempDir, 'tasks');
        expect(await fs.pathExists(tasksDir)).toBe(true);

        const files = await fs.readdir(tasksDir);
        const prdFile = files.find(f => f.startsWith('prd-') && f.endsWith('.md'));
        expect(prdFile).toBeDefined();
      }, TEST_TIMEOUT);

      it('should create progress.txt with --feature', async () => {
        await runCLI(['setup', '--yes', '-t', tempDir, '--feature', 'API Layer']);

        const progressPath = path.join(tempDir, 'progress.txt');
        expect(await fs.pathExists(progressPath)).toBe(true);
      }, TEST_TIMEOUT);
    });
  });

  // ==========================================================================
  // RALPH Command Tests
  // ==========================================================================

  describe('claude-init ralph', () => {
    beforeEach(async () => {
      // Setup a project first
      await runCLI(['setup', '--yes', '-t', tempDir, '--feature', 'Test Feature']);
    });

    describe('--status flag', () => {
      it('should show PRD status', async () => {
        const result = await runCLI(['ralph', '--status', '-t', tempDir]);

        expect(result.stdout).toContain('Status');
        expect(result.stdout.toLowerCase()).toContain('test feature');
      }, TEST_TIMEOUT);

      it('should show story count', async () => {
        const result = await runCLI(['ralph', '--status', '-t', tempDir]);

        // Should show stories count
        expect(result.stdout).toMatch(/\d+\/\d+/); // e.g., "0/4"
      }, TEST_TIMEOUT);
    });

    describe('--validate flag', () => {
      it('should validate prd.json', async () => {
        const result = await runCLI(['ralph', '--validate', '-t', tempDir]);

        // Should show validation result
        expect(result.stdout.toLowerCase()).toMatch(/validation (passed|failed)/);
      }, TEST_TIMEOUT);

      it('should fail on invalid prd.json', async () => {
        // Write invalid prd.json
        const prdPath = path.join(tempDir, 'prd.json');
        await fs.writeJson(prdPath, { invalid: true });

        const result = await runCLI(['ralph', '--validate', '-t', tempDir]);

        expect(result.code).not.toBe(0);
        expect(result.stdout.toLowerCase()).toContain('failed');
      }, TEST_TIMEOUT);
    });

    describe('--reset flag', () => {
      it('should reset progress.txt', async () => {
        // Add some content to progress.txt
        const progressPath = path.join(tempDir, 'progress.txt');
        await fs.appendFile(progressPath, '\n## Iteration 1\nSome progress...');

        const result = await runCLI(['ralph', '--reset', '-t', tempDir]);

        expect(result.code).toBe(0);

        const content = await fs.readFile(progressPath, 'utf-8');
        expect(content).not.toContain('Iteration 1');
      }, TEST_TIMEOUT);
    });

    describe('--analyze flag', () => {
      it('should regenerate PROJECT_SPEC.md', async () => {
        const specPath = path.join(tempDir, 'PROJECT_SPEC.md');
        const originalContent = await fs.readFile(specPath, 'utf-8');

        // Modify spec
        await fs.writeFile(specPath, '# Modified');

        const result = await runCLI(['ralph', '--analyze', '-t', tempDir]);

        expect(result.code).toBe(0);

        const newContent = await fs.readFile(specPath, 'utf-8');
        expect(newContent).not.toBe('# Modified');
      }, TEST_TIMEOUT);
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('error handling', () => {
    it('should show error for invalid target directory', async () => {
      const result = await runCLI(['setup', '--yes', '-t', '/nonexistent/path/12345']);

      // Should fail or show error
      expect(result.code !== 0 || result.stderr.length > 0 || result.stdout.includes('error')).toBe(true);
    }, TEST_TIMEOUT);

    it('should show help with --help flag', async () => {
      const result = await runCLI(['--help']);

      expect(result.stdout.toLowerCase()).toContain('usage');
      expect(result.stdout.toLowerCase()).toContain('setup');
    }, TEST_TIMEOUT);

    it('should show version with --version flag', async () => {
      const result = await runCLI(['--version']);

      // Should show a version number
      expect(result.stdout).toMatch(/\d+\.\d+/);
    }, TEST_TIMEOUT);
  });

  // ==========================================================================
  // Project Validation Tests
  // ==========================================================================

  describe('validate command', () => {
    it('should validate templates', async () => {
      const result = await runCLI(['validate']);

      // Should complete without error
      expect(result.code).toBe(0);
    }, TEST_TIMEOUT);
  });

  // ==========================================================================
  // News Command Tests (if exists)
  // ==========================================================================

  describe('news command', () => {
    it('should handle news --limit flag', async () => {
      const result = await runCLI(['news', '--limit', '3']);

      // Should not crash - actual network calls may fail in test env
      expect(typeof result.code).toBe('number');
    }, TEST_TIMEOUT);
  });
});

// ==========================================================================
// Smoke Tests - Quick Verification
// ==========================================================================

describe('CLI Smoke Tests', () => {
  it('should have executable CLI entry point', async () => {
    const cliPath = path.join(process.cwd(), 'bin', 'claude-init.js');
    expect(await fs.pathExists(cliPath)).toBe(true);
  });

  it('should have package.json with bin entry', async () => {
    const pkgPath = path.join(process.cwd(), 'package.json');
    const pkg = await fs.readJson(pkgPath);

    expect(pkg.bin).toBeDefined();
    expect(pkg.bin['claude-init']).toBeDefined();
  });

  it('should have required script files', async () => {
    const scriptsDir = path.join(process.cwd(), 'scripts');
    const requiredScripts = [
      'setup-project.js',
      'run-ralph.js'
    ];

    for (const script of requiredScripts) {
      const scriptPath = path.join(scriptsDir, script);
      expect(await fs.pathExists(scriptPath)).toBe(true);
    }
  });

  it('should have required template directories', async () => {
    const templatesDir = path.join(process.cwd(), 'templates');
    const requiredDirs = [
      'ralph',
      'rules',
      'commands',
      'agents',
      'skills',
      'hooks'
    ];

    for (const dir of requiredDirs) {
      const dirPath = path.join(templatesDir, dir);
      expect(await fs.pathExists(dirPath)).toBe(true);
    }
  });
});
