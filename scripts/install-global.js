#!/usr/bin/env node

/**
 * Global Installation Script for RALPH
 *
 * Installs skills, commands, agents, and rules to ~/.claude/
 * for global availability across all projects.
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to templates
const TEMPLATES_PATH = path.join(__dirname, '..', 'templates', 'global');

// Get Claude Code global directory
function getClaudeGlobalDir() {
  const homeDir = os.homedir();
  return path.join(homeDir, '.claude');
}

// Print banner
function printBanner() {
  console.log(chalk.cyan.bold('\n╔════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║     RALPH Global Installation          ║'));
  console.log(chalk.cyan.bold('║     Autonomous Development Agent       ║'));
  console.log(chalk.cyan.bold('╚════════════════════════════════════════╝\n'));
}

// Print success message
function printSuccess(message) {
  console.log(chalk.green(`  ✓ ${message}`));
}

// Print warning message
function printWarning(message) {
  console.log(chalk.yellow(`  ⚠ ${message}`));
}

// Print error message
function printError(message) {
  console.log(chalk.red(`  ✗ ${message}`));
}

// Print info message
function printInfo(message) {
  console.log(chalk.blue(`  ℹ ${message}`));
}

/**
 * Check if file exists and ask for overwrite permission
 */
async function shouldOverwrite(filePath, interactive = true) {
  if (!await fs.pathExists(filePath)) {
    return true; // File doesn't exist, safe to write
  }

  if (!interactive) {
    return true; // Non-interactive mode, always overwrite
  }

  const { overwrite } = await inquirer.prompt([{
    type: 'confirm',
    name: 'overwrite',
    message: `${path.basename(filePath)} already exists. Overwrite?`,
    default: true
  }]);

  return overwrite;
}

/**
 * Copy a directory recursively
 */
async function copyDirectory(source, destination, interactive = true) {
  const items = await fs.readdir(source, { withFileTypes: true });
  let copiedCount = 0;

  for (const item of items) {
    const sourcePath = path.join(source, item.name);
    const destPath = path.join(destination, item.name);

    if (item.isDirectory()) {
      await fs.ensureDir(destPath);
      copiedCount += await copyDirectory(sourcePath, destPath, interactive);
    } else {
      const shouldCopy = await shouldOverwrite(destPath, interactive);
      if (shouldCopy) {
        await fs.copy(sourcePath, destPath);
        copiedCount++;
      }
    }
  }

  return copiedCount;
}

/**
 * Install skills to ~/.claude/skills/
 */
async function installSkills(claudeDir, interactive) {
  const skillsSource = path.join(TEMPLATES_PATH, 'skills');
  const skillsTarget = path.join(claudeDir, 'skills');

  if (!await fs.pathExists(skillsSource)) {
    printWarning('Skills templates not found');
    return 0;
  }

  await fs.ensureDir(skillsTarget);

  const skills = await fs.readdir(skillsSource, { withFileTypes: true });
  let installed = 0;

  for (const skill of skills) {
    if (skill.isDirectory()) {
      const skillSourceDir = path.join(skillsSource, skill.name);
      const skillTargetDir = path.join(skillsTarget, skill.name);

      await fs.ensureDir(skillTargetDir);

      const skillFile = path.join(skillSourceDir, 'SKILL.md');
      const targetFile = path.join(skillTargetDir, 'SKILL.md');

      if (await fs.pathExists(skillFile)) {
        const shouldCopy = await shouldOverwrite(targetFile, interactive);
        if (shouldCopy) {
          await fs.copy(skillFile, targetFile);
          printSuccess(`Created ~/.claude/skills/${skill.name}/SKILL.md`);
          installed++;
        }
      }
    }
  }

  return installed;
}

/**
 * Install commands to ~/.claude/commands/
 */
