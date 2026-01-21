#!/usr/bin/env node

/**
 * Send Email Summary Script
 * Generates and sends daily summary of claude-init activity
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { program } from 'commander';
import { ui } from './utils/design-system.js';

import { loadEmailConfig, validateEmailConfig, sendEmail, markEmailSent } from './utils/email-sender.js';
import { loadMetadata, loadLastSync, getChangesSince } from './utils/diff-checker.js';
import { collectProjectStatuses, getStatistics } from './utils/project-registry.js';
import { getDocInfo } from './utils/content-summarizer.js';
import { loadExistingDocs } from './utils/doc-fetcher.js';
import { getNews, generateNewsHtml, generateNewsText } from './utils/news-fetcher.js';
import { renderHtmlEmail, renderTextEmail } from './utils/email-templates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');
const KNOWLEDGE_BASE_PATH = path.join(PROJECT_ROOT, 'knowledge-base');

/**
 * Get changes since last email was sent
 */
async function getChangesSinceLastEmail(lastEmailSent) {
  if (!lastEmailSent) {
    // Default to last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return await getChangesSince(KNOWLEDGE_BASE_PATH, yesterday);
  }

  const emailDate = lastEmailSent.split('T')[0];
  return await getChangesSince(KNOWLEDGE_BASE_PATH, emailDate);
}

/**
 * Aggregate changes from multiple sync records
 */
function aggregateChanges(changeRecords) {
  const summary = {
    added: [],
    modified: [],
    removed: []
  };

  for (const record of changeRecords) {
    if (record.changes) {
      summary.added.push(...(record.changes.added || []));
      summary.modified.push(...(record.changes.modified || []));
      summary.removed.push(...(record.changes.removed || []));
    }
  }

  // Deduplicate
  summary.added = [...new Set(summary.added)];
  summary.modified = [...new Set(summary.modified)];
  summary.removed = [...new Set(summary.removed)];

  return summary;
}

/**
 * Format date for display
 */
