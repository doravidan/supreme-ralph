#!/usr/bin/env node

/**
 * Remove Project Script
 * Removes a project from global tracking
 */

import path from 'path';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { program } from 'commander';
import { ui } from './utils/design-system.js';
import {
  unregisterProject,
  getProject,
  archiveProject
} from './utils/project-registry.js';

program
  .argument('<path>', 'Project path to remove')
  .option('--delete-local', 'Also delete .claude/ directory from project')
  .option('--archive', 'Archive instead of removing (keeps in registry)')
  .option('-y, --yes', 'Skip confirmation')
  .parse(process.argv);

const projectPath = program.args[0];
const options = program.opts();

async function main() {
  ui.header('Remove Project from Tracking', 'folder');

  const resolvedPath = path.resolve(projectPath);
  const project = await getProject(resolvedPath);

  if (!project) {
    ui.error(`Project not found in registry: ${resolvedPath}`);
    ui.muted('\nRun "claude-init projects" to see all tracked projects.');
    process.exit(1);
  }

  ui.muted(`Project: ${project.name}`);
  ui.muted(`Path: ${project.path}`);
  ui.muted(`Registered: ${new Date(project.registeredAt).toLocaleDateString()}`);
  ui.muted(`Total setups: ${project.setupCount}`);
  ui.blank();

  if (!options.yes) {
    const action = options.archive ? 'archive' : 'remove';
    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: `Are you sure you want to ${action} this project from tracking?`,
      default: false
    }]);

    if (!confirm) {
      ui.muted('Operation cancelled.');
      return;
    }
  }

  if (options.archive) {
    await archiveProject(resolvedPath);
    ui.success('Project archived (still in registry but marked inactive)');
  } else {
    await unregisterProject(resolvedPath);
    ui.success('Project removed from tracking');
  }

  if (options.deleteLocal) {
    const claudeDir = path.join(resolvedPath, '.claude');
    if (await fs.pathExists(claudeDir)) {
      await fs.remove(claudeDir);
      ui.success('Removed .claude/ directory from project');
    }
  }

  ui.blank();
}

main().catch(error => {
  console.error(ui.colors.error(`\n${ui.icons.error} Error:`), error.message);
  process.exit(1);
});