async function installCommands(claudeDir, interactive) {
  const commandsSource = path.join(TEMPLATES_PATH, 'commands');
  const commandsTarget = path.join(claudeDir, 'commands');

  if (!await fs.pathExists(commandsSource)) {
    printWarning('Commands templates not found');
    return 0;
  }

  await fs.ensureDir(commandsTarget);

  const commands = await fs.readdir(commandsSource);
  let installed = 0;

  for (const command of commands) {
    if (command.endsWith('.md')) {
      const sourcePath = path.join(commandsSource, command);
      const targetPath = path.join(commandsTarget, command);

      const shouldCopy = await shouldOverwrite(targetPath, interactive);
      if (shouldCopy) {
        await fs.copy(sourcePath, targetPath);
        printSuccess(`Created ~/.claude/commands/${command}`);
        installed++;
      }
    }
  }

  return installed;
}

/**
 * Install agents to ~/.claude/agents/
 */
async function installAgents(claudeDir, interactive) {
  const agentsSource = path.join(TEMPLATES_PATH, 'agents');
  const agentsTarget = path.join(claudeDir, 'agents');

  if (!await fs.pathExists(agentsSource)) {
    printWarning('Agents templates not found');
    return 0;
  }

  await fs.ensureDir(agentsTarget);

  const agents = await fs.readdir(agentsSource);
  let installed = 0;

  for (const agent of agents) {
    if (agent.endsWith('.md')) {
      const sourcePath = path.join(agentsSource, agent);
      const targetPath = path.join(agentsTarget, agent);

      const shouldCopy = await shouldOverwrite(targetPath, interactive);
      if (shouldCopy) {
        await fs.copy(sourcePath, targetPath);
        printSuccess(`Created ~/.claude/agents/${agent}`);
        installed++;
      }
    }
  }

  return installed;
}

/**
 * Install rules to ~/.claude/rules/
 */
async function installRules(claudeDir, interactive) {
  const rulesSource = path.join(TEMPLATES_PATH, 'rules');
  const rulesTarget = path.join(claudeDir, 'rules');

  if (!await fs.pathExists(rulesSource)) {
    printWarning('Rules templates not found');
    return 0;
  }

  await fs.ensureDir(rulesTarget);

  const rules = await fs.readdir(rulesSource);
  let installed = 0;

  for (const rule of rules) {
    if (rule.endsWith('.md')) {
      const sourcePath = path.join(rulesSource, rule);
      const targetPath = path.join(rulesTarget, rule);

      const shouldCopy = await shouldOverwrite(targetPath, interactive);
      if (shouldCopy) {
        await fs.copy(sourcePath, targetPath);
        printSuccess(`Created ~/.claude/rules/${rule}`);
        installed++;
      }
    }
  }

  return installed;
}

/**
 * Create or update settings.json
 */
async function installSettings(claudeDir, interactive) {
  const settingsPath = path.join(claudeDir, 'settings.json');

  // Default settings for RALPH
  const defaultSettings = {
    permissions: {
      allow: [
        'Bash(npm:*)',
        'Bash(node:*)',
        'Bash(git:*)',
        'Bash(npx:*)'
      ],
      deny: [
        'Read(.env)',
        'Read(.env.*)',
        'Read(./secrets/**)'
      ]
    },
    env: {}
  };

  if (await fs.pathExists(settingsPath)) {
    // Merge with existing settings
    try {
      const existing = await fs.readJson(settingsPath);
      const merged = {
        ...existing,
        permissions: {
          allow: [...new Set([...(existing.permissions?.allow || []), ...defaultSettings.permissions.allow])],
          deny: [...new Set([...(existing.permissions?.deny || []), ...defaultSettings.permissions.deny])]
        }
      };

      const shouldUpdate = await shouldOverwrite(settingsPath, interactive);
      if (shouldUpdate) {
        await fs.writeJson(settingsPath, merged, { spaces: 2 });
        printSuccess('Updated ~/.claude/settings.json');
        return 1;
      }
    } catch (error) {
      printWarning('Could not merge settings.json, creating new');
      await fs.writeJson(settingsPath, defaultSettings, { spaces: 2 });
      printSuccess('Created ~/.claude/settings.json');
      return 1;
    }
  } else {
    await fs.writeJson(settingsPath, defaultSettings, { spaces: 2 });
    printSuccess('Created ~/.claude/settings.json');
    return 1;
  }

  return 0;
}

