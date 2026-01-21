#!/usr/bin/env node

/**
 * Setup Project Script
 * Interactive project initialization with Claude Code best practices
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { ui } from './utils/design-system.js';
import inquirer from 'inquirer';
import { Command } from 'commander';
import {
  generateClaudeMd,
  generateSettings,
  generateMcpConfig,
  generateHooksConfig
} from './utils/template-generator.js';
import {
  hasUpdatesSinceLastSetup,
  markProjectSetup,
  loadMetadata
} from './utils/diff-checker.js';
import { registerProject } from './utils/project-registry.js';
import { analyzeProject, findDocumentation } from './utils/project-analyzer.js';
import { CONFIG } from './utils/config-manager.js';
import { ensureDirs, safeWriteFile, safeWriteJson } from './utils/fs-helper.js';
import {
  validateSetupEnvironment,
  checkKnowledgeBaseUpdates,
  runProjectAnalysis as runAnalysisPhase,
  generateProjectSpec,
  finalizeSetup,
  displaySetupSummary,
  displayNextSteps
} from './setup/phases.js';
import {
  writeRules,
  writeCommands,
  writeAgents,
  writeSkills
} from './setup/template-writer.js';
import {
  writeRalph,
  writeInitialPrd
} from './setup/ralph-setup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KNOWLEDGE_BASE_PATH = path.join(__dirname, '..', 'knowledge-base');
const TEMPLATES_PATH = path.join(__dirname, '..', 'templates');

const program = new Command();

program
  .option('-t, --target <path>', 'Target project directory', process.cwd())
  .option('-m, --merge', 'Merge with existing configuration')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .option('--no-hooks', 'Skip hooks setup')
  .option('--no-agents', 'Skip agents setup')
  .option('--no-commands', 'Skip commands setup')
  .option('--no-rules', 'Skip rules setup')
  .option('--no-skills', 'Skip skills setup')
  .option('--no-ralph', 'Skip RALPH autonomous agent setup')
  .option('-f, --feature <description>', 'Create initial PRD for this feature (enables RALPH)')
  .parse(process.argv);

const options = program.opts();

/**
 * Gather project configuration through prompts
 */
async function gatherProjectConfig() {
  if (options.yes) {
    return {
      projectName: path.basename(options.target),
      projectDescription: 'A software project',
      language: 'typescript',
      framework: 'none',
      buildCommand: 'npm run build',
      testCommand: 'npm test',
      lintCommand: 'npm run lint',
      devCommand: 'npm run dev',
      hasDocker: false,
      hasDatabase: false,
      includeSecuritySection: true,
      includePerformanceSection: true,
      setupHooks: options.hooks !== false,
      setupAgents: options.agents !== false,
      setupCommands: options.commands !== false,
      setupRules: options.rules !== false,
      setupSkills: options.skills !== false,
      setupRalph: options.ralph !== false || !!options.feature,
      createInitialPrd: !!options.feature,
      initialFeature: options.feature || null,
      lintOnSave: true,
      formatOnSave: false,
      validateBashCommands: false,
      includeGitHub: false,
      includeDatabase: false
    };
  }

  ui.header('Claude Code Project Setup', 'rocket');

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: path.basename(options.target)
    },
    {
      type: 'input',
      name: 'projectDescription',
      message: 'Project description:',
      default: 'A software project'
    },
    {
      type: 'list',
      name: 'language',
      message: 'Primary language:',
      choices: [
        { name: 'TypeScript', value: 'typescript' },
        { name: 'JavaScript', value: 'javascript' },
        { name: 'Python', value: 'python' },
        { name: 'Go', value: 'go' },
        { name: 'Rust', value: 'rust' },
        { name: 'Other', value: 'other' }
      ]
    },
    {
      type: 'list',
      name: 'framework',
      message: 'Framework/Runtime:',
      choices: [
        { name: 'None', value: 'none' },
        { name: 'React', value: 'react' },
        { name: 'Next.js', value: 'nextjs' },
        { name: 'Node.js/Express', value: 'express' },
        { name: 'FastAPI', value: 'fastapi' },
        { name: 'Django', value: 'django' },
        { name: '.NET', value: 'dotnet' },
        { name: 'Other', value: 'other' }
      ]
    },
    {
      type: 'input',
      name: 'buildCommand',
      message: 'Build command:',
      default: (answers) => {
        switch (answers.language) {
          case 'python': return 'python -m build';
          case 'go': return 'go build';
          case 'rust': return 'cargo build';
          default: return 'npm run build';
        }
      }
    },
    {
      type: 'input',
      name: 'testCommand',
      message: 'Test command:',
      default: (answers) => {
        switch (answers.language) {
          case 'python': return 'pytest';
          case 'go': return 'go test ./...';
          case 'rust': return 'cargo test';
          default: return 'npm test';
        }
      }
    },
    {
      type: 'input',
      name: 'lintCommand',
      message: 'Lint command:',
      default: (answers) => {
        switch (answers.language) {
          case 'python': return 'ruff check .';
          case 'go': return 'golangci-lint run';
          case 'rust': return 'cargo clippy';
          default: return 'npm run lint';
        }
      }
    },
    {
      type: 'confirm',
      name: 'hasDocker',
      message: 'Using Docker?',
      default: false
    },
    {
      type: 'confirm',
      name: 'hasDatabase',
      message: 'Has database?',
      default: false
    },
    {
      type: 'list',
      name: 'databaseType',
      message: 'Database type:',
      when: (answers) => answers.hasDatabase,
      choices: ['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite', 'Redis', 'Other']
    },
    {
      type: 'confirm',
      name: 'setupHooks',
      message: 'Set up hooks (auto-lint, validation)?',
      default: true,
      when: () => options.hooks !== false
    },
    {
      type: 'confirm',
      name: 'lintOnSave',
      message: 'Run linter after file edits?',
      when: (answers) => answers.setupHooks,
      default: true
    },
    {
      type: 'confirm',
      name: 'setupAgents',
      message: 'Set up custom agents (code-reviewer, debugger)?',
      default: true,
      when: () => options.agents !== false
    },
    {
      type: 'confirm',
      name: 'setupCommands',
      message: 'Set up slash commands (/review, /test, /deploy)?',
      default: true,
      when: () => options.commands !== false
    },
    {
      type: 'confirm',
      name: 'setupRules',
      message: 'Set up modular rules (code-style, security)?',
      default: true,
      when: () => options.rules !== false
    },
    {
      type: 'confirm',
      name: 'setupSkills',
      message: 'Set up agent skills?',
      default: true,
      when: () => options.skills !== false
    },
    {
      type: 'confirm',
      name: 'includeGitHub',
      message: 'Include GitHub MCP server?',
      default: false
    },
    {
      type: 'confirm',
      name: 'setupRalph',
      message: 'Set up RALPH autonomous development agent?',
      default: true,
      when: () => options.ralph !== false
    },
    {
      type: 'confirm',
      name: 'createInitialPrd',
      message: 'Create an initial PRD to start with RALPH?',
      default: false,
      when: (answers) => answers.setupRalph
    },
    {
      type: 'input',
      name: 'initialFeature',
      message: 'Describe the first feature to build:',
      when: (answers) => answers.createInitialPrd,
      validate: (input) => input.length > 5 ? true : 'Please provide a brief description (at least 5 characters)'
    }
  ]);

  return answers;
}

