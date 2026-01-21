/**
 * Content Summarizer Utility
 * Generates meaningful summaries of documentation changes
 * Instead of just showing "modified: hooks", it explains WHAT changed
 */

import fs from 'fs-extra';
import path from 'path';

/**
 * Extract sections from markdown content
 * Returns array of { heading, level, content }
 */
export function extractSections(markdown) {
  const sections = [];
  const lines = markdown.split('\n');
  let currentSection = null;
  let contentLines = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);

    if (headingMatch) {
      // Save previous section
      if (currentSection) {
        currentSection.content = contentLines.join('\n').trim();
        sections.push(currentSection);
      }

      currentSection = {
        heading: headingMatch[2].trim(),
        level: headingMatch[1].length,
        content: ''
      };
      contentLines = [];
    } else if (currentSection) {
      contentLines.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    currentSection.content = contentLines.join('\n').trim();
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Extract key features/items from content
 * Looks for bullet points, numbered lists, code blocks
 */
export function extractKeyItems(content) {
  const items = [];

  // Extract bullet points
  const bullets = content.match(/^[\s]*[-*]\s+(.+)$/gm) || [];
  bullets.forEach(b => {
    const text = b.replace(/^[\s]*[-*]\s+/, '').trim();
    if (text.length > 10 && text.length < 200) {
      items.push({ type: 'bullet', text });
    }
  });

  // Extract code examples (function names, commands)
  const codeBlocks = content.match(/`([^`]+)`/g) || [];
  codeBlocks.forEach(c => {
    const code = c.replace(/`/g, '');
    if (code.length > 3 && code.length < 50 && !code.includes(' ')) {
      items.push({ type: 'code', text: code });
    }
  });

  return items;
}

/**
 * Compare two versions of a document and generate a summary
 */
export function compareDocuments(oldContent, newContent, docName) {
  const summary = {
    docName,
    type: 'modified',
    newSections: [],
    removedSections: [],
    modifiedSections: [],
    keyChanges: []
  };

  if (!oldContent) {
    summary.type = 'added';
    const sections = extractSections(newContent);
    summary.keyChanges.push(`New documentation with ${sections.length} sections`);

    // List main sections
    const mainSections = sections.filter(s => s.level <= 2).slice(0, 5);
    mainSections.forEach(s => {
      summary.newSections.push(s.heading);
    });

    return summary;
  }

  if (!newContent) {
    summary.type = 'removed';
    summary.keyChanges.push('Documentation removed');
    return summary;
  }

  const oldSections = extractSections(oldContent);
  const newSections = extractSections(newContent);

  const oldHeadings = new Set(oldSections.map(s => s.heading));
  const newHeadings = new Set(newSections.map(s => s.heading));

  // Find new sections
  for (const section of newSections) {
    if (!oldHeadings.has(section.heading)) {
      summary.newSections.push(section.heading);
    }
  }

  // Find removed sections
  for (const section of oldSections) {
    if (!newHeadings.has(section.heading)) {
      summary.removedSections.push(section.heading);
    }
  }

  // Find modified sections (same heading, different content)
  for (const newSection of newSections) {
    const oldSection = oldSections.find(s => s.heading === newSection.heading);
    if (oldSection && oldSection.content !== newSection.content) {
      // Check if content significantly changed
      const oldLen = oldSection.content.length;
      const newLen = newSection.content.length;
      const diff = Math.abs(newLen - oldLen);

      if (diff > 50 || diff / Math.max(oldLen, 1) > 0.1) {
        summary.modifiedSections.push({
          heading: newSection.heading,
          change: newLen > oldLen ? 'expanded' : 'condensed'
        });
      }
    }
  }

  // Generate key changes description
  if (summary.newSections.length > 0) {
    summary.keyChanges.push(`Added: ${summary.newSections.slice(0, 3).join(', ')}${summary.newSections.length > 3 ? '...' : ''}`);
  }
  if (summary.removedSections.length > 0) {
    summary.keyChanges.push(`Removed: ${summary.removedSections.slice(0, 3).join(', ')}${summary.removedSections.length > 3 ? '...' : ''}`);
  }
  if (summary.modifiedSections.length > 0) {
    const expanded = summary.modifiedSections.filter(s => s.change === 'expanded');
    const condensed = summary.modifiedSections.filter(s => s.change === 'condensed');
    if (expanded.length > 0) {
      summary.keyChanges.push(`Expanded: ${expanded.map(s => s.heading).slice(0, 3).join(', ')}`);
    }
    if (condensed.length > 0) {
      summary.keyChanges.push(`Updated: ${condensed.map(s => s.heading).slice(0, 3).join(', ')}`);
    }
  }

  if (summary.keyChanges.length === 0) {
    summary.keyChanges.push('Minor updates and fixes');
  }

  return summary;
}

