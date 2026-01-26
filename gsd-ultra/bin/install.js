#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

// Colors
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const magenta = '\x1b[35m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

// Get version from package.json
const pkg = require('../package.json');

// Parse args
const args = process.argv.slice(2);
const hasGlobal = args.includes('--global') || args.includes('-g');
const hasLocal = args.includes('--local') || args.includes('-l');
const hasUninstall = args.includes('--uninstall') || args.includes('-u');
const hasHelp = args.includes('--help') || args.includes('-h');
const hasCopilot = args.includes('--copilot');
const forceStatusline = args.includes('--force-statusline');

const banner = `
${cyan}   ██████╗ ███████╗██████╗     ${magenta}██╗   ██╗██╗  ████████╗██████╗  █████╗
  ${cyan}██╔════╝ ██╔════╝██╔══██╗    ${magenta}██║   ██║██║  ╚══██╔══╝██╔══██╗██╔══██╗
  ${cyan}██║  ███╗███████╗██║  ██║    ${magenta}██║   ██║██║     ██║   ██████╔╝███████║
  ${cyan}██║   ██║╚════██║██║  ██║    ${magenta}██║   ██║██║     ██║   ██╔══██╗██╔══██║
  ${cyan}╚██████╔╝███████║██████╔╝    ${magenta}╚██████╔╝███████╗██║   ██║  ██║██║  ██║
   ${cyan}╚═════╝ ╚══════╝╚═════╝     ${magenta} ╚═════╝ ╚══════╝╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝${reset}

  GSD Ultra ${dim}v${pkg.version}${reset}
  Get Shit Done with superpowers: worktree isolation, persistent memory,
  security boundaries. Built on GSD's context engineering foundation.
`;

// Parse --config-dir argument
function parseConfigDirArg() {
  const configDirIndex = args.findIndex(arg => arg === '--config-dir' || arg === '-c');
  if (configDirIndex !== -1) {
    const nextArg = args[configDirIndex + 1];
    if (!nextArg || nextArg.startsWith('-')) {
      console.error(`  ${yellow}--config-dir requires a path argument${reset}`);
      process.exit(1);
    }
    return nextArg;
  }
  const configDirArg = args.find(arg => arg.startsWith('--config-dir=') || arg.startsWith('-c='));
  if (configDirArg) {
    const value = configDirArg.split('=')[1];
    if (!value) {
      console.error(`  ${yellow}--config-dir requires a non-empty path${reset}`);
      process.exit(1);
    }
    return value;
  }
  return null;
}
const explicitConfigDir = parseConfigDirArg();

console.log(banner);

// Show help if requested
if (hasHelp) {
  console.log(`  ${yellow}Usage:${reset} npx gsd-ultra [options]

  ${yellow}Options:${reset}
    ${cyan}-g, --global${reset}              Install globally (to ~/.claude/)
    ${cyan}-l, --local${reset}               Install locally (to ./.claude/)
    ${cyan}-u, --uninstall${reset}           Uninstall GSD Ultra
    ${cyan}-c, --config-dir <path>${reset}   Specify custom config directory
    ${cyan}--copilot${reset}                 Also install GitHub Copilot configs
    ${cyan}-h, --help${reset}                Show this help message
    ${cyan}--force-statusline${reset}        Replace existing statusline config

  ${yellow}Examples:${reset}
    ${dim}# Interactive install${reset}
    npx gsd-ultra

    ${dim}# Install globally${reset}
    npx gsd-ultra --global

    ${dim}# Install to current project only${reset}
    npx gsd-ultra --local

    ${dim}# Install with GitHub Copilot support${reset}
    npx gsd-ultra --local --copilot

    ${dim}# Install to custom config directory${reset}
    npx gsd-ultra --global --config-dir ~/.claude-work

    ${dim}# Uninstall${reset}
    npx gsd-ultra --global --uninstall

  ${yellow}What's Included:${reset}
    ${green}GSD Core${reset} - 25+ commands for spec-driven development
    ${magenta}Ultra Extensions:${reset}
      ${cyan}/gsd:worktree${reset}  - Git worktree isolation per feature
      ${cyan}/gsd:memory${reset}    - Persistent knowledge graph
      ${cyan}/gsd:security${reset}  - Command allowlists & boundaries
      ${cyan}/gsd:news${reset}      - AI/Claude news aggregation
      ${cyan}/gsd:copilot${reset}   - GitHub Copilot config generation
`);
  process.exit(0);
}

