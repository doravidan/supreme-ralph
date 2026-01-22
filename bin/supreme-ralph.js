#!/usr/bin/env node

/**
 * Supreme RALPH CLI
 *
 * Entry point for global installation and management
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scriptsDir = path.join(__dirname, '..', 'scripts');

const command = process.argv[2];
const args = process.argv.slice(3);

function showHelp() {
  console.log(`
╔════════════════════════════════════════╗
║     Supreme RALPH                      ║
║     Autonomous Development Agent       ║
╚════════════════════════════════════════╝

Usage: supreme-ralph <command>

Commands:
  install    Install RALPH globally to ~/.claude/
  install -y Install without prompts (overwrite existing)
  help       Show this help message

After installation, use these commands in Claude Code:
  /setup-project  - Interactive project setup
  /ralph          - RALPH status and management
  /ralph-run      - Start autonomous development
  /prd            - Generate PRD from description

Examples:
  npx supreme-ralph install       # Interactive installation
  npx supreme-ralph install -y    # Non-interactive installation

Documentation: https://github.com/doravidan/supreme-ralph
`);
}

switch (command) {
  case 'install':
    const installArgs = args.includes('-y') || args.includes('--yes')
      ? ['--yes']
      : [];

    spawn('node', [path.join(scriptsDir, 'install-global.js'), ...installArgs], {
      stdio: 'inherit'
    });
    break;

  case 'help':
  case '--help':
  case '-h':
  case undefined:
    showHelp();
    break;

  default:
    console.error(`Unknown command: ${command}`);
    console.log('Run "supreme-ralph help" for usage information.');
    process.exit(1);
}