/**
 * Generate a human-readable summary for a documentation change
 */
export function generateChangeSummary(summary) {
  const { docName, type, keyChanges } = summary;

  // Convert doc name to readable format
  const readableName = docName
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  if (type === 'added') {
    return {
      title: `New: ${readableName}`,
      description: keyChanges[0] || 'New documentation added',
      highlights: summary.newSections.slice(0, 4)
    };
  }

  if (type === 'removed') {
    return {
      title: `Removed: ${readableName}`,
      description: 'Documentation has been removed',
      highlights: []
    };
  }

  return {
    title: `Updated: ${readableName}`,
    description: keyChanges.join(' | '),
    highlights: [
      ...summary.newSections.slice(0, 2),
      ...summary.modifiedSections.slice(0, 2).map(s => s.heading)
    ]
  };
}

/**
 * Map doc names to categories with descriptions for better organization
 */
const DOC_CATEGORIES = {
  overview: {
    category: 'Getting Started',
    icon: '📖',
    title: 'Overview',
    description: 'Introduction to Claude Code - an agentic coding tool that lives in your terminal',
    highlights: ['Terminal-based AI assistant', 'Natural language coding', 'Direct codebase interaction']
  },
  quickstart: {
    category: 'Getting Started',
    icon: '🚀',
    title: 'Quickstart Guide',
    description: 'Get up and running with Claude Code in under 5 minutes',
    highlights: ['Installation steps', 'First commands', 'Basic usage patterns']
  },
  memory: {
    category: 'Core Features',
    icon: '🧠',
    title: 'Memory & Context',
    description: 'How Claude Code remembers context across sessions using CLAUDE.md files',
    highlights: ['Project memory', 'Session persistence', 'Context management']
  },
  settings: {
    category: 'Configuration',
    icon: '⚙️',
    title: 'Settings',
    description: 'Configure Claude Code behavior, permissions, and preferences',
    highlights: ['Permission levels', 'Model selection', 'Custom behaviors']
  },
  hooks: {
    category: 'Core Features',
    icon: '🪝',
    title: 'Hooks',
    description: 'Automate workflows with pre/post command hooks and event triggers',
    highlights: ['Event triggers', 'Custom automation', 'Workflow integration']
  },
  mcp: {
    category: 'Integration',
    icon: '🔌',
    title: 'MCP Servers',
    description: 'Extend Claude Code with Model Context Protocol servers for external tools',
    highlights: ['External tool integration', 'Custom servers', 'API connections']
  },
  'sub-agents': {
    category: 'Advanced',
    icon: '🤖',
    title: 'Sub-Agents',
    description: 'Delegate complex tasks to specialized AI agents for parallel processing',
    highlights: ['Task delegation', 'Parallel execution', 'Specialized agents']
  },
  skills: {
    category: 'Advanced',
    icon: '✨',
    title: 'Skills',
    description: 'Create reusable skill templates for common development patterns',
    highlights: ['Reusable templates', 'Custom commands', 'Workflow automation']
  },
  plugins: {
    category: 'Integration',
    icon: '🧩',
    title: 'Plugins',
    description: 'Extend functionality with community and custom plugins',
    highlights: ['Extensibility', 'Community plugins', 'Custom integrations']
  },
  'slash-commands': {
    category: 'Core Features',
    icon: '⌨️',
    title: 'Slash Commands',
    description: 'Quick actions via /commands for common development tasks',
    highlights: ['/help', '/clear', '/compact', 'Custom commands']
  },
  'common-workflows': {
    category: 'Guides',
    icon: '📋',
    title: 'Common Workflows',
    description: 'Step-by-step guides for typical development scenarios',
    highlights: ['Code review', 'Debugging', 'Refactoring', 'Testing']
  },
  'hooks-guide': {
    category: 'Guides',
    icon: '📚',
    title: 'Hooks Deep Dive',
    description: 'Advanced hook patterns and best practices for automation',
    highlights: ['Advanced patterns', 'CI/CD integration', 'Custom workflows']
  },
  headless: {
    category: 'Advanced',
    icon: '🖥️',
    title: 'Headless Mode',
    description: 'Run Claude Code in non-interactive mode for automation and CI/CD',
    highlights: ['CI/CD integration', 'Scripting', 'Batch processing']
  },
  'cli-reference': {
    category: 'Reference',
    icon: '📖',
    title: 'CLI Reference',
    description: 'Complete command-line interface reference and options',
    highlights: ['All commands', 'Flags & options', 'Examples']
  },
  troubleshooting: {
    category: 'Support',
    icon: '🔧',
    title: 'Troubleshooting',
    description: 'Common issues and solutions for Claude Code problems',
    highlights: ['Common errors', 'Debug tips', 'FAQ']
  },
  security: {
    category: 'Security',
    icon: '🔒',
    title: 'Security',
    description: 'Security model, permissions, and best practices',
    highlights: ['Permission model', 'Sandboxing', 'Best practices']
  },
  iam: {
    category: 'Security',
    icon: '👤',
    title: 'IAM & Access',
    description: 'Identity and access management for enterprise deployments',
    highlights: ['Enterprise auth', 'Team management', 'Access control']
  }
};

