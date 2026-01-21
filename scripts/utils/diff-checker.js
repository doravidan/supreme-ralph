/**
 * Diff Checker Utility
 * Tracks changes between knowledge base syncs
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load sync metadata
 */
export async function loadMetadata(knowledgeBasePath) {
  const metadataPath = path.join(knowledgeBasePath, 'metadata.json');
  
  if (await fs.pathExists(metadataPath)) {
    return await fs.readJson(metadataPath);
  }
  
  return {
    version: '0.0.0',
    lastSync: null,
    totalSyncs: 0,
    lastProjectSetup: null,
    docHashes: {}
  };
}

/**
 * Save sync metadata
 */
export async function saveMetadata(knowledgeBasePath, metadata) {
  const metadataPath = path.join(knowledgeBasePath, 'metadata.json');
  await fs.writeJson(metadataPath, metadata, { spaces: 2 });
}

/**
 * Load last sync info
 */
export async function loadLastSync(knowledgeBasePath) {
  const lastSyncPath = path.join(knowledgeBasePath, 'last-sync.json');
  
  if (await fs.pathExists(lastSyncPath)) {
    return await fs.readJson(lastSyncPath);
  }
  
  return null;
}

/**
 * Save last sync info
 */
export async function saveLastSync(knowledgeBasePath, syncInfo) {
  const lastSyncPath = path.join(knowledgeBasePath, 'last-sync.json');
  await fs.writeJson(lastSyncPath, syncInfo, { spaces: 2 });
}

/**
 * Record changes to changelog
 */
export async function recordChanges(knowledgeBasePath, changes) {
  const changelogDir = path.join(knowledgeBasePath, 'changelog');
  await fs.ensureDir(changelogDir);
  
  const today = new Date().toISOString().split('T')[0];
  const changelogPath = path.join(changelogDir, `${today}.json`);
  
  let existingChanges = [];
  if (await fs.pathExists(changelogPath)) {
    existingChanges = await fs.readJson(changelogPath);
  }
  
  existingChanges.push({
    timestamp: new Date().toISOString(),
    changes
  });
  
  await fs.writeJson(changelogPath, existingChanges, { spaces: 2 });
}

/**
 * Get changes since a specific date
 */
export async function getChangesSince(knowledgeBasePath, sinceDate) {
  const changelogDir = path.join(knowledgeBasePath, 'changelog');
  
  if (!await fs.pathExists(changelogDir)) {
    return [];
  }
  
  const files = await fs.readdir(changelogDir);
  const allChanges = [];
  
  for (const file of files.sort()) {
    const fileDate = path.basename(file, '.json');
    
    if (fileDate >= sinceDate) {
      const changes = await fs.readJson(path.join(changelogDir, file));
      allChanges.push(...changes);
    }
  }
  
  return allChanges;
}

/**
 * Check if there are updates since last project setup
 */
export async function hasUpdatesSinceLastSetup(knowledgeBasePath) {
  const metadata = await loadMetadata(knowledgeBasePath);
  
  if (!metadata.lastProjectSetup) {
    return { hasUpdates: false, message: 'No previous project setup recorded' };
  }
  
  const setupDate = metadata.lastProjectSetup.split('T')[0];
  const changes = await getChangesSince(knowledgeBasePath, setupDate);
  
  if (changes.length === 0) {
    return { hasUpdates: false, message: 'Knowledge base is up to date' };
  }
  
  // Summarize changes
  const summary = {
    added: [],
    modified: [],
    removed: []
  };
  
  for (const change of changes) {
    summary.added.push(...(change.changes.added || []));
    summary.modified.push(...(change.changes.modified || []));
    summary.removed.push(...(change.changes.removed || []));
  }
  
  // Deduplicate
  summary.added = [...new Set(summary.added)];
  summary.modified = [...new Set(summary.modified)];
  summary.removed = [...new Set(summary.removed)];
  
  return {
    hasUpdates: true,
    lastSetup: metadata.lastProjectSetup,
    summary,
    message: `${summary.added.length} added, ${summary.modified.length} modified, ${summary.removed.length} removed since last setup`
  };
}

/**
 * Mark a project setup event
 */
export async function markProjectSetup(knowledgeBasePath) {
  const metadata = await loadMetadata(knowledgeBasePath);
  metadata.lastProjectSetup = new Date().toISOString();
  await saveMetadata(knowledgeBasePath, metadata);
}

/**
 * Increment version based on changes
 */
export function incrementVersion(currentVersion, changes) {
  const [major, minor, patch] = currentVersion.split('.').map(Number);

  // Major: significant structural changes (rare, manual)
  // Minor: new docs added
  // Patch: modifications to existing docs

  if (changes.added.length > 0) {
    return `${major}.${minor + 1}.0`;
  } else if (changes.modified.length > 0) {
    return `${major}.${minor}.${patch + 1}`;
  }

  return currentVersion;
}

/**
 * Get changes since last email was sent
 */
export async function getChangesSinceLastEmail(knowledgeBasePath, lastEmailSent) {
  if (!lastEmailSent) {
    // Default to last 24 hours if no email has been sent
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return await getChangesSince(knowledgeBasePath, yesterday);
  }

  const emailDate = lastEmailSent.split('T')[0];
  return await getChangesSince(knowledgeBasePath, emailDate);
}