/**
 * Expand ~ to home directory
 */
function expandTilde(filePath) {
  if (filePath && filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

/**
 * Get the global config directory
 */
function getGlobalDir(explicitDir = null) {
  if (explicitDir) {
    return expandTilde(explicitDir);
  }
  if (process.env.CLAUDE_CONFIG_DIR) {
    return expandTilde(process.env.CLAUDE_CONFIG_DIR);
  }
  return path.join(os.homedir(), '.claude');
}

/**
 * Build a hook command path
 */
function buildHookCommand(claudeDir, hookName) {
  const hooksPath = claudeDir.replace(/\\/g, '/') + '/hooks/' + hookName;
  return `node "${hooksPath}"`;
}

/**
 * Read and parse settings.json
 */
function readSettings(settingsPath) {
  if (fs.existsSync(settingsPath)) {
    try {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch (e) {
      return {};
    }
  }
  return {};
}

/**
 * Write settings.json
 */
function writeSettings(settingsPath, settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
}

/**
 * Recursively copy directory with path replacement in .md files
 */
function copyWithPathReplacement(srcDir, destDir, pathPrefix) {
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true });
  }
  fs.mkdirSync(destDir, { recursive: true });

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyWithPathReplacement(srcPath, destPath, pathPrefix);
    } else if (entry.name.endsWith('.md')) {
      let content = fs.readFileSync(srcPath, 'utf8');
      content = content.replace(/~\/\.claude\//g, pathPrefix);
      fs.writeFileSync(destPath, content);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Clean up orphaned files from previous versions
 */
function cleanupOrphanedFiles(claudeDir) {
  const orphanedDirs = [
    'commands/ralph',      // Old RALPH commands
    'skills/ralph',        // Old RALPH skills
    'skills/ralph-run',
    'skills/ralph-plan',
    'skills/ralph-qa',
    'skills/ralph-memory',
    'skills/ralph-merge',
    'skills/ralph-review',
    'skills/ralph-discard',
    'skills/ralph-pause',
    'skills/ralph-resume',
    'skills/ralph-rollback',
    'skills/setup-project',
    'skills/prd',
  ];

  for (const relPath of orphanedDirs) {
    const fullPath = path.join(claudeDir, relPath);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true });
      console.log(`  ${green}✓${reset} Removed orphaned ${relPath}`);
    }
  }
}

/**
 * Verify installation
 */
function verifyInstalled(dirPath, description) {
  if (!fs.existsSync(dirPath)) {
    console.error(`  ${yellow}✗${reset} Failed to install ${description}: directory not created`);
    return false;
  }
  try {
    const entries = fs.readdirSync(dirPath);
    if (entries.length === 0) {
      console.error(`  ${yellow}✗${reset} Failed to install ${description}: directory is empty`);
      return false;
    }
  } catch (e) {
    console.error(`  ${yellow}✗${reset} Failed to install ${description}: ${e.message}`);
    return false;
  }
  return true;
}

/**
 * Uninstall GSD Ultra
 */
