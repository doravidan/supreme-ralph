#!/usr/bin/env node

/**
 * Check Updates Script
 * Checks if the knowledge base has been updated since last project setup
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { ui } from './utils/design-system.js';
import { hasUpdatesSinceLastSetup, loadMetadata, getChangesSince } from './utils/diff-checker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KNOWLEDGE_BASE_PATH = path.join(__dirname, '..', 'knowledge-base');

async function main() {
  ui.header('Checking for Knowledge Base Updates', 'search');

  // Check if knowledge base exists
  if (!await fs.pathExists(KNOWLEDGE_BASE_PATH)) {
    ui.warningText('Knowledge base not found.');
    ui.muted('Run "npm run sync-knowledge" to initialize it.\n');
    process.exit(1);
  }

  // Load metadata
  const metadata = await loadMetadata(KNOWLEDGE_BASE_PATH);

  ui.muted('Current Knowledge Base Status:');
  ui.muted(`  Version: ${metadata.version}`);
  ui.muted(`  Last Sync: ${metadata.lastSync || 'Never'}`);
  ui.muted(`  Total Syncs: ${metadata.totalSyncs || 0}`);
  ui.muted(`  Documents: ${Object.keys(metadata.docHashes || {}).length}`);
  ui.blank();

  // Check for updates
  const updateInfo = await hasUpdatesSinceLastSetup(KNOWLEDGE_BASE_PATH);

  if (!metadata.lastProjectSetup) {
    ui.warning('No project setup has been recorded yet.');
    ui.muted('Run "npm run setup-project" to initialize a project.\n');
    return;
  }

  ui.muted(`Last Project Setup: ${metadata.lastProjectSetup}\n`);

  if (updateInfo.hasUpdates) {
    console.log(ui.colors.warningBold(`${ui.icons.announce} Updates Available!\n`));

    const { summary } = updateInfo;

    if (summary.added.length > 0) {
      ui.successText(`  Added (${summary.added.length}):`);
      summary.added.forEach(doc => ui.added(doc));
    }

    if (summary.modified.length > 0) {
      ui.warningText(`  Modified (${summary.modified.length}):`);
      summary.modified.forEach(doc => ui.modified(doc));
    }

    if (summary.removed.length > 0) {
      ui.errorText(`  Removed (${summary.removed.length}):`);
      summary.removed.forEach(doc => ui.removed(doc));
    }

    ui.tip('Consider re-running setup-project to incorporate new best practices.');
    ui.muted('   Run "npm run view-changes" for detailed changelog.\n');
  } else {
    ui.success('Knowledge base is up to date with your last project setup.\n');
  }

  // Check if sync is needed
  if (metadata.lastSync) {
    const lastSyncDate = new Date(metadata.lastSync);
    const daysSinceSync = Math.floor((Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceSync > 7) {
      ui.warning(`Last sync was ${daysSinceSync} days ago.`);
      ui.muted('Consider running "npm run sync-knowledge" to check for updates.\n');
    }
  }
}

main().catch(error => {
  console.error(ui.colors.error(`\n${ui.icons.error} Check failed:`), error.message);
  process.exit(1);
});