/**
 * Create the .claude directory structure
 */
async function createDirectoryStructure(targetPath, config) {
  const claudeDir = path.join(targetPath, '.claude');

  const directories = [
    claudeDir,
    path.join(claudeDir, 'settings'),
    path.join(claudeDir, 'rules'),
    path.join(claudeDir, 'commands'),
    path.join(claudeDir, 'agents'),
    path.join(claudeDir, 'skills'),
    path.join(claudeDir, 'hooks')
  ];

  for (const dir of directories) {
    await fs.ensureDir(dir);
  }

  return claudeDir;
}

/**
 * Write CLAUDE.md file
 */
async function writeClaudeMd(targetPath, config) {
  const claudeMdPath = path.join(targetPath, 'CLAUDE.md');

  // Check if exists and handle merge
  if (await fs.pathExists(claudeMdPath) && !options.merge) {
    const { overwrite } = await inquirer.prompt([{
      type: 'confirm',
      name: 'overwrite',
      message: 'CLAUDE.md already exists. Overwrite?',
      default: false
    }]);

    if (!overwrite) {
      ui.warningText('  Skipping CLAUDE.md');
      return;
    }
  }

  const content = await generateClaudeMd(config);
  await fs.writeFile(claudeMdPath, content, 'utf-8');
  ui.successText(`  ${ui.icons.success} Created CLAUDE.md`);
}

/**
 * Write settings files
 */
async function writeSettings(claudeDir, config) {
  const settingsPath = path.join(claudeDir, 'settings.json');

  const settings = {
    permissions: {
      allow: [],
      deny: [
        'Read(.env)',
        'Read(.env.*)',
        'Read(./secrets/**)'
      ],
      defaultMode: 'default'
    },
    env: {}
  };

  await fs.writeJson(settingsPath, settings, { spaces: 2 });
  ui.successText(`  ${ui.icons.success} Created settings.json`);
}

/**
 * Write hooks configuration
 */
