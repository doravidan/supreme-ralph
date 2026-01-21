/**
 * Documentation Fetcher Utility
 * Fetches and parses documentation from official Anthropic sources
 */

import fetch from 'node-fetch';
import TurndownService from 'turndown';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

// Official Claude Code documentation URLs
const DOC_SOURCES = {
  overview: 'https://docs.anthropic.com/en/docs/claude-code/overview',
  quickstart: 'https://docs.anthropic.com/en/docs/claude-code/quickstart',
  memory: 'https://docs.anthropic.com/en/docs/claude-code/memory',
  settings: 'https://docs.anthropic.com/en/docs/claude-code/settings',
  hooks: 'https://docs.anthropic.com/en/docs/claude-code/hooks',
  mcp: 'https://docs.anthropic.com/en/docs/claude-code/mcp',
  'sub-agents': 'https://docs.anthropic.com/en/docs/claude-code/sub-agents',
  skills: 'https://docs.anthropic.com/en/docs/claude-code/skills',
  plugins: 'https://docs.anthropic.com/en/docs/claude-code/plugins',
  'slash-commands': 'https://docs.anthropic.com/en/docs/claude-code/slash-commands',
  'common-workflows': 'https://docs.anthropic.com/en/docs/claude-code/common-workflows',
  'hooks-guide': 'https://docs.anthropic.com/en/docs/claude-code/hooks-guide',
  headless: 'https://docs.anthropic.com/en/docs/claude-code/headless',
  'cli-reference': 'https://docs.anthropic.com/en/docs/claude-code/cli-reference',
  troubleshooting: 'https://docs.anthropic.com/en/docs/claude-code/troubleshooting',
  security: 'https://docs.anthropic.com/en/docs/claude-code/security',
  iam: 'https://docs.anthropic.com/en/docs/claude-code/iam'
};

/**
 * Calculate MD5 hash of content for change detection
 */
export function calculateHash(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Fetch a single documentation page
 */
export async function fetchDoc(name, url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Claude-Code-Project-Init/1.0',
        'Accept': 'text/html,application/xhtml+xml'
      },
      timeout: 30000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Extract main content from HTML
    const contentMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
                        html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                        html.match(/<div[^>]*id="content"[^>]*>([\s\S]*?)<\/div>/i);
    
    let content = contentMatch ? contentMatch[1] : html;
    
    // Convert HTML to Markdown
    const markdown = turndownService.turndown(content);
    
    // Clean up the markdown
    const cleanedMarkdown = markdown
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s+|\s+$/g, '')
      .trim();

    return {
      name,
      url,
      content: cleanedMarkdown,
      hash: calculateHash(cleanedMarkdown),
      fetchedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Failed to fetch ${name} from ${url}:`, error.message);
    return {
      name,
      url,
      content: null,
      error: error.message,
      fetchedAt: new Date().toISOString()
    };
  }
}

/**
 * Fetch all documentation
 */
export async function fetchAllDocs() {
  const results = {};
  const errors = [];

  console.log(`Fetching ${Object.keys(DOC_SOURCES).length} documentation pages...`);

  for (const [name, url] of Object.entries(DOC_SOURCES)) {
    console.log(`  Fetching: ${name}...`);
    const doc = await fetchDoc(name, url);
    
    if (doc.error) {
      errors.push({ name, error: doc.error });
    } else {
      results[name] = doc;
    }
    
    // Rate limiting - wait 500ms between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return { docs: results, errors };
}

/**
 * Save fetched docs to knowledge base
 */
export async function saveDocs(docs, knowledgeBasePath) {
  const docsDir = path.join(knowledgeBasePath, 'docs');
  await fs.ensureDir(docsDir);

  for (const [name, doc] of Object.entries(docs)) {
    if (doc.content) {
      const filePath = path.join(docsDir, `${name}.md`);
      
      // Add metadata header
      const fileContent = `---
source: ${doc.url}
fetched: ${doc.fetchedAt}
hash: ${doc.hash}
---

${doc.content}`;
      
      await fs.writeFile(filePath, fileContent, 'utf-8');
    }
  }
}

/**
 * Load existing docs from knowledge base
 */
export async function loadExistingDocs(knowledgeBasePath) {
  const docsDir = path.join(knowledgeBasePath, 'docs');
  const existing = {};

  if (!await fs.pathExists(docsDir)) {
    return existing;
  }

  const files = await fs.readdir(docsDir);
  
  for (const file of files) {
    if (file.endsWith('.md')) {
      const name = path.basename(file, '.md');
      const content = await fs.readFile(path.join(docsDir, file), 'utf-8');
      
      // Extract hash from frontmatter
      const hashMatch = content.match(/^---[\s\S]*?hash:\s*([a-f0-9]+)[\s\S]*?---/);
      const hash = hashMatch ? hashMatch[1] : null;
      
      existing[name] = {
        name,
        hash,
        content: content.replace(/^---[\s\S]*?---\n\n/, '')
      };
    }
  }

  return existing;
}

/**
 * Compare new docs with existing and detect changes
 */
export function detectChanges(newDocs, existingDocs) {
  const changes = {
    added: [],
    modified: [],
    removed: [],
    unchanged: []
  };

  // Check for added and modified
  for (const [name, doc] of Object.entries(newDocs)) {
    if (!existingDocs[name]) {
      changes.added.push(name);
    } else if (existingDocs[name].hash !== doc.hash) {
      changes.modified.push(name);
    } else {
      changes.unchanged.push(name);
    }
  }

  // Check for removed
  for (const name of Object.keys(existingDocs)) {
    if (!newDocs[name]) {
      changes.removed.push(name);
    }
  }

  return changes;
}

export { DOC_SOURCES };
