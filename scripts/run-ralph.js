#!/usr/bin/env node

/**
 * RALPH Runner Script
 *
 * Runs the RALPH autonomous development loop for the current project.
 * Wrapper around scripts/ralph/ralph.sh with additional validation.
 */

import fs from 'fs-extra';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { analyzeProject } from './utils/project-analyzer.js';
import { writeProjectSpec } from './utils/spec-generator.js';
import { CONFIG } from './utils/config-manager.js';
import { render as renderTemplate } from './utils/template-engine.js';
import { validatePrd, getPrdStats, formatValidationResult } from './utils/prd-validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

const defaultIterations = String(CONFIG.ralph.defaultMaxIterations);

program
  .name('ralph')
  .description('Run RALPH autonomous development loop')
  .argument('[max-iterations]', `Maximum iterations (default: ${defaultIterations})`, defaultIterations)
  .option('-t, --target <path>', 'Target project directory', process.cwd())
  .option('--init', 'Initialize RALPH for a project without it')
  .option('--status', 'Show current PRD status')
  .option('--validate', 'Validate prd.json schema')
  .option('--reset', 'Reset progress.txt for fresh start')
  .option('--analyze', 'Re-analyze project and regenerate PROJECT_SPEC.md')
  .parse(process.argv);

const options = program.opts();
const maxIterations = program.args[0] || defaultIterations;

/**
 * Check if RALPH is installed in the project
 */
async function checkRalphInstalled(projectPath) {
  const ralphScript = path.join(projectPath, 'scripts', 'ralph', 'ralph.sh');
  return fs.pathExists(ralphScript);
}

/**
 * Check if prd.json exists
 */
async function checkPrdExists(projectPath) {
  const prdPath = path.join(projectPath, 'prd.json');
  return fs.pathExists(prdPath);
}

/**
 * Show PRD status
 */
