#!/usr/bin/env node

/**
 * View Changes Script
 * Shows detailed changelog since last project setup
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { ui } from './utils/design-system.js';
import { loadMetadata, getChangesSince } from './utils/diff-checker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KNOWLEDGE_BASE_PATH = path.join(__dirname, '..', 'knowledge-base');

async function main() {
  ui.header('Knowledge Base Changelog', 'changelog');

  // Check if knowledge base exists
  if (!await fs.pathExists(KNOWLEDGE_BASE_PATH)) {
    ui.warningText('Knowledge base not found.');
    ui.muted('Run "npm run sync-knowledge" to initialize it.\n');
    process.exit(1);
  }

  // Load metadata
  const metadata = await loadMetadata(KNOWLEDGE_BASE_PATH);

  if (!metadata.lastProjectSetup) {
    ui.warningText('No project setup has been recorded.');
    ui.muted('Showing all changes from the beginning.\n');
  }

  // Get reference date
  const sinceDate = metadata.lastProjectSetup
    ? metadata.lastProjectSetup.split('T')[0]
    : '2000-01-01';

  // Get all changes since that date
  const changes = await getChangesSince(KNOWLEDGE_BASE_PATH, sinceDate);

  if (changes.length === 0) {
    ui.success('No changes recorded since last project setup.\n');
    return;
  }

  ui.muted(`Changes since: ${metadata.lastProjectSetup || 'beginning'}\n`);

  // Group changes by date
  const changesByDate = {};
  for (const change of changes) {
    const date = change.timestamp.split('T')[0];
    if (!changesByDate[date]) {
      changesByDate[date] = [];
    }
    changesByDate[date].push(change);
  }

  // Display changes
  const sortedDates = Object.keys(changesByDate).sort().reverse();

  for (const date of sortedDates) {
    ui.subheader(date, 'calendar');
    ui.divider();

    const dayChanges = changesByDate[date];

    for (const change of dayChanges) {
      const time = change.timestamp.split('T')[1].split('.')[0];
      ui.muted(`  ${time}`);

      if (change.changes.added?.length > 0) {
        ui.successText(`    Added: ${change.changes.added.join(', ')}`);
      }

      if (change.changes.modified?.length > 0) {
        ui.warningText(`    Modified: ${change.changes.modified.join(', ')}`);
      }

      if (change.changes.removed?.length > 0) {
        ui.errorText(`    Removed: ${change.changes.removed.join(', ')}`);
      }
    }
  }

  // Summary
  const totalAdded = changes.reduce((sum, c) => sum + (c.changes.added?.length || 0), 0);
  const totalModified = changes.reduce((sum, c) => sum + (c.changes.modified?.length || 0), 0);
  const totalRemoved = changes.reduce((sum, c) => sum + (c.changes.removed?.length || 0), 0);

  ui.subheader('Summary', 'summary');
  ui.divider();
  console.log(`  Total syncs: ${changes.length}`);
  ui.successText(`  Documents added: ${totalAdded}`);
  ui.warningText(`  Documents modified: ${totalModified}`);
  ui.errorText(`  Documents removed: ${totalRemoved}`);
  ui.blank();

  // Recommendation
  if (totalAdded > 0 || totalModified > 0) {
    ui.tip('Recommendation:');
    ui.muted('   Review the updated documentation and consider running');
    ui.muted('   "npm run setup-project -- --merge" to update your project.\n');
  }
}

main().catch(error => {
  console.error(ui.colors.error(`\n${ui.icons.error} Failed:`), error.message);
  process.exit(1);
});