async function writeHooks(claudeDir, config) {
  const hooksDir = path.join(claudeDir, 'hooks');

  const hooks = {
    description: 'Project hooks configuration',
    hooks: {}
  };

  if (config.lintOnSave) {
    hooks.hooks.PostToolUse = [{
      matcher: 'Write|Edit',
      hooks: [{
        type: 'command',
        command: config.lintCommand,
        timeout: CONFIG.timeouts.lintHook
      }]
    }];
  }

  // Auto-compact hook - monitors context usage at threshold from config
  const threshold = config.compactThreshold || CONFIG.compact.threshold;
  hooks.hooks.Stop = [{
    matcher: '.*',
    hooks: [{
      type: 'command',
      command: `COMPACT_THRESHOLD=${threshold} \${CLAUDE_PROJECT_DIR}/.claude/hooks/auto-compact.sh`,
      timeout: CONFIG.timeouts.autoCompactHook
    }]
  }];

  await fs.writeJson(path.join(hooksDir, 'hooks.json'), hooks, { spaces: 2 });
  ui.successText(`  ${ui.icons.success} Created hooks/hooks.json (with auto-compact at ${threshold}%)`);

  // Create a sample validation script
  const validateBashScript = `#!/bin/bash
# Validate bash commands before execution
# Read JSON input from stdin
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Block dangerous commands
DANGEROUS_PATTERNS=(
  "rm -rf /"
  "rm -rf ~"
  ":(){ :|:& };:"
)

for pattern in "\${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qF "$pattern"; then
    echo "Blocked: Dangerous command detected" >&2
    exit 2
  fi
done

exit 0
`;

  await fs.writeFile(path.join(hooksDir, 'validate-bash.sh'), validateBashScript, 'utf-8');
  await fs.chmod(path.join(hooksDir, 'validate-bash.sh'), '755');
  ui.successText(`  ${ui.icons.success} Created hooks/validate-bash.sh`);

  // Create auto-compact script for context monitoring
  const autoCompactScript = `#!/bin/bash

# Auto-Compact Hook Script
# Monitors context usage and warns when threshold is reached.
# Runs after each Claude response (Stop hook) to check context size.

set -e

# Configuration (can be overridden via environment)
COMPACT_THRESHOLD="\${COMPACT_THRESHOLD:-70}"
MAX_CONTEXT_TOKENS="\${MAX_CONTEXT_TOKENS:-200000}"
CHARS_PER_TOKEN=4

# State file location
if [[ -n "$USERPROFILE" ]]; then
  STATE_DIR="$USERPROFILE/.claude"
else
  STATE_DIR="$HOME/.claude"
fi
STATE_FILE="$STATE_DIR/auto-compact-state.json"

# Read JSON input from stdin
INPUT=$(cat)

# Extract transcript_path from input
TRANSCRIPT_PATH=$(echo "$INPUT" | grep -o '"transcript_path"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*: *"\\([^"]*\\)".*/\\1/' 2>/dev/null || echo "")
SESSION_ID=$(echo "$INPUT" | grep -o '"session_id"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*: *"\\([^"]*\\)".*/\\1/' 2>/dev/null || echo "unknown")

# If no transcript path found, exit
if [[ -z "$TRANSCRIPT_PATH" ]] || [[ ! -f "$TRANSCRIPT_PATH" ]]; then
  exit 0
fi

# Get file size in bytes
if [[ -f "$TRANSCRIPT_PATH" ]]; then
  FILE_SIZE=$(stat -c%s "$TRANSCRIPT_PATH" 2>/dev/null || stat -f%z "$TRANSCRIPT_PATH" 2>/dev/null || echo "0")
else
  FILE_SIZE=0
fi

# Estimate tokens (file size / chars per token)
ESTIMATED_TOKENS=$((FILE_SIZE / CHARS_PER_TOKEN))

# Calculate usage percentage
USAGE_PERCENT=$((ESTIMATED_TOKENS * 100 / MAX_CONTEXT_TOKENS))

# Debug output (if enabled)
if [[ "$CLAUDE_AUTO_COMPACT_DEBUG" == "1" ]]; then
  echo "[auto-compact] Tokens: ~$ESTIMATED_TOKENS | Usage: \${USAGE_PERCENT}% | Threshold: \${COMPACT_THRESHOLD}%" >&2
fi

# Load last suggestion time from state file
LAST_SUGGESTION=0
if [[ -f "$STATE_FILE" ]]; then
  LAST_SUGGESTION=$(grep -o '"lastCompactSuggestion"[[:space:]]*:[[:space:]]*[0-9]*' "$STATE_FILE" | sed 's/.*: *//' 2>/dev/null || echo "0")
fi

# Current time in milliseconds
CURRENT_TIME=$(($(date +%s) * 1000))

# Cooldown: 5 minutes in milliseconds
COOLDOWN=$((5 * 60 * 1000))

# Check if we recently suggested
TIME_SINCE_LAST=$((CURRENT_TIME - LAST_SUGGESTION))

# If usage exceeds threshold and cooldown has passed
if [[ $USAGE_PERCENT -ge $COMPACT_THRESHOLD ]] && [[ $TIME_SINCE_LAST -gt $COOLDOWN ]]; then
  # Update state
  mkdir -p "$STATE_DIR"
  echo "{\\"lastCompactSuggestion\\": $CURRENT_TIME, \\"sessionId\\": \\"$SESSION_ID\\"}" > "$STATE_FILE"

  # Show warning to user
  echo "" >&2
  echo "⚠️  Context usage at \${USAGE_PERCENT}% (threshold: \${COMPACT_THRESHOLD}%)" >&2
  echo "   Consider running /compact to free up context space." >&2
  echo "" >&2
fi

# Always exit successfully (don't block)
exit 0
`;

  await fs.writeFile(path.join(hooksDir, 'auto-compact.sh'), autoCompactScript, 'utf-8');
  await fs.chmod(path.join(hooksDir, 'auto-compact.sh'), '755');
  ui.successText(`  ${ui.icons.success} Created hooks/auto-compact.sh (70% context threshold)`);
}