async function showStatus(projectPath) {
  const prdPath = path.join(projectPath, 'prd.json');

  if (!await fs.pathExists(prdPath)) {
    console.log(chalk.yellow('\nNo prd.json found in project.'));
    console.log(chalk.gray('Create one using:\n'));
    console.log(chalk.cyan('  1. /prd Create a PRD for [your feature]'));
    console.log(chalk.cyan('  2. /ralph-convert tasks/prd-[name].md'));
    return;
  }

  let prd;
  try {
    prd = await fs.readJson(prdPath);
  } catch (error) {
    console.log(chalk.red('\n✗ Failed to parse prd.json:'), error.message);
    return;
  }

  // Use getPrdStats for statistics
  const stats = getPrdStats(prd);

  console.log('\n' + chalk.bold.cyan('═'.repeat(50)));
  console.log(chalk.bold.cyan('  RALPH Status'));
  console.log(chalk.bold.cyan('═'.repeat(50)));
  console.log();
  console.log(`  ${chalk.bold('Project:')} ${prd.project}`);
  console.log(`  ${chalk.bold('Branch:')} ${prd.branchName}`);
  console.log(`  ${chalk.bold('Stories:')} ${chalk.green(stats.complete)}/${stats.total} complete, ${chalk.yellow(stats.remaining)} remaining`);
  if (stats.percentComplete > 0) {
    console.log(`  ${chalk.bold('Progress:')} ${stats.percentComplete}%`);
  }
  console.log();

  if (prd.userStories && prd.userStories.length > 0) {
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.bold('  User Stories:'));
    console.log(chalk.gray('─'.repeat(50)));

    for (const story of prd.userStories) {
      const status = story.passes
        ? chalk.green('✓')
        : chalk.yellow('○');
      const priority = chalk.gray(`[P${story.priority}]`);
      console.log(`  ${status} ${story.id}: ${story.title} ${priority}`);
    }
  }

  console.log();

  // Show progress.txt summary if exists
  const progressPath = path.join(projectPath, 'progress.txt');
  if (await fs.pathExists(progressPath)) {
    try {
      const progress = await fs.readFile(progressPath, 'utf-8');
      const iterations = (progress.match(/^## Iteration \d+/gm) || []).length;
      console.log(chalk.gray(`  Iterations logged: ${iterations}`));
    } catch (error) {
      // Silently ignore read errors
    }
  }

  console.log(chalk.cyan('═'.repeat(50)) + '\n');
}

/**
 * Validate prd.json
 */
async function validatePrdFile(projectPath) {
  const prdPath = path.join(projectPath, 'prd.json');

  console.log('\n' + chalk.bold.cyan('═'.repeat(50)));
  console.log(chalk.bold.cyan('  PRD Validation'));
  console.log(chalk.bold.cyan('═'.repeat(50)));
  console.log();

  if (!await fs.pathExists(prdPath)) {
    console.log(chalk.yellow('  No prd.json found in project.'));
    console.log();
    return;
  }

  let prd;
  try {
    prd = await fs.readJson(prdPath);
  } catch (error) {
    console.log(chalk.red('  ✗ Failed to parse prd.json:'), error.message);
    console.log();
    process.exit(1);
  }

  const result = validatePrd(prd);

  if (result.valid) {
    console.log(chalk.green('  ✓ PRD validation passed'));
  } else {
    console.log(chalk.red('  ✗ PRD validation failed'));
  }

  if (result.errors.length > 0) {
    console.log();
    console.log(chalk.red('  Errors:'));
    result.errors.forEach(e => console.log(chalk.red(`    - ${e}`)));
  }

  if (result.warnings.length > 0) {
    console.log();
    console.log(chalk.yellow('  Warnings:'));
    result.warnings.forEach(w => console.log(chalk.yellow(`    ⚠ ${w}`)));
  }

  // Show stats
  const stats = getPrdStats(prd);
  console.log();
  console.log(chalk.gray('  Statistics:'));
  console.log(chalk.gray(`    - ${stats.total} user stories`));
  console.log(chalk.gray(`    - ${stats.complete} complete, ${stats.remaining} remaining`));

  console.log();
  console.log(chalk.cyan('═'.repeat(50)) + '\n');

  if (!result.valid) {
    process.exit(1);
  }
}

/**
 * Reset progress.txt
 */
async function resetProgress(projectPath) {
  const progressPath = path.join(projectPath, 'progress.txt');
  const prdPath = path.join(projectPath, 'prd.json');

  let branchName = 'main';
  if (await fs.pathExists(prdPath)) {
    const prd = await fs.readJson(prdPath);
    branchName = prd.branchName || 'main';
  }

  const newProgress = `# Progress Log - ${branchName}

Started: ${new Date().toISOString().split('T')[0]}

## Codebase Patterns
(Patterns will be added as they are discovered during iterations)

---

`;

  // Archive old progress if exists
  if (await fs.pathExists(progressPath)) {
    const archiveDir = path.join(projectPath, 'archive', new Date().toISOString().split('T')[0]);
    await fs.ensureDir(archiveDir);
    await fs.copy(progressPath, path.join(archiveDir, 'progress.txt'));
    console.log(chalk.gray(`  Archived old progress.txt to ${archiveDir}`));
  }

  await fs.writeFile(progressPath, newProgress, 'utf-8');
  console.log(chalk.green('  ✓ Reset progress.txt'));
}

/**
 * Initialize RALPH in a project
 */
async function initRalph(projectPath) {
  const spinner = ora('Initializing RALPH...').start();

  try {
    const ralphDir = path.join(projectPath, 'scripts', 'ralph');
    await fs.ensureDir(ralphDir);
    await fs.ensureDir(path.join(projectPath, 'tasks'));

    // Copy templates
    const templatesDir = path.join(__dirname, '..', 'templates', 'ralph');

    // Copy ralph.sh
    await fs.copy(
      path.join(templatesDir, 'ralph.sh.template'),
      path.join(ralphDir, 'ralph.sh')
    );
    await fs.chmod(path.join(ralphDir, 'ralph.sh'), '755');

    // Copy CLAUDE.md template
    const claudeMdTemplate = await fs.readFile(
      path.join(templatesDir, 'CLAUDE.md.template'),
      'utf-8'
    );

    // Apply template variables using template engine
    const ralphClaudeMd = renderTemplate(claudeMdTemplate, {
      typecheckCommand: 'npm run typecheck || npx tsc --noEmit',
      lintCommand: 'npm run lint',
      testCommand: 'npm test',
      branchName: 'ralph/feature-name',
      projectContext: 'Project-specific context will be added.',
      codebasePatterns: '(Patterns will be discovered and logged in progress.txt)'
    });

    await fs.writeFile(path.join(ralphDir, 'CLAUDE.md'), ralphClaudeMd, 'utf-8');

    // Copy example
    await fs.copy(
      path.join(templatesDir, 'prd.json.example'),
      path.join(ralphDir, 'prd.json.example')
    );

    // Copy skills
    const skillsDir = path.join(projectPath, '.claude', 'skills');
    await fs.ensureDir(path.join(skillsDir, 'prd'));
    await fs.ensureDir(path.join(skillsDir, 'ralph'));

    await fs.copy(
      path.join(templatesDir, 'skills', 'prd', 'SKILL.md'),
      path.join(skillsDir, 'prd', 'SKILL.md')
    );
    await fs.copy(
      path.join(templatesDir, 'skills', 'ralph', 'SKILL.md'),
      path.join(skillsDir, 'ralph', 'SKILL.md')
    );

    spinner.succeed('RALPH initialized!');

    console.log('\n' + chalk.bold('Created:'));
    console.log(chalk.gray('  - scripts/ralph/ralph.sh'));
    console.log(chalk.gray('  - scripts/ralph/CLAUDE.md'));
    console.log(chalk.gray('  - scripts/ralph/prd.json.example'));
    console.log(chalk.gray('  - .claude/skills/prd/SKILL.md'));
    console.log(chalk.gray('  - .claude/skills/ralph/SKILL.md'));
    console.log(chalk.gray('  - tasks/'));

    console.log('\n' + chalk.bold('Next steps:'));
    console.log(chalk.cyan('  1. /prd Create a PRD for [your feature]'));
    console.log(chalk.cyan('  2. /ralph-convert tasks/prd-[name].md'));
    console.log(chalk.cyan('  3. ./scripts/ralph/ralph.sh 20'));

  } catch (error) {
    spinner.fail('Failed to initialize RALPH');
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

/**
 * Re-analyze project and regenerate PROJECT_SPEC.md
 */
async function reanalyzeProject(projectPath) {
  console.log('\n' + chalk.bold.cyan('═'.repeat(50)));
  console.log(chalk.bold.cyan('  Project Analysis'));
  console.log(chalk.bold.cyan('═'.repeat(50)));
  console.log();

  const spinner = ora('Analyzing project...').start();

  try {
    const analysis = await analyzeProject(projectPath);

    spinner.text = 'Generating PROJECT_SPEC.md...';

    const specPath = await writeProjectSpec(projectPath, analysis);

    spinner.succeed('Project analysis complete!');

    console.log();
    console.log(chalk.bold('Analysis Summary:'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`  ${chalk.bold('Language:')} ${analysis.techStack.language}`);
    if (analysis.techStack.framework !== 'none') {
      console.log(`  ${chalk.bold('Framework:')} ${analysis.techStack.framework}`);
    }
    console.log(`  ${chalk.bold('Package Manager:')} ${analysis.techStack.packageManager}`);

    if (analysis.patterns.testing.framework !== 'unknown') {
      console.log(`  ${chalk.bold('Test Framework:')} ${analysis.patterns.testing.framework}`);
    }
    if (analysis.patterns.types.language !== 'none') {
      console.log(`  ${chalk.bold('Types:')} ${analysis.patterns.types.language}${analysis.patterns.types.strict ? ' (strict)' : ''}`);
    }
    if (analysis.documentation.files.length > 0) {
      console.log(`  ${chalk.bold('Documentation:')} ${analysis.documentation.files.length} .md files found`);
    }
    if (analysis.dependencies.production.length > 0) {
      console.log(`  ${chalk.bold('Dependencies:')} ${analysis.dependencies.production.length} production, ${analysis.dependencies.development.length} dev`);
    }

    console.log(chalk.gray('─'.repeat(50)));
    console.log();
    console.log(chalk.green(`✓ Created ${specPath}`));
    console.log();

    // Also update RALPH's CLAUDE.md with new analysis
    const ralphClaudeMdPath = path.join(projectPath, 'scripts', 'ralph', 'CLAUDE.md');
    if (await fs.pathExists(ralphClaudeMdPath)) {
      console.log(chalk.gray('Note: To update scripts/ralph/CLAUDE.md with new patterns,'));
      console.log(chalk.gray('      run: claude-init setup -t . -y'));
    }

  } catch (error) {
    spinner.fail('Analysis failed');
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

/**
 * Run RALPH loop
 */
async function runRalph(projectPath, iterations) {
  const ralphScript = path.join(projectPath, 'scripts', 'ralph', 'ralph.sh');
  const prdPath = path.join(projectPath, 'prd.json');

  console.log('\n' + chalk.bold.cyan('═'.repeat(50)));
  console.log(chalk.bold.cyan('  Starting RALPH'));
  console.log(chalk.bold.cyan('═'.repeat(50)));
  console.log();
  console.log(`  ${chalk.bold('Max iterations:')} ${iterations}`);
  console.log(`  ${chalk.bold('Project:')} ${projectPath}`);
  console.log();

  // Check for prd.json
  if (!await checkPrdExists(projectPath)) {
    console.log(chalk.yellow('⚠️  No prd.json found!'));
    console.log();
    console.log(chalk.gray('Create a PRD first:'));
    console.log(chalk.cyan('  1. /prd Create a PRD for [your feature]'));
    console.log(chalk.cyan('  2. /ralph-convert tasks/prd-[name].md'));
    console.log();
    process.exit(1);
  }

  // Validate prd.json before running
  let prd;
  try {
    prd = await fs.readJson(prdPath);
  } catch (error) {
    console.log(chalk.red('✗ Failed to parse prd.json:'), error.message);
    console.log(chalk.gray('  Fix the JSON syntax and try again.'));
    process.exit(1);
  }

  const validation = validatePrd(prd);
  if (!validation.valid) {
    console.log(chalk.red('✗ prd.json validation failed:'));
    validation.errors.forEach(e => console.log(chalk.red(`  - ${e}`)));
    console.log();
    console.log(chalk.gray('Fix the errors above and try again.'));
    console.log(chalk.gray('Run `claude-init ralph --validate` for detailed validation.'));
    process.exit(1);
  }

  // Show warnings but don't block
  if (validation.warnings.length > 0) {
    console.log(chalk.yellow('⚠ Warnings:'));
    validation.warnings.slice(0, 3).forEach(w => console.log(chalk.yellow(`  - ${w}`)));
    if (validation.warnings.length > 3) {
      console.log(chalk.yellow(`  ... and ${validation.warnings.length - 3} more`));
    }
    console.log();
  }

  // Show PRD summary
  const stats = getPrdStats(prd);
  console.log(`  ${chalk.bold('PRD:')} ${prd.project}`);
  console.log(`  ${chalk.bold('Stories:')} ${stats.complete}/${stats.total} complete`);
  if (stats.nextStory) {
    console.log(`  ${chalk.bold('Next:')} ${stats.nextStory.id}: ${stats.nextStory.title}`);
  }
  console.log();

  // Run ralph.sh
  const ralph = spawn('bash', [ralphScript, iterations], {
    cwd: projectPath,
    stdio: 'inherit'
  });

  ralph.on('error', (error) => {
    console.error(chalk.red('\n❌ Failed to run RALPH:'), error.message);
    console.log(chalk.gray('\nMake sure:'));
    console.log(chalk.gray('  - bash is installed'));
    console.log(chalk.gray('  - jq is installed (brew install jq / apt install jq)'));
    console.log(chalk.gray('  - claude CLI is installed'));
    process.exit(1);
  });

  ralph.on('close', (code) => {
    if (code === 0) {
      console.log(chalk.green('\n✓ RALPH completed successfully'));
    } else {
      console.log(chalk.yellow(`\nRALPH exited with code ${code}`));
    }
  });
}

/**
 * Main function
 */
async function main() {
  const targetPath = path.resolve(options.target);

  // Handle --init
  if (options.init) {
    await initRalph(targetPath);
    return;
  }

  // Handle --status
  if (options.status) {
    await showStatus(targetPath);
    return;
  }

  // Handle --validate
  if (options.validate) {
    await validatePrdFile(targetPath);
    return;
  }

  // Handle --reset
  if (options.reset) {
    await resetProgress(targetPath);
    return;
  }

  // Handle --analyze
  if (options.analyze) {
    await reanalyzeProject(targetPath);
    return;
  }

  // Check if RALPH is installed
  if (!await checkRalphInstalled(targetPath)) {
    console.log(chalk.yellow('\n⚠️  RALPH is not installed in this project.'));
    console.log(chalk.gray('\nRun one of the following:'));
    console.log(chalk.cyan('  claude-init ralph --init    # Install RALPH'));
    console.log(chalk.cyan('  claude-init setup           # Full project setup'));
    console.log();
    process.exit(1);
  }

  // Run RALPH
  await runRalph(targetPath, maxIterations);
}

main().catch(error => {
  console.error(chalk.red('\n❌ Error:'), error.message);
  process.exit(1);
});
