#!/usr/bin/env node

/**
 * Sync Knowledge Base Script
 * Fetches latest documentation from Anthropic and updates the local knowledge base
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { ui } from './utils/design-system.js';
import {
  fetchAllDocs,
  saveDocs,
  loadExistingDocs,
  detectChanges,
  DOC_SOURCES
} from './utils/doc-fetcher.js';
import {
  loadMetadata,
  saveMetadata,
  saveLastSync,
  recordChanges,
  incrementVersion
} from './utils/diff-checker.js';
import { loadEmailConfig, validateEmailConfig, sendEmail, markEmailSent } from './utils/email-sender.js';
import { collectProjectStatuses, getStatistics } from './utils/project-registry.js';
import {
  processChangesWithSummaries,
  generateChangeSummary,
  groupChangesByCategory,
  generateOverallSummary,
  getDocCategory
} from './utils/content-summarizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KNOWLEDGE_BASE_PATH = path.join(__dirname, '..', 'knowledge-base');

/**
 * Send email summary if enabled in config
 */
async function sendEmailSummaryIfEnabled(metadata, changes, changeSummaries = []) {
  try {
    const emailConfig = await loadEmailConfig();

    if (!emailConfig.emailSummaryEnabled) {
      return;
    }

    const validation = validateEmailConfig(emailConfig);
    if (!validation.valid) {
      ui.warning('Email config incomplete, skipping email summary');
      return;
    }

    // Collect project data for summary
    const projects = await collectProjectStatuses();
    const statistics = await getStatistics();

    const hasChanges = changes.added.length > 0 || changes.modified.length > 0 || changes.removed.length > 0;
    const projectCount = statistics.totalProjects || 0;
    const subject = `📚 Claude Code Summary - v${metadata.version}${hasChanges ? ' (Updated)' : ''}${projectCount > 0 ? ` | ${projectCount} projects` : ''}`;

    const htmlContent = generateEmailHtml(metadata, changes, { projects, statistics, changeSummaries });
    const textContent = generateEmailText(metadata, changes, { projects, statistics, changeSummaries });

    await sendEmail(emailConfig.emailAddress, subject, htmlContent, textContent);
    await markEmailSent();

    ui.success(`Email summary sent to ${emailConfig.emailAddress}`);
  } catch (error) {
    ui.warning(`Failed to send email: ${error.message}`);
  }
}

/**
 * Generate HTML email content
 */
