#!/usr/bin/env node

/**
 * Post Install Script
 * Runs after npm install to set up the environment
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { ui } from './utils/design-system.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');
const KNOWLEDGE_BASE_PATH = path.join(PROJECT_ROOT, 'knowledge-base');

async function main() {
  ui.header('Claude Code Project Init - Post Install', 'settings');

  // Ensure knowledge base directories exist
  await fs.ensureDir(path.join(KNOWLEDGE_BASE_PATH, 'docs'));
  await fs.ensureDir(path.join(KNOWLEDGE_BASE_PATH, 'changelog'));
  ui.success('Knowledge base directories created');

  // Create initial metadata if not exists
  const metadataPath = path.join(KNOWLEDGE_BASE_PATH, 'metadata.json');
  if (!await fs.pathExists(metadataPath)) {
    await fs.writeJson(metadataPath, {
      version: '0.0.0',
      lastSync: null,
      totalSyncs: 0,
      lastProjectSetup: null,
      docHashes: {}
    }, { spaces: 2 });
    ui.success('Initial metadata created');
  }

  ui.subheader('Next Steps', 'docs');
  ui.muted('  1. Run "npm run sync-knowledge" to fetch the latest documentation');
  ui.muted('  2. Run "npm run setup-scheduler" to enable daily auto-updates');
  ui.muted('  3. Run "npm run setup-project" to initialize a new project\n');

  ui.success('Post-install complete!\n');
}

main().catch(error => {
  console.error(ui.colors.error('Post-install warning:'), error.message);
  // Don't exit with error to not break npm install
});