function formatDate(isoString) {
  if (!isoString) return 'Never';
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Generate HTML email content using template
 * @param {object} metadata - Knowledge base metadata
 * @param {object} lastSync - Last sync info
 * @param {object} changes - Changes object with added, modified, removed
 * @param {object} projectData - Project data with projects and statistics
 * @param {string} newsHtml - Pre-rendered news HTML
 * @returns {Promise<string>} Rendered HTML
 */
async function generateHtmlContent(metadata, lastSync, changes, projectData = {}, newsHtml = '') {
  return renderHtmlEmail({ metadata, changes, projectData, newsHtml });
}

/**
 * Generate plain text email content using template
 * @param {object} metadata - Knowledge base metadata
 * @param {object} lastSync - Last sync info
 * @param {object} changes - Changes object with added, modified, removed
 * @param {object} projectData - Project data with projects and statistics
 * @param {string} newsText - Pre-rendered news text
 * @returns {Promise<string>} Rendered text
 */
async function generateTextContent(metadata, lastSync, changes, projectData = {}, newsText = '') {
  return renderTextEmail({ metadata, changes, projectData, newsText });
}

/**
 * Send a test email
 */
async function sendTestEmail() {
  ui.header('Sending Test Email', 'sync');

  const config = await loadEmailConfig();
  const validation = validateEmailConfig(config);

  if (!validation.valid) {
    ui.error('Email configuration is invalid:');
    validation.errors.forEach(err => ui.errorText(`   - ${err}`));
    process.exit(1);
  }

  ui.muted(`   Sending to: ${config.emailAddress}`);

  const testHtml = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h1 style="color: #5D5CDE;">🎉 Test Email from Claude Init</h1>
      <p>Your email configuration is working correctly!</p>
      <p>You will receive daily summaries of knowledge base updates at this address.</p>
      <p style="color: #666; font-size: 12px;">Sent at: ${new Date().toISOString()}</p>
    </div>
  `;

  const testText = `
Test Email from Claude Init

Your email configuration is working correctly!
You will receive daily summaries of knowledge base updates at this address.

Sent at: ${new Date().toISOString()}
  `.trim();

  try {
    await sendEmail(
      config.emailAddress,
      '✅ Claude Init - Test Email',
      testHtml,
      testText
    );
    ui.success('Test email sent successfully!');
  } catch (error) {
    ui.error(`Failed to send test email: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Generate change summaries from existing docs
 */
async function generateChangeSummariesFromDocs(changes) {
  // Load existing docs to generate summaries
  const existingDocs = await loadExistingDocs(KNOWLEDGE_BASE_PATH);

  // For email summaries, we create summaries based on what we know
  // Since we don't have the old content for comparison, we generate basic summaries
  const summaries = [];

  for (const docName of changes.added) {
    const doc = existingDocs[docName];
    if (doc && doc.content) {
      const summary = {
        docName,
        type: 'added',
        newSections: [],
        removedSections: [],
        modifiedSections: [],
        keyChanges: ['New documentation added']
      };

      // Extract main sections for highlights - look for markdown headings
      const lines = doc.content.split('\n');
      const sections = [];
      for (const line of lines) {
        const match = line.match(/^#{1,3}\s+(.+)$/);
        if (match && match[1]) {
          const heading = match[1].trim();
          // Filter out very short headings or ones that look like artifacts
          if (heading.length > 2 && !heading.startsWith('[') && !heading.includes('​')) {
            sections.push(heading);
          }
        }
      }

      summary.newSections = sections.slice(0, 4);
      if (sections.length > 0) {
        summary.keyChanges = [`New documentation with ${sections.length} sections`];
      }
      summaries.push(summary);
    }
  }

  for (const docName of changes.modified) {
    summaries.push({
      docName,
      type: 'modified',
      newSections: [],
      removedSections: [],
      modifiedSections: [],
      keyChanges: ['Documentation updated']
    });
  }

  for (const docName of changes.removed) {
    summaries.push({
      docName,
      type: 'removed',
      newSections: [],
      removedSections: [],
      modifiedSections: [],
      keyChanges: ['Documentation removed']
    });
  }

  return summaries;
}

/**
 * Preview email content without sending
 */
async function dryRun() {
  ui.header('Email Preview (Dry Run)', 'docs');

  const metadata = await loadMetadata(KNOWLEDGE_BASE_PATH);
  const lastSync = await loadLastSync(KNOWLEDGE_BASE_PATH);
  const config = await loadEmailConfig();

  const changeRecords = await getChangesSinceLastEmail(config.lastEmailSent);
  const changes = aggregateChanges(changeRecords);

  // Generate change summaries
  const changeSummaries = await generateChangeSummariesFromDocs(changes);

  // Collect project data
  const projects = await collectProjectStatuses();
  const statistics = await getStatistics();
  const projectData = { projects, statistics, changeSummaries };

  // Fetch news items
  ui.muted('   Fetching latest news...');
  const newsItems = await getNews({ limit: 4, daysAgo: 14 });
  const newsText = generateNewsText(newsItems);

  ui.divider(50);
  const textContent = await generateTextContent(metadata, lastSync, changes, projectData, newsText);
  console.log(textContent);
  ui.divider(50);

  ui.warning('This is a preview. No email was sent.');
  ui.muted(`   Would send to: ${config.emailAddress || '(not configured)'}`);
  ui.muted(`   News items: ${newsItems.length}`);
}

/**
 * Main function - send email summary
 */
async function main() {
  program
    .name('send-email-summary')
    .description('Send daily email summary of Claude Init activity')
    .option('--test', 'Send a test email')
    .option('--dry-run', 'Preview email without sending')
    .parse(process.argv);

  const options = program.opts();

  if (options.test) {
    await sendTestEmail();
    return;
  }

  if (options.dryRun) {
    await dryRun();
    return;
  }

  // Normal operation - send summary
  const config = await loadEmailConfig();

  if (!config.emailSummaryEnabled) {
    ui.muted('Email summaries are disabled. Enable via: claude-init scheduler');
    return;
  }

  const validation = validateEmailConfig(config);
  if (!validation.valid) {
    ui.warning('Email configuration incomplete, skipping email summary');
    return;
  }

  try {
    const metadata = await loadMetadata(KNOWLEDGE_BASE_PATH);
    const lastSync = await loadLastSync(KNOWLEDGE_BASE_PATH);
    const changeRecords = await getChangesSinceLastEmail(config.lastEmailSent);
    const changes = aggregateChanges(changeRecords);

    // Generate change summaries for meaningful email content
    const changeSummaries = await generateChangeSummariesFromDocs(changes);

    // Collect project data for the summary
    const projects = await collectProjectStatuses();
    const statistics = await getStatistics();
    const projectData = { projects, statistics, changeSummaries };

    // Fetch news items
    const newsItems = await getNews({ limit: 4, daysAgo: 14 });
    const newsHtml = generateNewsHtml(newsItems);
    const newsText = generateNewsText(newsItems);

    const htmlContent = await generateHtmlContent(metadata, lastSync, changes, projectData, newsHtml);
    const textContent = await generateTextContent(metadata, lastSync, changes, projectData, newsText);

    const projectCount = statistics.totalProjects || 0;
    const subject = `📚 Claude Code Summary - v${metadata.version || '0.0.0'}${projectCount > 0 ? ` (${projectCount} projects)` : ''}`;

    await sendEmail(config.emailAddress, subject, htmlContent, textContent);
    await markEmailSent();

    ui.success('Email summary sent');
  } catch (error) {
    ui.warning(`Failed to send email summary: ${error.message}`);
  }
}

main().catch(error => {
  console.error(ui.colors.error('Error:'), error.message);
  process.exit(1);
});