/**
 * Get category info for a doc
 */
export function getDocCategory(docName) {
  return DOC_CATEGORIES[docName] || { category: 'Other', icon: '📄', title: docName, description: '', highlights: [] };
}

/**
 * Get rich doc info with predefined descriptions
 */
export function getDocInfo(docName) {
  const info = DOC_CATEGORIES[docName];
  if (info) {
    return {
      ...info,
      docName
    };
  }
  // Fallback for unknown docs
  const title = docName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return {
    category: 'Other',
    icon: '📄',
    title,
    description: `Documentation for ${title}`,
    highlights: [],
    docName
  };
}

/**
 * Group changes by category
 */
export function groupChangesByCategory(summaries) {
  const grouped = {};

  for (const summary of summaries) {
    const { category, icon } = getDocCategory(summary.docName);
    if (!grouped[category]) {
      grouped[category] = { icon, changes: [] };
    }
    grouped[category].changes.push(summary);
  }

  return grouped;
}

/**
 * Generate overall summary text for email
 */
export function generateOverallSummary(summaries) {
  if (summaries.length === 0) {
    return 'No documentation changes in this sync.';
  }

  const added = summaries.filter(s => s.type === 'added');
  const modified = summaries.filter(s => s.type === 'modified');
  const removed = summaries.filter(s => s.type === 'removed');

  const parts = [];

  if (added.length > 0) {
    parts.push(`${added.length} new doc${added.length > 1 ? 's' : ''}`);
  }
  if (modified.length > 0) {
    parts.push(`${modified.length} updated`);
  }
  if (removed.length > 0) {
    parts.push(`${removed.length} removed`);
  }

  return parts.join(', ') + '.';
}

/**
 * Store previous version of content for future comparison
 */
export async function storePreviousVersion(knowledgeBasePath, docName, content) {
  const historyDir = path.join(knowledgeBasePath, 'history');
  await fs.ensureDir(historyDir);

  const historyFile = path.join(historyDir, `${docName}.prev.md`);
  await fs.writeFile(historyFile, content, 'utf-8');
}

/**
 * Load previous version of content
 */
export async function loadPreviousVersion(knowledgeBasePath, docName) {
  const historyDir = path.join(knowledgeBasePath, 'history');
  const historyFile = path.join(historyDir, `${docName}.prev.md`);

  if (await fs.pathExists(historyFile)) {
    return await fs.readFile(historyFile, 'utf-8');
  }

  return null;
}

/**
 * Process all changes and generate summaries
 */
export async function processChangesWithSummaries(changes, newDocs, existingDocs) {
  const summaries = [];

  // Process added docs
  for (const docName of changes.added) {
    const newDoc = newDocs[docName];
    if (newDoc && newDoc.content) {
      const summary = compareDocuments(null, newDoc.content, docName);
      summaries.push(summary);
    }
  }

  // Process modified docs
  for (const docName of changes.modified) {
    const newDoc = newDocs[docName];
    const oldDoc = existingDocs[docName];
    if (newDoc && newDoc.content && oldDoc && oldDoc.content) {
      const summary = compareDocuments(oldDoc.content, newDoc.content, docName);
      summaries.push(summary);
    }
  }

  // Process removed docs
  for (const docName of changes.removed) {
    const summary = compareDocuments(existingDocs[docName]?.content, null, docName);
    summaries.push(summary);
  }

  return summaries;
}