/**
 * Print completion summary
 */
function printSummary(stats) {
  console.log(chalk.cyan.bold('\n╔════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║     Installation Complete!             ║'));
  console.log(chalk.cyan.bold('╚════════════════════════════════════════╝\n'));

  console.log(chalk.white('  Installed:'));
  console.log(chalk.white(`    Skills:   ${stats.skills}`));
  console.log(chalk.white(`    Commands: ${stats.commands}`));
  console.log(chalk.white(`    Agents:   ${stats.agents}`));
  console.log(chalk.white(`    Rules:    ${stats.rules}`));
  console.log(chalk.white(`    Settings: ${stats.settings}`));

  console.log(chalk.green.bold('\n  🎉 RALPH is ready!\n'));

  console.log(chalk.white('  Available commands in any project:\n'));
  console.log(chalk.cyan('    /setup-project') + chalk.gray('  - Interactive project setup'));
  console.log(chalk.cyan('    /ralph') + chalk.gray('          - RALPH status and management'));
  console.log(chalk.cyan('    /ralph-run') + chalk.gray('      - Start autonomous development'));
  console.log(chalk.cyan('    /prd') + chalk.gray('            - Generate PRD from description'));
  console.log(chalk.cyan('    /code-review') + chalk.gray('    - Run code review'));
  console.log(chalk.cyan('    /commit') + chalk.gray('         - Create git commit'));
  console.log(chalk.cyan('    /review') + chalk.gray('         - Review changes'));
  console.log(chalk.cyan('    /test') + chalk.gray('           - Run tests'));

  console.log(chalk.gray('\n  No CLI tool needed - everything works through Claude!\n'));
}

/**
 * Main installation function
 */
async function main() {
  printBanner();

  const claudeDir = getClaudeGlobalDir();

  console.log(chalk.white(`  Installing to: ${claudeDir}\n`));

  // Check if Claude directory exists
  if (!await fs.pathExists(claudeDir)) {
    printInfo('Creating ~/.claude/ directory...');
    await fs.ensureDir(claudeDir);
  }

  // Check if templates exist
  if (!await fs.pathExists(TEMPLATES_PATH)) {
    printError(`Templates not found at: ${TEMPLATES_PATH}`);
    printError('Please run this script from the supreme-ralph directory');
    process.exit(1);
  }

  // Check for --yes flag for non-interactive mode
  const interactive = !process.argv.includes('--yes') && !process.argv.includes('-y');

  if (!interactive) {
    printInfo('Running in non-interactive mode (--yes)\n');
  }

  const spinner = ora('Installing...').start();

  try {
    spinner.text = 'Installing skills...';
    const skillsCount = await installSkills(claudeDir, interactive);

    spinner.text = 'Installing commands...';
    const commandsCount = await installCommands(claudeDir, interactive);

    spinner.text = 'Installing agents...';
    const agentsCount = await installAgents(claudeDir, interactive);

    spinner.text = 'Installing rules...';
    const rulesCount = await installRules(claudeDir, interactive);

    spinner.text = 'Installing settings...';
    const settingsCount = await installSettings(claudeDir, interactive);

    spinner.succeed('Installation complete!');

    printSummary({
      skills: skillsCount,
      commands: commandsCount,
      agents: agentsCount,
      rules: rulesCount,
      settings: settingsCount
    });

  } catch (error) {
    spinner.fail('Installation failed');
    printError(error.message);
    process.exit(1);
  }
}

// Run main function
main().catch(error => {
  console.error(chalk.red('\n❌ Installation failed:'), error.message);
  process.exit(1);
});
