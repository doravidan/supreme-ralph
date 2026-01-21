#!/usr/bin/env node

/**
 * List Templates Script
 * Shows all available templates
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { ui } from './utils/design-system.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_PATH = path.join(__dirname, '..', 'templates');

async function listDirectory(dir, prefix = '') {
  const items = await fs.readdir(dir, { withFileTypes: true });

  for (const item of items) {
    const itemPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      ui.folderItem(item.name, prefix);
      await listDirectory(itemPath, prefix + '  ');
    } else if (item.name.endsWith('.template') || item.name.endsWith('.md')) {
      ui.fileItem(item.name, prefix);
    }
  }
}

async function main() {
  ui.header('Available Templates', 'list');

  if (!await fs.pathExists(TEMPLATES_PATH)) {
    ui.warningText('Templates directory not found.');
    ui.muted(`Expected path: ${TEMPLATES_PATH}\n`);
    process.exit(1);
  }

  await listDirectory(TEMPLATES_PATH);
  ui.blank();
}

main().catch(error => {
  console.error(ui.colors.error(`\n${ui.icons.error} Failed:`), error.message);
  process.exit(1);
});