function uninstall(isGlobal) {
  const targetDir = isGlobal
    ? getGlobalDir(explicitConfigDir)
    : path.join(process.cwd(), '.claude');

  const locationLabel = isGlobal
    ? targetDir.replace(os.homedir(), '~')
    : targetDir.replace(process.cwd(), '.');

  console.log(`  Uninstalling GSD Ultra from ${cyan}${locationLabel}${reset}\n`);

  if (!fs.existsSync(targetDir)) {
    console.log(`  ${yellow}⚠${reset} Directory does not exist: ${locationLabel}`);
    console.log(`  Nothing to uninstall.\n`);
    return;
  }

  let removedCount = 0;

  // Remove GSD commands
  const gsdCommandsDir = path.join(targetDir, 'commands', 'gsd');
  if (fs.existsSync(gsdCommandsDir)) {
    fs.rmSync(gsdCommandsDir, { recursive: true });
    removedCount++;
    console.log(`  ${green}✓${reset} Removed commands/gsd/`);
  }

  // Remove get-shit-done directory
  const gsdDir = path.join(targetDir, 'get-shit-done');
  if (fs.existsSync(gsdDir)) {
    fs.rmSync(gsdDir, { recursive: true });
    removedCount++;
    console.log(`  ${green}✓${reset} Removed get-shit-done/`);
  }

  // Remove ultra directory
  const ultraDir = path.join(targetDir, 'ultra');
  if (fs.existsSync(ultraDir)) {
    fs.rmSync(ultraDir, { recursive: true });
    removedCount++;
    console.log(`  ${green}✓${reset} Removed ultra/`);
  }

  // Remove GSD agents
  const agentsDir = path.join(targetDir, 'agents');
  if (fs.existsSync(agentsDir)) {
    const files = fs.readdirSync(agentsDir);
    let agentCount = 0;
    for (const file of files) {
      if (file.startsWith('gsd-') && file.endsWith('.md')) {
        fs.unlinkSync(path.join(agentsDir, file));
        agentCount++;
      }
    }
    if (agentCount > 0) {
      removedCount++;
      console.log(`  ${green}✓${reset} Removed ${agentCount} GSD agents`);
    }
  }

  // Remove GSD hooks
  const hooksDir = path.join(targetDir, 'hooks');
  if (fs.existsSync(hooksDir)) {
    const gsdHooks = ['gsd-statusline.js', 'gsd-check-update.js'];
    let hookCount = 0;
    for (const hook of gsdHooks) {
      const hookPath = path.join(hooksDir, hook);
      if (fs.existsSync(hookPath)) {
        fs.unlinkSync(hookPath);
        hookCount++;
      }
    }
    if (hookCount > 0) {
      removedCount++;
      console.log(`  ${green}✓${reset} Removed ${hookCount} GSD hooks`);
    }
  }

  // Clean up settings.json
  const settingsPath = path.join(targetDir, 'settings.json');
  if (fs.existsSync(settingsPath)) {
    let settings = readSettings(settingsPath);
    let settingsModified = false;

    if (settings.statusLine && settings.statusLine.command &&
        settings.statusLine.command.includes('gsd-statusline')) {
      delete settings.statusLine;
      settingsModified = true;
      console.log(`  ${green}✓${reset} Removed statusline from settings`);
    }

    if (settings.hooks && settings.hooks.SessionStart) {
      const before = settings.hooks.SessionStart.length;
      settings.hooks.SessionStart = settings.hooks.SessionStart.filter(entry => {
        if (entry.hooks && Array.isArray(entry.hooks)) {
          const hasGsdHook = entry.hooks.some(h =>
            h.command && h.command.includes('gsd-check-update')
          );
          return !hasGsdHook;
        }
        return true;
      });
      if (settings.hooks.SessionStart.length < before) {
        settingsModified = true;
        console.log(`  ${green}✓${reset} Removed hooks from settings`);
      }
      if (settings.hooks.SessionStart.length === 0) {
        delete settings.hooks.SessionStart;
      }
      if (Object.keys(settings.hooks).length === 0) {
        delete settings.hooks;
      }
    }

    if (settingsModified) {
      writeSettings(settingsPath, settings);
      removedCount++;
    }
  }

  if (removedCount === 0) {
    console.log(`  ${yellow}⚠${reset} No GSD Ultra files found to remove.`);
  }

  console.log(`
  ${green}Done!${reset} GSD Ultra has been uninstalled.
  Your other files and settings have been preserved.
`);
}

/**
 * Main install function
 */
