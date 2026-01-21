#!/usr/bin/env node

/**
 * Claude Code Project Initializer CLI
 * Global command-line interface
 */

import { Command } from 'commander';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scriptsDir = path.join(__dirname, '..', 'scripts');

const program = new Command();

program
  .name('claude-init')
  .description('Claude Code Project Initializer - Set up projects with best practices')
  .version('1.0.0');

program
  .command('setup')
  .description('Initialize a new or existing project with Claude Code configuration')
  .option('-t, --target <path>', 'Target project directory', process.cwd())
  .option('-m, --merge', 'Merge with existing configuration')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .option('-f, --feature <description>', 'Create initial PRD for RALPH to build this feature')
  .option('--no-ralph', 'Skip RALPH autonomous agent setup')
  .action((options) => {
    const args = [];
    if (options.target) args.push('--target', options.target);
    if (options.merge) args.push('--merge');
    if (options.yes) args.push('--yes');
    if (options.feature) args.push('--feature', options.feature);
    if (options.ralph === false) args.push('--no-ralph');

    spawn('node', [path.join(scriptsDir, 'setup-project.js'), ...args], {
      stdio: 'inherit'
    });
  });

program
  .command('sync')
  .description('Sync knowledge base from Anthropic documentation')
  .action(() => {
    spawn('node', [path.join(scriptsDir, 'sync-knowledge.js')], {
      stdio: 'inherit'
    });
  });

program
  .command('scheduler')
  .description('Set up daily automatic knowledge base sync')
  .action(() => {
    spawn('node', [path.join(scriptsDir, 'setup-scheduler.js')], {
      stdio: 'inherit'
    });
  });

program
  .command('check')
  .description('Check for knowledge base updates')
  .action(() => {
    spawn('node', [path.join(scriptsDir, 'check-updates.js')], {
      stdio: 'inherit'
    });
  });

program
  .command('changes')
  .description('View changelog since last project setup')
  .action(() => {
    spawn('node', [path.join(scriptsDir, 'view-changes.js')], {
      stdio: 'inherit'
    });
  });

program
  .command('templates')
  .description('List available templates')
  .action(() => {
    spawn('node', [path.join(scriptsDir, 'list-templates.js')], {
      stdio: 'inherit'
    });
  });

program
  .command('validate')
  .description('Validate template files')
  .action(() => {
    spawn('node', [path.join(scriptsDir, 'validate-templates.js')], {
      stdio: 'inherit'
    });
  });

program
  .command('email')
  .description('Send email summary or test email configuration')
  .option('--test', 'Send a test email to verify configuration')
  .option('--dry-run', 'Preview email content without sending')
  .action((options) => {
    const args = [];
    if (options.test) args.push('--test');
    if (options.dryRun) args.push('--dry-run');

    spawn('node', [path.join(scriptsDir, 'send-email-summary.js'), ...args], {
      stdio: 'inherit'
    });
  });

program
  .command('projects')
  .description('List all tracked projects')
  .option('--status <status>', 'Filter by status (active, archived, orphaned)')
  .option('--language <language>', 'Filter by language')
  .option('--json', 'Output as JSON')
  .option('--validate', 'Validate all project paths')
  .action((options) => {
    const args = [];
    if (options.status) args.push('--status', options.status);
    if (options.language) args.push('--language', options.language);
    if (options.json) args.push('--json');
    if (options.validate) args.push('--validate');

    spawn('node', [path.join(scriptsDir, 'list-projects.js'), ...args], {
      stdio: 'inherit'
    });
  });

program
  .command('untrack <path>')
  .description('Remove a project from tracking')
  .option('--archive', 'Archive instead of removing')
  .option('--delete-local', 'Also delete .claude/ directory from project')
  .option('-y, --yes', 'Skip confirmation')
  .action((projectPath, options) => {
    const args = [projectPath];
    if (options.archive) args.push('--archive');
    if (options.deleteLocal) args.push('--delete-local');
    if (options.yes) args.push('--yes');

    spawn('node', [path.join(scriptsDir, 'remove-project.js'), ...args], {
      stdio: 'inherit'
    });
  });

program
  .command('status [path]')
  .description('Show project status (defaults to current directory)')
  .action((projectPath) => {
    const args = projectPath ? [projectPath] : [];

    spawn('node', [path.join(scriptsDir, 'project-status.js'), ...args], {
      stdio: 'inherit'
    });
  });

program
  .command('news')
  .description('Fetch and preview Claude/Anthropic news')
  .option('-r, --refresh', 'Force refresh from all sources (RSS, HN, Reddit)')
  .option('-j, --json', 'Output as JSON')
  .option('-s, --stats', 'Show news statistics')
  .option('-l, --limit <number>', 'Limit number of items', '10')
  .option('-c, --category <category>', 'Filter by category (product, viral, business, community, etc.)')
  .option('-t, --text', 'Output as plain text (newsletter format)')
  .action((options) => {
    const args = [];
    if (options.refresh) args.push('--refresh');
    if (options.json) args.push('--json');
    if (options.stats) args.push('--stats');
    if (options.limit) args.push('--limit', options.limit);
    if (options.category) args.push('--category', options.category);
    if (options.text) args.push('--text');

    spawn('node', [path.join(scriptsDir, 'fetch-news.js'), ...args], {
      stdio: 'inherit'
    });
  });

program
  .command('ralph [max-iterations]')
  .description('Run RALPH autonomous development loop')
  .option('-t, --target <path>', 'Target project directory', process.cwd())
  .option('--init', 'Initialize RALPH in a project')
  .option('--status', 'Show current PRD status')
  .option('--reset', 'Reset progress.txt for fresh start')
  .action((maxIterations, options) => {
    const args = [];
    if (maxIterations) args.push(maxIterations);
    if (options.target) args.push('--target', options.target);
    if (options.init) args.push('--init');
    if (options.status) args.push('--status');
    if (options.reset) args.push('--reset');

    spawn('node', [path.join(scriptsDir, 'run-ralph.js'), ...args], {
      stdio: 'inherit'
    });
  });

program.parse();