/**
 * Write MCP configuration
 */
async function writeMcpConfig(targetPath, config) {
  if (!config.includeGitHub && !config.includeDatabase) {
    return;
  }

  const mcpConfig = {
    mcpServers: {}
  };

  if (config.includeGitHub) {
    mcpConfig.mcpServers.github = {
      type: 'http',
      url: 'https://api.githubcopilot.com/mcp/'
    };
  }

  await fs.writeJson(path.join(targetPath, '.mcp.json'), mcpConfig, { spaces: 2 });
  ui.successText(`  ${ui.icons.success} Created .mcp.json`);
}

/**
 * Main setup function
 * Uses phase functions from setup/phases.js for better organization and testability
 */
async function main() {
  console.log(ui.colors.primaryBold('\n╔════════════════════════════════════════╗'));
  console.log(ui.colors.primaryBold('║   Claude Code Project Initializer      ║'));
  console.log(ui.colors.primaryBold('╚════════════════════════════════════════╝\n'));

  const targetPath = path.resolve(options.target);
  ui.muted(`Target directory: ${targetPath}\n`);

  // Phase 1: Validate setup environment
  const validation = await validateSetupEnvironment(targetPath, options);
  if (!validation.valid) {
    ui.errorText(`Setup validation failed: ${validation.errors.join(', ')}`);
    process.exit(1);
  }

  // Phase 2: Check for knowledge base updates
  if (validation.kbExists && validation.hasUpdates) {
    const proceed = await checkKnowledgeBaseUpdates(validation.updateInfo, options);
    if (!proceed) {
      process.exit(0);
    }
  }

  // Gather configuration (interactive prompts)
  const config = await gatherProjectConfig();

  ui.subheader('Creating project structure...', 'folder');
  ui.blank();

  // Create directory structure
  const claudeDir = await createDirectoryStructure(targetPath, config);

  // Write files
  const spinner = ui.spinner('Generating files...').start();

  // Store analysis for RALPH integration
  let projectAnalysis = null;

  try {
    // Write core configuration files
    await writeClaudeMd(targetPath, config);
    await writeSettings(claudeDir, config);

    if (config.setupRules !== false) {
      await writeRules(claudeDir, config);
    }

    if (config.setupCommands !== false) {
      await writeCommands(claudeDir, config);
    }

    if (config.setupAgents !== false) {
      await writeAgents(claudeDir, config);
    }

    if (config.setupSkills !== false) {
      await writeSkills(claudeDir, config);
    }

    if (config.setupHooks !== false) {
      await writeHooks(claudeDir, config);
    }

    // Phase 3 & 4: Run project analysis and generate spec (if RALPH enabled)
    if (config.setupRalph !== false) {
      spinner.stop();
      projectAnalysis = await runAnalysisPhase(targetPath);

      // Generate PROJECT_SPEC.md if analysis successful
      if (projectAnalysis) {
        await generateProjectSpec(targetPath, projectAnalysis);
      }

      spinner.start('Continuing setup...');

      // Set up RALPH with analysis data
      await writeRalph(targetPath, config, projectAnalysis);

      // Write initial PRD if requested (uses intelligent generation with analysis)
      await writeInitialPrd(targetPath, config, projectAnalysis);
    }

    await writeMcpConfig(targetPath, config);

    // Phase 5: Finalize setup - register project
    const registration = await finalizeSetup(targetPath, config);

    spinner.succeed('Project setup complete!');

    // Phase 6 & 7: Display summary and next steps
    displaySetupSummary(config, projectAnalysis, registration);
    displayNextSteps(config, projectAnalysis);

  } catch (error) {
    spinner.fail('Setup failed');
    console.error(ui.colors.error(`\n${ui.icons.error} Error:`), error.message);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(ui.colors.error(`\n${ui.icons.error} Setup failed:`), error.message);
  process.exit(1);
});