function install(isGlobal) {
  const src = path.join(__dirname, '..');
  const targetDir = isGlobal
    ? getGlobalDir(explicitConfigDir)
    : path.join(process.cwd(), '.claude');

  const locationLabel = isGlobal
    ? targetDir.replace(os.homedir(), '~')
    : targetDir.replace(process.cwd(), '.');

  const pathPrefix = isGlobal
    ? `${targetDir}/`
    : './.claude/';

  console.log(`  Installing GSD Ultra to ${cyan}${locationLabel}${reset}\n`);

  const failures = [];

  // Clean up orphaned files
  cleanupOrphanedFiles(targetDir);

  // Create target directories
  fs.mkdirSync(path.join(targetDir, 'commands'), { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'agents'), { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'hooks'), { recursive: true });

  // Copy GSD commands
  const gsdSrc = path.join(src, 'commands', 'gsd');
  const gsdDest = path.join(targetDir, 'commands', 'gsd');
  copyWithPathReplacement(gsdSrc, gsdDest, pathPrefix);
  if (verifyInstalled(gsdDest, 'commands/gsd')) {
    console.log(`  ${green}✓${reset} Installed commands/gsd (25+ commands)`);
  } else {
    failures.push('commands/gsd');
  }

  // Copy get-shit-done workflows/templates/references
  const skillSrc = path.join(src, 'get-shit-done');
  const skillDest = path.join(targetDir, 'get-shit-done');
  copyWithPathReplacement(skillSrc, skillDest, pathPrefix);
  if (verifyInstalled(skillDest, 'get-shit-done')) {
    console.log(`  ${green}✓${reset} Installed get-shit-done (workflows, templates, references)`);
  } else {
    failures.push('get-shit-done');
  }

  // Copy Ultra extensions
  const ultraSrc = path.join(src, 'ultra');
  const ultraDest = path.join(targetDir, 'ultra');
  if (fs.existsSync(ultraSrc)) {
    copyWithPathReplacement(ultraSrc, ultraDest, pathPrefix);
    if (verifyInstalled(ultraDest, 'ultra')) {
      console.log(`  ${magenta}✓${reset} Installed ultra extensions (worktree, memory, security, news)`);
    } else {
      failures.push('ultra');
    }
  }

  // Copy agents
  const agentsSrc = path.join(src, 'agents');
  if (fs.existsSync(agentsSrc)) {
    const agentsDest = path.join(targetDir, 'agents');

    // Remove old GSD agents
    if (fs.existsSync(agentsDest)) {
      for (const file of fs.readdirSync(agentsDest)) {
        if (file.startsWith('gsd-') && file.endsWith('.md')) {
          fs.unlinkSync(path.join(agentsDest, file));
        }
      }
    }

    // Copy new agents
    const agentEntries = fs.readdirSync(agentsSrc, { withFileTypes: true });
    for (const entry of agentEntries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        let content = fs.readFileSync(path.join(agentsSrc, entry.name), 'utf8');
        content = content.replace(/~\/\.claude\//g, pathPrefix);
        fs.writeFileSync(path.join(agentsDest, entry.name), content);
      }
    }
    if (verifyInstalled(agentsDest, 'agents')) {
      console.log(`  ${green}✓${reset} Installed agents (11 specialized)`);
    } else {
      failures.push('agents');
    }
  }

  // Copy hooks
  const hooksSrc = path.join(src, 'hooks', 'dist');
  if (fs.existsSync(hooksSrc)) {
    const hooksDest = path.join(targetDir, 'hooks');
    const hookEntries = fs.readdirSync(hooksSrc);
    for (const entry of hookEntries) {
      const srcFile = path.join(hooksSrc, entry);
      if (fs.statSync(srcFile).isFile()) {
        fs.copyFileSync(srcFile, path.join(hooksDest, entry));
      }
    }
    console.log(`  ${green}✓${reset} Installed hooks`);
  }

  // Write VERSION file
  const versionDest = path.join(targetDir, 'get-shit-done', 'VERSION');
  fs.writeFileSync(versionDest, pkg.version);
  console.log(`  ${green}✓${reset} Wrote VERSION (${pkg.version})`);

  if (failures.length > 0) {
    console.error(`\n  ${yellow}Installation incomplete!${reset} Failed: ${failures.join(', ')}`);
    process.exit(1);
  }

  // Configure settings.json
  const settingsPath = path.join(targetDir, 'settings.json');
  const settings = readSettings(settingsPath);

  const statuslineCommand = isGlobal
    ? buildHookCommand(targetDir, 'gsd-statusline.js')
    : 'node .claude/hooks/gsd-statusline.js';
  const updateCheckCommand = isGlobal
    ? buildHookCommand(targetDir, 'gsd-check-update.js')
    : 'node .claude/hooks/gsd-check-update.js';

  // Configure SessionStart hook
  if (!settings.hooks) {
    settings.hooks = {};
  }
  if (!settings.hooks.SessionStart) {
    settings.hooks.SessionStart = [];
  }

  const hasGsdUpdateHook = settings.hooks.SessionStart.some(entry =>
    entry.hooks && entry.hooks.some(h => h.command && h.command.includes('gsd-check-update'))
  );

  if (!hasGsdUpdateHook) {
    settings.hooks.SessionStart.push({
      hooks: [{ type: 'command', command: updateCheckCommand }]
    });
    console.log(`  ${green}✓${reset} Configured update check hook`);
  }

  return { settingsPath, settings, statuslineCommand };
}

/**
 * Install GitHub Copilot configuration files
 */
