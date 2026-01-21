#!/usr/bin/env node

/**
 * Project Status Script
 * Shows detailed status of a tracked project
 */

import path from 'path';
import fs from 'fs-extra';
import { program } from 'commander';
import { ui } from './utils/design-system.js';
import { getProject, validateProjectPath } from './utils/project-registry.js';

program
  .argument('[path]', 'Project path (defaults to current directory)')
  .parse(process.argv);

const projectPath = path.resolve(program.args[0] || process.cwd());

async function main() {
  ui.header('Project Status', 'settings');

  const project = await getProject(projectPath);

  if (!project) {
    ui.warning('Project not tracked by claude-init');
    ui.muted(`Path: ${projectPath}`);
    ui.muted('\nRun "claude-init setup" to initialize tracking.');
    return;
  }

  // Basic info
  ui.subheader('Project Information', 'file');
  ui.muted(`  Name: ${project.name}`);
  if (project.description) {
    ui.muted(`  Description: ${project.description}`);
  }
  ui.muted(`  Path: ${project.path}`);
  ui.muted(`  ID: ${project.id}`);

  const statusColor = project.status === 'active' ? ui.colors.success :
                      project.status === 'archived' ? ui.colors.muted : ui.colors.warning;
  console.log(`  Status: ${statusColor(project.status)}`);
  ui.blank();

  // Tech stack
  ui.subheader('Tech Stack', 'settings');
  ui.muted(`  Language: ${project.language}`);
  ui.muted(`  Framework: ${project.framework}`);
  ui.blank();

  // Setup history
  ui.subheader('Setup History', 'calendar');
  ui.muted(`  First registered: ${new Date(project.registeredAt).toLocaleString()}`);
  ui.muted(`  Last setup: ${new Date(project.lastSetup).toLocaleString()}`);
  ui.muted(`  Total setups: ${project.setupCount}`);
  ui.blank();

  // Configuration
  ui.subheader('Configuration', 'list');
  const configItems = [
    { key: 'Hooks', enabled: project.config.setupHooks },
    { key: 'Agents', enabled: project.config.setupAgents },
    { key: 'Commands', enabled: project.config.setupCommands },
    { key: 'Rules', enabled: project.config.setupRules },
    { key: 'Skills', enabled: project.config.setupSkills }
  ];

  for (const item of configItems) {
    const icon = item.enabled ? ui.icons.success : ui.icons.error;
    const color = item.enabled ? ui.colors.success : ui.colors.muted;
    console.log(color(`  ${icon} ${item.key}`));
  }
  ui.blank();

  // Local metadata
  const metadataPath = path.join(projectPath, '.claude', 'metadata.json');
  if (await fs.pathExists(metadataPath)) {
    try {
      const localMeta = await fs.readJson(metadataPath);
      ui.subheader('Local Metadata', 'docs');
      ui.muted(`  KB Version: ${localMeta.knowledgeBaseVersion || 'unknown'}`);
      ui.muted(`  Last synced from KB: ${localMeta.syncedFromKb ? new Date(localMeta.syncedFromKb).toLocaleString() : 'unknown'}`);

      if (localMeta.setupHistory && localMeta.setupHistory.length > 0) {
        ui.muted(`  Setup history entries: ${localMeta.setupHistory.length}`);

        // Show last 3 setup entries
        const recentSetups = localMeta.setupHistory.slice(-3).reverse();
        ui.muted('  Recent setups:');
        for (const setup of recentSetups) {
          const date = new Date(setup.timestamp).toLocaleDateString();
          ui.muted(`    - ${date}: ${setup.changes.join(', ')} (KB v${setup.kbVersion || '?'})`);
        }
      }
      ui.blank();
    } catch (e) {
      // Ignore read errors
    }
  }

  // Validation
  const exists = await validateProjectPath(projectPath);
  if (exists) {
    ui.success('Project directory validated');
  } else {
    ui.warning('Project .claude/ directory not found');
  }
  ui.blank();
}

main().catch(error => {
  console.error(ui.colors.error(`\n${ui.icons.error} Error:`), error.message);
  process.exit(1);
});
