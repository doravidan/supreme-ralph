#!/usr/bin/env node

/**
 * List Projects Script
 * Displays all tracked claude-init projects
 */

import { program } from 'commander';
import { ui } from './utils/design-system.js';
import {
  getProjects,
  validateAllProjects,
  getRegistryPath,
  getStatistics
} from './utils/project-registry.js';

program
  .option('--status <status>', 'Filter by status (active, archived, orphaned)')
  .option('--language <language>', 'Filter by language')
  .option('--json', 'Output as JSON')
  .option('--validate', 'Validate all project paths')
  .parse(process.argv);

const options = program.opts();

async function main() {
  ui.header('Tracked Projects', 'list');

  if (options.validate) {
    const spinner = ui.spinner('Validating project paths...').start();
    const results = await validateAllProjects();
    spinner.succeed('Validation complete');

    ui.muted(`  Valid: ${results.valid.length}`);
    ui.muted(`  Missing: ${results.missing.length}`);
    if (results.missing.length > 0) {
      ui.warningText(`  (Missing projects marked as orphaned)`);
    }
    ui.blank();
  }

  const projects = await getProjects({
    status: options.status,
    language: options.language
  });

  if (options.json) {
    console.log(JSON.stringify(projects, null, 2));
    return;
  }

  if (projects.length === 0) {
    ui.muted('No projects tracked yet.');
    ui.muted('Run "claude-init setup" in a project directory to start tracking.\n');
    return;
  }

  ui.muted(`Registry: ${getRegistryPath()}\n`);

  for (const project of projects) {
    const statusIcon = project.status === 'active' ? ui.icons.success :
                       project.status === 'archived' ? '📦' : '⚠';
    const statusColor = project.status === 'active' ? ui.colors.success :
                        project.status === 'archived' ? ui.colors.muted : ui.colors.warning;

    console.log(statusColor(`${statusIcon} ${project.name}`));
    ui.muted(`   Path: ${project.path}`);
    ui.muted(`   Language: ${project.language} | Framework: ${project.framework}`);

    const setupDate = new Date(project.lastSetup).toLocaleDateString();
    ui.muted(`   Last setup: ${setupDate} (${project.setupCount} total)`);

    if (project.status !== 'active') {
      ui.warningText(`   Status: ${project.status}`);
    }
    ui.blank();
  }

  // Show statistics
  const stats = await getStatistics();
  ui.divider();
  ui.muted(`Total: ${stats.totalProjects} projects (${stats.activeProjects} active)`);

  if (Object.keys(stats.languageDistribution).length > 0) {
    const langStr = Object.entries(stats.languageDistribution)
      .map(([lang, count]) => `${lang}: ${count}`)
      .join(' | ');
    ui.muted(`Languages: ${langStr}`);
  }
  ui.blank();
}

main().catch(error => {
  console.error(ui.colors.error(`\n${ui.icons.error} Error:`), error.message);
  process.exit(1);
});