function installCopilot() {
  const src = path.join(__dirname, '..', 'copilot-templates');
  const targetDir = path.join(process.cwd(), '.github');

  if (!fs.existsSync(src)) {
    console.log(`  ${yellow}⚠${reset} Copilot templates not found`);
    return;
  }

  console.log(`  Installing GitHub Copilot configs to ${cyan}.github/${reset}\n`);

  // Create target directories
  fs.mkdirSync(path.join(targetDir, 'instructions'), { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'prompts'), { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'agents'), { recursive: true });

  let installedCount = 0;

  // Copy main instructions template (if it exists)
  const mainInstructionsSrc = path.join(src, 'copilot-instructions.md.template');
  if (fs.existsSync(mainInstructionsSrc)) {
    // For now, copy a basic version - users can run /gsd:copilot to generate from project
    const basicInstructions = `# Project Guidelines

## Overview
This project uses GSD Ultra for development.

## Commands
Run \`/gsd:help\` in Claude Code to see available commands.
Run \`/gsd:copilot generate\` to regenerate this file from project analysis.

## Code Conventions
- Follow consistent code style
- Write tests for new features
- Document public APIs

## Build Commands
- See package.json scripts
`;
    fs.writeFileSync(path.join(targetDir, 'copilot-instructions.md'), basicInstructions);
    console.log(`  ${green}✓${reset} Created copilot-instructions.md`);
    installedCount++;
  }

  // Copy path-specific instructions
  const instructionsSrc = path.join(src, 'instructions');
  if (fs.existsSync(instructionsSrc)) {
    const instructionsDest = path.join(targetDir, 'instructions');
    const files = fs.readdirSync(instructionsSrc);
    for (const file of files) {
      if (file.endsWith('.md')) {
        fs.copyFileSync(
          path.join(instructionsSrc, file),
          path.join(instructionsDest, file.replace('.md', '.instructions.md'))
        );
        installedCount++;
      }
    }
    console.log(`  ${green}✓${reset} Created ${files.length} path-specific instruction files`);
  }

  // Copy prompts
  const promptsSrc = path.join(src, 'prompts');
  if (fs.existsSync(promptsSrc)) {
    const promptsDest = path.join(targetDir, 'prompts');
    const files = fs.readdirSync(promptsSrc);
    for (const file of files) {
      if (file.endsWith('.md')) {
        fs.copyFileSync(
          path.join(promptsSrc, file),
          path.join(promptsDest, file.replace('.md', '.prompt.md'))
        );
        installedCount++;
      }
    }
    console.log(`  ${green}✓${reset} Created ${files.length} prompt templates`);
  }

  // Copy agents
  const agentsSrc = path.join(src, 'agents');
  if (fs.existsSync(agentsSrc)) {
    const agentsDest = path.join(targetDir, 'agents');
    const files = fs.readdirSync(agentsSrc);
    for (const file of files) {
      if (file.endsWith('.md')) {
        fs.copyFileSync(
          path.join(agentsSrc, file),
          path.join(agentsDest, file.replace('.md', '.agent.md'))
        );
        installedCount++;
      }
    }
    console.log(`  ${green}✓${reset} Created ${files.length} agent definitions`);
  }

  console.log(`
  ${green}GitHub Copilot configuration installed!${reset}

  ${yellow}Files created:${reset}
    ${cyan}.github/copilot-instructions.md${reset}     - Main instructions
    ${cyan}.github/instructions/*.instructions.md${reset} - Path-specific
    ${cyan}.github/prompts/*.prompt.md${reset}         - Reusable prompts
    ${cyan}.github/agents/*.agent.md${reset}           - Custom agents

  ${yellow}Next steps:${reset}
    1. Run ${cyan}/gsd:copilot generate${reset} to regenerate from project analysis
    2. Customize instructions as needed
    3. Commit to version control

  ${dim}Learn more: https://docs.github.com/copilot/customizing-copilot${reset}
`);
}

/**
 * Handle statusline configuration
 */
function handleStatusline(settings, isInteractive, callback) {
  const hasExisting = settings.statusLine != null;

  if (!hasExisting) {
    callback(true);
    return;
  }

  if (forceStatusline) {
    callback(true);
    return;
  }

  if (!isInteractive) {
    console.log(`  ${yellow}⚠${reset} Skipping statusline (already configured)`);
    console.log(`    Use ${cyan}--force-statusline${reset} to replace\n`);
    callback(false);
    return;
  }

  const existingCmd = settings.statusLine.command || '(custom)';

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(`
  ${yellow}⚠${reset} Existing statusline detected

  Your current statusline:
    ${dim}command: ${existingCmd}${reset}

  GSD Ultra includes a statusline showing:
    • Model name
    • Current task
    • Context window usage (color-coded)

  ${cyan}1${reset}) Keep existing
  ${cyan}2${reset}) Replace with GSD Ultra statusline
`);

  rl.question(`  Choice ${dim}[1]${reset}: `, (answer) => {
    rl.close();
    const choice = answer.trim() || '1';
    callback(choice === '2');
  });
}

