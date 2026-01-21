/**
 * Email Template Loader
 *
 * Loads and renders email templates using the template engine.
 *
 * @module email-templates
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { render } from './template-engine.js';
import { getDocInfo } from './content-summarizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, '..', '..', 'templates', 'email');

// =============================================================================
// TEMPLATE LOADING
// =============================================================================

let templateCache = {};

/**
 * Load a template file
 * @param {string} name - Template name (e.g., 'newsletter.html')
 * @returns {Promise<string>} Template content
 */
async function loadTemplate(name) {
  if (templateCache[name]) {
    return templateCache[name];
  }

  const templatePath = path.join(TEMPLATES_DIR, name);
  const content = await fs.readFile(templatePath, 'utf-8');
  templateCache[name] = content;
  return content;
}

/**
 * Clear template cache
 */
export function clearTemplateCache() {
  templateCache = {};
}

// =============================================================================
// CONTEXT BUILDING
// =============================================================================

/**
 * Build template context from email data
 * @param {object} options - Email data
 * @returns {object} Template context
 */
export function buildEmailContext(options) {
  const {
    metadata = {},
    changes = { added: [], modified: [], removed: [] },
    projectData = {},
    newsHtml = '',
    newsText = ''
  } = options;

  const { projects = [], statistics = {} } = projectData;
  const today = new Date();
  const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  // Check if there are doc changes
  const hasDocChanges = changes.added.length > 0 || changes.modified.length > 0 || changes.removed.length > 0;

  // Get rich doc info
  const addedDocs = changes.added.map(name => getDocInfo(name));
  const modifiedDocs = changes.modified.map(name => getDocInfo(name));
  const allDocs = [...addedDocs, ...modifiedDocs];

  // Group docs by category
  const docsByCategory = {};
  allDocs.forEach(doc => {
    if (!docsByCategory[doc.category]) {
      docsByCategory[doc.category] = { icon: doc.icon, docs: [] };
    }
    docsByCategory[doc.category].docs.push(doc);
  });

  // Convert to array for template iteration
  const docCategories = Object.entries(docsByCategory).slice(0, 3).map(([name, { icon, docs }]) => ({
    name,
    icon,
    docs,
    docTitles: docs.map(d => d.title).join(' • ')
  }));

  // Get recent projects (last 7 days)
  const recentProjects = projects.filter(p => {
    const lastSetup = new Date(p.lastSetup);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return lastSetup > weekAgo;
  }).slice(0, 5).map(p => {
    const latestSetup = p.localMetadata?.setupHistory?.slice(-1)[0];
    const isNew = latestSetup?.setupType === 'initial';
    const setupChanges = latestSetup?.changes || [];

    return {
      name: p.name,
      language: p.language,
      framework: p.framework,
      hasFramework: p.framework && p.framework !== 'none',
      isNew,
      statusLabel: isNew ? '✨ NEW' : '↻ Updated',
      statusIcon: isNew ? '✨ NEW' : '↻ UPD',
      statusBgColor: isNew ? '#dcfce7' : '#fef3c7',
      statusTextColor: isNew ? '#166534' : '#92400e',
      setupInfo: setupChanges.length > 0
        ? setupChanges.slice(0, 3).map(c => c.item).join(', ') + (setupChanges.length > 3 ? ` +${setupChanges.length - 3} more` : '') + ' configured'
        : `Setup #${p.setupCount} completed`
    };
  });

  // Generate greeting based on time
  const hour = today.getHours();
  const greeting = hour < 12 ? 'gm' : hour < 17 ? 'hey there' : 'evening';

  // Stats summary
  const totalChanges = changes.added.length + changes.modified.length;
  const projectUpdates = recentProjects.length;

  // Build intro text
  let introText;
  if (hasDocChanges) {
    introText = `This week: <strong>${totalChanges} documentation updates</strong> from Anthropic`;
    if (projectUpdates > 0) {
      introText += `, and <strong>${projectUpdates} project${projectUpdates > 1 ? 's' : ''}</strong> got fresh configurations`;
    }
    introText += '. ';
    if (addedDocs.length > 0) {
      introText += `New stuff includes ${addedDocs.slice(0, 2).map(d => d.title).join(' and ')}${addedDocs.length > 2 ? ' and more' : ''}.`;
    } else {
      introText += 'Mostly improvements to existing docs.';
    }
  } else {
    introText = 'Quiet week on the docs front — everything\'s up to date. ';
    if (projectUpdates > 0) {
      introText += `But ${projectUpdates} project${projectUpdates > 1 ? 's' : ''} got new configs.`;
    } else {
      introText += 'Time to ship some code.';
    }
  }

  // Build plain text intro (no HTML tags)
  let introTextPlain;
  if (hasDocChanges) {
    introTextPlain = `This week: ${totalChanges} documentation updates from Anthropic`;
    if (projectUpdates > 0) {
      introTextPlain += `, and ${projectUpdates} project${projectUpdates > 1 ? 's' : ''} got fresh configurations`;
    }
    introTextPlain += '. ';
    if (addedDocs.length > 0) {
      introTextPlain += `New stuff includes ${addedDocs.slice(0, 2).map(d => d.title).join(' and ')}${addedDocs.length > 2 ? ' and more' : ''}.`;
    } else {
      introTextPlain += 'Mostly improvements to existing docs.';
    }
  } else {
    introTextPlain = 'Quiet week on the docs front — everything\'s up to date. ';
    if (projectUpdates > 0) {
      introTextPlain += `But ${projectUpdates} project${projectUpdates > 1 ? 's' : ''} got new configs.`;
    } else {
      introTextPlain += 'Time to ship some code.';
    }
  }

  // Featured doc info
  const featuredDoc = addedDocs.length > 0 ? addedDocs[0] : modifiedDocs[0] || null;
  const featuredTitle = featuredDoc ? featuredDoc.title : 'Documentation Updates';
  const featuredDescription = addedDocs.length > 0
    ? addedDocs[0].description
    : `${totalChanges} doc${totalChanges > 1 ? 's' : ''} updated with the latest Claude Code improvements and features.`;

  return {
    // Header
    headerIcon: '🤖',
    headerTitle: 'Claude Code',
    headerSubtitle: 'The Roundup',
    dateStr,
    dayOfWeek,
    greeting,

    // Intro
    introText,
    introTextPlain,

    // Doc changes
    hasDocChanges,
    hasFeaturedDoc: !!featuredDoc,
    featuredTitle,
    featuredDescription,
    docCategories,
    totalChanges,

    // Projects
    hasProjects: projects.length > 0,
    hasRecentProjects: recentProjects.length > 0,
    recentProjects,
    totalProjects: projects.length,
    multipleProjects: projects.length > 1,
    hasMoreProjects: projects.length > recentProjects.length,
    moreProjectsCount: projects.length - recentProjects.length,

    // Stats
    statsProjects: statistics.totalProjects || 0,
    statsDocs: Object.keys(metadata.docHashes || {}).length,
    statsVersion: `v${metadata.version || '0.0.0'}`,

    // News (pre-rendered)
    newsHtml,
    newsText,

    // Separators for plain text
    separator: '─'.repeat(50),
    doubleSeparator: '═'.repeat(50)
  };
}

// =============================================================================
// HTML RENDERING
// =============================================================================

/**
 * Render HTML email content
 * @param {object} options - Email data
 * @returns {Promise<string>} Rendered HTML
 */
export async function renderHtmlEmail(options) {
  const template = await loadTemplate('newsletter.html');
  const context = buildEmailContext(options);

  // The template engine handles most of it, but we need to manually handle
  // the complex nested loops for doc categories and projects
  let html = template;

  // Replace simple variables first
  html = render(html, context);

  return html.trim();
}

/**
 * Render plain text email content
 * @param {object} options - Email data
 * @returns {Promise<string>} Rendered text
 */
export async function renderTextEmail(options) {
  const template = await loadTemplate('newsletter.txt');
  const context = buildEmailContext(options);

  // Use plain text intro
  context.introText = context.introTextPlain;

  let text = render(template, context);

  // Clean up any extra blank lines
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  loadTemplate,
  clearTemplateCache,
  buildEmailContext,
  renderHtmlEmail,
  renderTextEmail
};