function generateEmailHtml(metadata, changes, projectData = {}) {
  const hasChanges = changes.added.length > 0 || changes.modified.length > 0 || changes.removed.length > 0;
  const { projects = [], statistics = {}, changeSummaries = [] } = projectData;

  // Group summaries by category for better organization
  const groupedChanges = groupChangesByCategory(changeSummaries);

  const projectsHtml = projects.length > 0 ? `
    <div class="section">
      <h3 style="margin:0 0 10px;">📁 Tracked Projects (${statistics.activeProjects || 0}/${statistics.totalProjects || 0})</h3>
      ${projects.slice(0, 5).map(p => `
        <div style="padding:8px 0;border-bottom:1px solid #eee;">
          <strong>${p.name}</strong> <span class="badge badge-lang">${p.language}</span>
          <div style="color:#666;font-size:12px;">Last setup: ${new Date(p.lastSetup).toLocaleDateString()}</div>
        </div>
      `).join('')}
      ${projects.length > 5 ? `<p style="color:#666;font-size:12px;">... and ${projects.length - 5} more</p>` : ''}
    </div>
  ` : '';

  // Generate meaningful changes section
  let changesHtml = '';
  if (hasChanges && changeSummaries.length > 0) {
    changesHtml = `
    <div class="section">
      <h3 style="margin:0 0 15px;">📝 What's New</h3>
      ${Object.entries(groupedChanges).map(([category, { icon, changes: catChanges }]) => `
        <div style="margin-bottom:15px;">
          <div style="font-weight:bold;color:#374151;margin-bottom:8px;">${icon} ${category}</div>
          ${catChanges.map(summary => {
            const readable = generateChangeSummary(summary);
            const badgeClass = summary.type === 'added' ? 'badge-added' : summary.type === 'removed' ? 'badge-removed' : 'badge-modified';
            const badgeText = summary.type === 'added' ? 'New' : summary.type === 'removed' ? 'Removed' : 'Updated';
            return `
            <div style="padding:10px;background:#f8fafc;border-radius:4px;margin-bottom:8px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span class="badge ${badgeClass}">${badgeText}</span>
                <strong>${readable.title.replace(/^(New|Updated|Removed): /, '')}</strong>
              </div>
              <p style="margin:6px 0 0;color:#4b5563;font-size:13px;">${readable.description}</p>
              ${readable.highlights.length > 0 ? `
                <div style="margin-top:6px;font-size:12px;color:#6b7280;">
                  ${readable.highlights.map(h => `<span style="background:#e5e7eb;padding:2px 6px;border-radius:3px;margin-right:4px;">${h}</span>`).join('')}
                </div>
              ` : ''}
            </div>`;
          }).join('')}
        </div>
      `).join('')}
    </div>`;
  } else if (hasChanges) {
    // Fallback to old style if no summaries available
    changesHtml = `
    <div class="section">
      <h3 style="margin:0 0 10px;">📝 Changes</h3>
      <ul>
        ${changes.added.map(d => `<li><span class="badge badge-added">Added</span> ${d}</li>`).join('')}
        ${changes.modified.map(d => `<li><span class="badge badge-modified">Modified</span> ${d}</li>`).join('')}
        ${changes.removed.map(d => `<li><span class="badge badge-removed">Removed</span> ${d}</li>`).join('')}
      </ul>
    </div>`;
  } else {
    changesHtml = '<div class="section"><p style="margin:0;color:#666;">No documentation changes.</p></div>';
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #5D5CDE 0%, #7B7BFF 100%); color: white; padding: 25px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .section { background: white; padding: 15px; margin-bottom: 15px; border-radius: 6px; border-left: 4px solid #5D5CDE; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; margin-left: 5px; }
    .badge-added { background: #dcfce7; color: #166534; }
    .badge-modified { background: #fef3c7; color: #92400e; }
    .badge-removed { background: #fee2e2; color: #991b1b; }
    .badge-lang { background: #dbeafe; color: #1e40af; }
    ul { margin: 0; padding: 0; list-style: none; }
    li { padding: 5px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin:0;">📚 Knowledge Base Updated</h1>
    <p style="margin:10px 0 0;">Version ${metadata.version}${statistics.totalProjects ? ` | ${statistics.totalProjects} Projects` : ''}</p>
  </div>
  <div class="content">
    <div class="section">
      <h3 style="margin:0 0 10px;">📊 Status</h3>
      <p style="margin:0;">Total Syncs: ${metadata.totalSyncs} | Documents: ${Object.keys(metadata.docHashes || {}).length}</p>
    </div>
    ${changesHtml}
    ${projectsHtml}
  </div>
</body>
</html>`.trim();
}

/**
 * Generate plain text email content
 */
function generateEmailText(metadata, changes, projectData = {}) {
  const hasChanges = changes.added.length > 0 || changes.modified.length > 0 || changes.removed.length > 0;
  const { projects = [], statistics = {}, changeSummaries = [] } = projectData;

  let text = `CLAUDE CODE KNOWLEDGE BASE UPDATED\nVersion: ${metadata.version}${statistics.totalProjects ? ` | ${statistics.totalProjects} Projects` : ''}\n${'='.repeat(40)}\n\n`;
  text += `Total Syncs: ${metadata.totalSyncs}\nDocuments: ${Object.keys(metadata.docHashes || {}).length}\n\n`;

  if (hasChanges && changeSummaries.length > 0) {
    text += "WHAT'S NEW:\n\n";

    // Group by category
    const groupedChanges = groupChangesByCategory(changeSummaries);

    for (const [category, { icon, changes: catChanges }] of Object.entries(groupedChanges)) {
      text += `${icon} ${category}\n${'-'.repeat(30)}\n`;
      for (const summary of catChanges) {
        const readable = generateChangeSummary(summary);
        const prefix = summary.type === 'added' ? '[NEW]' : summary.type === 'removed' ? '[REMOVED]' : '[UPDATED]';
        text += `  ${prefix} ${readable.title.replace(/^(New|Updated|Removed): /, '')}\n`;
        text += `    ${readable.description}\n`;
        if (readable.highlights.length > 0) {
          text += `    Topics: ${readable.highlights.join(', ')}\n`;
        }
        text += '\n';
      }
    }
  } else if (hasChanges) {
    // Fallback to old style if no summaries
    text += 'CHANGES:\n';
    changes.added.forEach(d => { text += `  + Added: ${d}\n`; });
    changes.modified.forEach(d => { text += `  ~ Modified: ${d}\n`; });
    changes.removed.forEach(d => { text += `  - Removed: ${d}\n`; });
  } else {
    text += 'No documentation changes.\n';
  }

  if (projects.length > 0) {
    text += `\nTRACKED PROJECTS (${statistics.activeProjects}/${statistics.totalProjects}):\n`;
    projects.slice(0, 5).forEach(p => {
      text += `  - ${p.name} [${p.language}] - Last setup: ${new Date(p.lastSetup).toLocaleDateString()}\n`;
    });
    if (projects.length > 5) {
      text += `  ... and ${projects.length - 5} more\n`;
    }
  }

  return text;
}

async function main() {
  ui.header('Claude Code Knowledge Base Sync', 'sync');
  ui.muted(`Knowledge base path: ${KNOWLEDGE_BASE_PATH}\n`);

  // Ensure knowledge base directory exists
  await fs.ensureDir(KNOWLEDGE_BASE_PATH);
  await fs.ensureDir(path.join(KNOWLEDGE_BASE_PATH, 'docs'));
  await fs.ensureDir(path.join(KNOWLEDGE_BASE_PATH, 'changelog'));

  // Load existing metadata
  const metadata = await loadMetadata(KNOWLEDGE_BASE_PATH);
  ui.muted(`Current version: ${metadata.version}`);
  ui.muted(`Last sync: ${metadata.lastSync || 'Never'}\n`);

  // Load existing docs for comparison
  const spinner = ui.spinner('Loading existing documentation...').start();
  const existingDocs = await loadExistingDocs(KNOWLEDGE_BASE_PATH);
  spinner.succeed(`Loaded ${Object.keys(existingDocs).length} existing documents`);

  // Fetch new documentation
  spinner.start('Fetching documentation from Anthropic...');
  const { docs: newDocs, errors } = await fetchAllDocs();

  if (errors.length > 0) {
    spinner.warn(`Fetched with ${errors.length} errors`);
    ui.warningText('\nFetch errors:');
    errors.forEach(e => ui.warningText(`  - ${e.name}: ${e.error}`));
  } else {
    spinner.succeed(`Fetched ${Object.keys(newDocs).length} documents`);
  }

  // Detect changes
  spinner.start('Detecting changes...');
  const changes = detectChanges(newDocs, existingDocs);
  spinner.succeed('Change detection complete');

  // Report changes
  ui.subheader('Change Summary', 'summary');

  if (changes.added.length > 0) {
    ui.successText(`  ${ui.icons.success} Added (${changes.added.length}):`);
    changes.added.forEach(name => ui.added(name));
  }

  if (changes.modified.length > 0) {
    ui.warningText(`  ${ui.icons.modify} Modified (${changes.modified.length}):`);
    changes.modified.forEach(name => ui.modified(name));
  }

  if (changes.removed.length > 0) {
    ui.errorText(`  ${ui.icons.error} Removed (${changes.removed.length}):`);
    changes.removed.forEach(name => ui.removed(name));
  }

  if (changes.unchanged.length > 0) {
    ui.muted(`  = Unchanged: ${changes.unchanged.length} documents`);
  }

  const hasChanges = changes.added.length > 0 ||
                     changes.modified.length > 0 ||
                     changes.removed.length > 0;

  if (!hasChanges) {
    console.log(ui.colors.success(`\n${ui.icons.complete} Knowledge base is already up to date!\n`));
  } else {
    // Generate meaningful change summaries BEFORE saving (we need old content)
    spinner.start('Analyzing changes...');
    const changeSummaries = await processChangesWithSummaries(changes, newDocs, existingDocs);
    spinner.succeed(`Analyzed ${changeSummaries.length} changes`);

    // Show meaningful summaries in console
    if (changeSummaries.length > 0) {
      ui.subheader("What's New", 'star');
      for (const summary of changeSummaries) {
        const readable = generateChangeSummary(summary);
        const { icon } = getDocCategory(summary.docName);
        const typeIcon = summary.type === 'added' ? ui.icons.success :
                        summary.type === 'removed' ? ui.icons.error : ui.icons.modify;
        console.log(`  ${typeIcon} ${icon} ${readable.title}`);
        ui.muted(`      ${readable.description}`);
        if (readable.highlights.length > 0) {
          ui.muted(`      Topics: ${readable.highlights.slice(0, 3).join(', ')}`);
        }
      }
      ui.blank();
    }

    // Save new documentation
    spinner.start('Saving updated documentation...');
    await saveDocs(newDocs, KNOWLEDGE_BASE_PATH);
    spinner.succeed('Documentation saved');

    // Update metadata
    const newVersion = incrementVersion(metadata.version, changes);
    const syncInfo = {
      timestamp: new Date().toISOString(),
      version: newVersion,
      documentsCount: Object.keys(newDocs).length,
      changes: {
        added: changes.added.length,
        modified: changes.modified.length,
        removed: changes.removed.length
      }
    };

    // Update and save metadata
    metadata.version = newVersion;
    metadata.lastSync = syncInfo.timestamp;
    metadata.totalSyncs = (metadata.totalSyncs || 0) + 1;
    metadata.docHashes = {};

    for (const [name, doc] of Object.entries(newDocs)) {
      metadata.docHashes[name] = doc.hash;
    }

    await saveMetadata(KNOWLEDGE_BASE_PATH, metadata);
    await saveLastSync(KNOWLEDGE_BASE_PATH, syncInfo);
    await recordChanges(KNOWLEDGE_BASE_PATH, changes);

    console.log(ui.colors.success(`\n${ui.icons.complete} Knowledge base updated to version ${newVersion}!`));
    ui.muted(`   Total syncs: ${metadata.totalSyncs}`);
    ui.muted(`   Timestamp: ${syncInfo.timestamp}\n`);

    // Send email summary if enabled (with meaningful summaries)
    await sendEmailSummaryIfEnabled(metadata, changes, changeSummaries);
  }

  // Show available documentation
  ui.subheader('Available Documentation', 'docs');
  Object.keys(DOC_SOURCES).forEach(name => {
    const status = newDocs[name] ? ui.icons.success : ui.icons.error;
    const color = newDocs[name] ? ui.colors.success : ui.colors.error;
    console.log(`  ${color(status)} ${name}`);
  });
  ui.blank();

  return { changes, hasChanges, metadata };
}

main().catch(error => {
  console.error(ui.colors.error(`\n${ui.icons.error} Sync failed:`), error.message);
  process.exit(1);
});