/**
 * Finish installation
 */
function finishInstall(settingsPath, settings, statuslineCommand, shouldInstallStatusline, installCopilotFlag) {
  if (shouldInstallStatusline) {
    settings.statusLine = {
      type: 'command',
      command: statuslineCommand
    };
    console.log(`  ${green}✓${reset} Configured statusline`);
  }

  writeSettings(settingsPath, settings);

  // Install Copilot configs if requested
  if (installCopilotFlag) {
    console.log('');
    installCopilot();
  }

  console.log(`
  ${green}Done!${reset} Launch Claude Code and run ${cyan}/gsd:help${reset}.

  ${yellow}GSD Core Commands:${reset}
    ${cyan}/gsd:new-project${reset}     - Initialize project with deep questioning
    ${cyan}/gsd:discuss-phase${reset}   - Capture implementation decisions
    ${cyan}/gsd:plan-phase${reset}      - Research + plan + verify
    ${cyan}/gsd:execute-phase${reset}   - Wave-based parallel execution
    ${cyan}/gsd:verify-work${reset}     - User acceptance testing
    ${cyan}/gsd:quick${reset}           - Ad-hoc tasks with GSD guarantees

  ${magenta}Ultra Extensions:${reset}
    ${cyan}/gsd:worktree${reset}        - Git worktree isolation
    ${cyan}/gsd:memory${reset}          - Persistent knowledge graph
    ${cyan}/gsd:security${reset}        - Command allowlists & boundaries
    ${cyan}/gsd:news${reset}            - AI/Claude news aggregation
    ${cyan}/gsd:copilot${reset}         - GitHub Copilot config generation

  ${dim}Tip: Run Claude Code with --dangerously-skip-permissions for best experience${reset}
`);
}

/**
 * Prompt for install location
 */
function promptLocation() {
  if (!process.stdin.isTTY) {
    console.log(`  ${yellow}Non-interactive terminal, defaulting to global install${reset}\n`);
    const result = install(true);
    handleStatusline(result.settings, false, (shouldInstall) => {
      finishInstall(result.settingsPath, result.settings, result.statuslineCommand, shouldInstall, hasCopilot);
    });
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let answered = false;

  rl.on('close', () => {
    if (!answered) {
      answered = true;
      console.log(`\n  ${yellow}Installation cancelled${reset}\n`);
      process.exit(0);
    }
  });

  const globalPath = getGlobalDir(explicitConfigDir).replace(os.homedir(), '~');

  console.log(`  ${yellow}Where would you like to install?${reset}

  ${cyan}1${reset}) Global ${dim}(${globalPath})${reset} - available in all projects
  ${cyan}2${reset}) Local  ${dim}(./.claude)${reset} - this project only
`);

  rl.question(`  Choice ${dim}[1]${reset}: `, (answer) => {
    answered = true;
    rl.close();
    const choice = answer.trim() || '1';
    const isGlobal = choice !== '2';

    const result = install(isGlobal);
    handleStatusline(result.settings, true, (shouldInstall) => {
      finishInstall(result.settingsPath, result.settings, result.statuslineCommand, shouldInstall, hasCopilot);
    });
  });
}

// Main
if (hasGlobal && hasLocal) {
  console.error(`  ${yellow}Cannot specify both --global and --local${reset}`);
  process.exit(1);
} else if (explicitConfigDir && hasLocal) {
  console.error(`  ${yellow}Cannot use --config-dir with --local${reset}`);
  process.exit(1);
} else if (hasUninstall) {
  if (!hasGlobal && !hasLocal) {
    console.error(`  ${yellow}--uninstall requires --global or --local${reset}`);
    console.error(`  Example: npx gsd-ultra --global --uninstall`);
    process.exit(1);
  }
  uninstall(hasGlobal);
} else if (hasGlobal || hasLocal) {
  const result = install(hasGlobal);
  handleStatusline(result.settings, false, (shouldInstall) => {
    finishInstall(result.settingsPath, result.settings, result.statuslineCommand, shouldInstall, hasCopilot);
  });
} else {
  promptLocation();
}
