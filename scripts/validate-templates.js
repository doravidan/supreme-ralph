#!/usr/bin/env node

/**
 * Validate Templates Script
 * Validates all template files for syntax errors
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { ui } from './utils/design-system.js';
import { validateTemplate } from './utils/template-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_PATH = path.join(__dirname, '..', 'templates');

async function findTemplates(dir) {
  const templates = [];
  const items = await fs.readdir(dir, { withFileTypes: true });

  for (const item of items) {
    const itemPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      templates.push(...await findTemplates(itemPath));
    } else if (item.name.endsWith('.template')) {
      templates.push(itemPath);
    }
  }

  return templates;
}

async function main() {
  ui.header('Validating Templates', 'search');

  if (!await fs.pathExists(TEMPLATES_PATH)) {
    ui.warningText('Templates directory not found.');
    process.exit(1);
  }

  const templates = await findTemplates(TEMPLATES_PATH);

  if (templates.length === 0) {
    ui.warningText('No template files found.\n');
    return;
  }

  ui.muted(`Found ${templates.length} template files\n`);

  let errors = 0;
  let warnings = 0;

  for (const templatePath of templates) {
    const relativePath = path.relative(TEMPLATES_PATH, templatePath);
    const result = await validateTemplate(relativePath);

    if (!result.valid) {
      ui.errorText(`${ui.icons.error} ${relativePath}`);
      result.errors.forEach(err => {
        ui.errorText(`   Error: ${err}`);
        errors++;
      });
    } else if (result.warnings.length > 0) {
      ui.warningText(`${ui.icons.warning} ${relativePath}`);
      result.warnings.forEach(warn => {
        ui.warningText(`   Warning: ${warn}`);
        warnings++;
      });
    } else {
      ui.successText(`${ui.icons.success} ${relativePath}`);
    }
  }

  ui.subheader('Summary', 'summary');
  ui.divider();
  console.log(`  Templates: ${templates.length}`);
  ui.successText(`  Valid: ${templates.length - errors}`);
  ui.errorText(`  Errors: ${errors}`);
  ui.warningText(`  Warnings: ${warnings}`);
  ui.blank();

  if (errors > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error(ui.colors.error(`\n${ui.icons.error} Validation failed:`), error.message);
  process.exit(1);
});
