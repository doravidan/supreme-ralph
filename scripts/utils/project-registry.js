/**
 * Project Registry Utility
 * Manages global tracking of all claude-init projects
 */

import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { ui } from './design-system.js';

// Constants
const CLAUDE_INIT_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude-init');
const REGISTRY_PATH = path.join(CLAUDE_INIT_DIR, 'projects.json');
const CONFIG_PATH = path.join(CLAUDE_INIT_DIR, 'config.json');
const OLD_CONFIG_PATH = path.join(process.env.HOME || process.env.USERPROFILE, '.claude-init-config.json');

/**
 * Generate a unique project ID
 * @returns {string} 8-character hex ID
 */
export function generateProjectId() {
  return crypto.randomBytes(4).toString('hex');
}

/**
 * Ensure the global claude-init directory exists and migrate config if needed
 */
export async function ensureGlobalDir() {
  await fs.ensureDir(CLAUDE_INIT_DIR);

  // Migrate old config if it exists
  if (await fs.pathExists(OLD_CONFIG_PATH) && !(await fs.pathExists(CONFIG_PATH))) {
    try {
      const oldConfig = await fs.readJson(OLD_CONFIG_PATH);
      await fs.writeJson(CONFIG_PATH, oldConfig, { spaces: 2 });
      await fs.remove(OLD_CONFIG_PATH);
      ui.success('Config migrated to ~/.claude-init/');
    } catch (error) {
      // Silently continue if migration fails
    }
  }
}

/**
 * Load the global config (with migration support)
 * @returns {Promise<Object>} Config data
 */
export async function loadGlobalConfig() {
  await ensureGlobalDir();

  if (await fs.pathExists(CONFIG_PATH)) {
    return await fs.readJson(CONFIG_PATH);
  }

  // Default config
  return {
    autoSync: true,
    syncInterval: 'daily',
    syncTime: '09:00',
    notifyOnUpdate: true,
    emailSummaryEnabled: false,
    emailAddress: '',
    resendApiKey: '',
    lastEmailSent: null,
    defaultProjectType: 'typescript',
    includeExamples: true
  };
}

/**
 * Save the global config
 * @param {Object} config - Config data to save
 */
export async function saveGlobalConfig(config) {
  await ensureGlobalDir();
  await fs.writeJson(CONFIG_PATH, config, { spaces: 2 });
}

/**
 * Load the global project registry
 * @returns {Promise<Object>} Registry data
 */
export async function loadRegistry() {
  await ensureGlobalDir();

  if (await fs.pathExists(REGISTRY_PATH)) {
    return await fs.readJson(REGISTRY_PATH);
  }

  return createEmptyRegistry();
}

/**
 * Create an empty registry structure
 * @returns {Object} Empty registry
 */
function createEmptyRegistry() {
  return {
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    projects: {},
    statistics: {
      totalProjects: 0,
      activeProjects: 0,
      archivedProjects: 0,
      languageDistribution: {},
      frameworkDistribution: {}
    }
  };
}

/**
 * Save the global project registry
 * @param {Object} registry - Registry data to save
 */
export async function saveRegistry(registry) {
  await ensureGlobalDir();
  registry.updatedAt = new Date().toISOString();
  await fs.writeJson(REGISTRY_PATH, registry, { spaces: 2 });
}

/**
 * Register a new project or update existing
 * @param {Object} projectConfig - Project configuration from setup
 * @returns {Promise<Object>} { project, isNew }
 */
export async function registerProject(projectConfig) {
  const registry = await loadRegistry();
  const projectPath = path.resolve(projectConfig.targetPath);

  const isNew = !registry.projects[projectPath];
  const existingProject = registry.projects[projectPath] || {};

  const project = {
    id: existingProject.id || generateProjectId(),
    name: projectConfig.projectName || path.basename(projectPath),
    description: projectConfig.projectDescription || '',
    path: projectPath,
    language: projectConfig.language || 'unknown',
    framework: projectConfig.framework || 'none',
    registeredAt: existingProject.registeredAt || new Date().toISOString(),
    lastSetup: new Date().toISOString(),
    setupCount: (existingProject.setupCount || 0) + 1,
    status: 'active',
    config: {
      setupHooks: projectConfig.setupHooks !== false,
      setupAgents: projectConfig.setupAgents !== false,
      setupCommands: projectConfig.setupCommands !== false,
      setupRules: projectConfig.setupRules !== false,
      setupSkills: projectConfig.setupSkills !== false
    }
  };

  registry.projects[projectPath] = project;
  updateStatistics(registry);
  await saveRegistry(registry);

  // Create local metadata file in project with detailed setup info
  await createLocalMetadata(projectPath, project, projectConfig.kbVersion, {
    setupRules: projectConfig.setupRules,
    setupCommands: projectConfig.setupCommands,
    setupAgents: projectConfig.setupAgents,
    setupSkills: projectConfig.setupSkills,
    setupHooks: projectConfig.setupHooks,
    language: projectConfig.language
  });

  return { project, isNew };
}

/**
 * Create local metadata file in the project's .claude directory
 * @param {string} projectPath - Path to the project
 * @param {Object} project - Project data
 * @param {string} kbVersion - Knowledge base version
 * @param {Object} setupDetails - Details about what was set up
 */
async function createLocalMetadata(projectPath, project, kbVersion, setupDetails = {}) {
  const metadataPath = path.join(projectPath, '.claude', 'metadata.json');

  let existingMetadata = {};
  if (await fs.pathExists(metadataPath)) {
    existingMetadata = await fs.readJson(metadataPath);
  }

  const isInitial = project.setupCount === 1;

  // Build detailed change list
  const changes = [];
  if (isInitial) {
    changes.push({ type: 'created', item: 'CLAUDE.md', description: 'Project documentation' });
    changes.push({ type: 'created', item: 'settings.json', description: 'Claude Code settings' });
  } else {
    changes.push({ type: 'updated', item: 'Configuration', description: 'Settings refreshed' });
  }

  if (setupDetails.setupRules) {
    changes.push({
      type: isInitial ? 'created' : 'updated',
      item: 'Rules',
      description: `${setupDetails.language || 'Code'} style, security, testing rules`
    });
  }
  if (setupDetails.setupCommands) {
    changes.push({
      type: isInitial ? 'created' : 'updated',
      item: 'Commands',
      description: 'Review, test, deploy slash commands'
    });
  }
  if (setupDetails.setupAgents) {
    changes.push({
      type: isInitial ? 'created' : 'updated',
      item: 'Agents',
      description: 'Code reviewer, debugger, researcher agents'
    });
  }
  if (setupDetails.setupSkills) {
    changes.push({
      type: isInitial ? 'created' : 'updated',
      item: 'Skills',
      description: 'Reusable skill templates'
    });
  }
  if (setupDetails.setupHooks) {
    changes.push({
      type: isInitial ? 'created' : 'updated',
      item: 'Hooks',
      description: 'Pre/post command automation'
    });
  }

  const metadata = {
    claudeInitVersion: '1.0.0',
    projectId: project.id,
    initializedAt: existingMetadata.initializedAt || new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    knowledgeBaseVersion: kbVersion || existingMetadata.knowledgeBaseVersion || '',
    syncedFromKb: new Date().toISOString(),
    setupHistory: existingMetadata.setupHistory || []
  };

  // Add new setup entry with detailed changes
  metadata.setupHistory.push({
    timestamp: new Date().toISOString(),
    kbVersion: kbVersion || '',
    setupType: isInitial ? 'initial' : 'update',
    changes
  });

  // Keep only last 20 setup entries
  if (metadata.setupHistory.length > 20) {
    metadata.setupHistory = metadata.setupHistory.slice(-20);
  }

  await fs.ensureDir(path.dirname(metadataPath));
  await fs.writeJson(metadataPath, metadata, { spaces: 2 });
}

/**
 * Remove a project from the registry
 * @param {string} projectPath - Path to the project
 * @returns {Promise<boolean>} Success status
 */
export async function unregisterProject(projectPath) {
  const registry = await loadRegistry();
  const resolvedPath = path.resolve(projectPath);

  if (!registry.projects[resolvedPath]) {
    return false;
  }

  delete registry.projects[resolvedPath];
  updateStatistics(registry);
  await saveRegistry(registry);

  return true;
}

/**
 * Archive a project (mark inactive but keep in registry)
 * @param {string} projectPath - Path to the project
 * @returns {Promise<boolean>} Success status
 */
export async function archiveProject(projectPath) {
  const registry = await loadRegistry();
  const resolvedPath = path.resolve(projectPath);

  if (registry.projects[resolvedPath]) {
    registry.projects[resolvedPath].status = 'archived';
    updateStatistics(registry);
    await saveRegistry(registry);
    return true;
  }

  return false;
}

/**
 * Restore an archived project
 * @param {string} projectPath - Path to the project
 * @returns {Promise<boolean>} Success status
 */
export async function restoreProject(projectPath) {
  const registry = await loadRegistry();
  const resolvedPath = path.resolve(projectPath);

  if (registry.projects[resolvedPath]) {
    registry.projects[resolvedPath].status = 'active';
    updateStatistics(registry);
    await saveRegistry(registry);
    return true;
  }

  return false;
}

/**
 * Get all registered projects
 * @param {Object} filters - Optional filters { status, language, framework }
 * @returns {Promise<Array>} Array of project objects
 */
export async function getProjects(filters = {}) {
  const registry = await loadRegistry();
  let projects = Object.values(registry.projects);

  if (filters.status) {
    projects = projects.filter(p => p.status === filters.status);
  }
  if (filters.language) {
    projects = projects.filter(p => p.language === filters.language);
  }
  if (filters.framework) {
    projects = projects.filter(p => p.framework === filters.framework);
  }

  // Sort by lastSetup date, most recent first
  projects.sort((a, b) => new Date(b.lastSetup) - new Date(a.lastSetup));

  return projects;
}

/**
 * Get a single project by path
 * @param {string} projectPath - Path to the project
 * @returns {Promise<Object|null>} Project data or null
 */
export async function getProject(projectPath) {
  const registry = await loadRegistry();
  return registry.projects[path.resolve(projectPath)] || null;
}

/**
 * Get registry statistics
 * @returns {Promise<Object>} Statistics object
 */
export async function getStatistics() {
  const registry = await loadRegistry();
  return registry.statistics;
}

/**
 * Check if a project path exists on the filesystem
 * @param {string} projectPath - Path to check
 * @returns {Promise<boolean>} Whether .claude directory exists
 */
export async function validateProjectPath(projectPath) {
  const claudeDir = path.join(projectPath, '.claude');
  return await fs.pathExists(claudeDir);
}

/**
 * Validate all projects in registry and update status
 * @returns {Promise<Object>} Validation results { valid, missing, orphaned }
 */
export async function validateAllProjects() {
  const registry = await loadRegistry();
  const results = {
    valid: [],
    missing: [],
    orphaned: []
  };

  for (const [projectPath, project] of Object.entries(registry.projects)) {
    const exists = await validateProjectPath(projectPath);

    if (exists) {
      results.valid.push(project);
    } else {
      results.missing.push(project);
      // Mark as orphaned
      project.status = 'orphaned';
    }
  }

  await saveRegistry(registry);
  return results;
}

/**
 * Update registry statistics
 * @param {Object} registry - Registry object to update
 */
function updateStatistics(registry) {
  const projects = Object.values(registry.projects);

  registry.statistics = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'active').length,
    archivedProjects: projects.filter(p => p.status === 'archived').length,
    orphanedProjects: projects.filter(p => p.status === 'orphaned').length,
    languageDistribution: {},
    frameworkDistribution: {}
  };

  for (const project of projects) {
    // Language distribution
    const lang = project.language || 'unknown';
    registry.statistics.languageDistribution[lang] =
      (registry.statistics.languageDistribution[lang] || 0) + 1;

    // Framework distribution
    const fw = project.framework || 'none';
    registry.statistics.frameworkDistribution[fw] =
      (registry.statistics.frameworkDistribution[fw] || 0) + 1;
  }
}

/**
 * Collect status from all active projects for email summary
 * @returns {Promise<Array>} Array of project status objects
 */
export async function collectProjectStatuses() {
  const projects = await getProjects({ status: 'active' });
  const statuses = [];

  for (const project of projects) {
    const status = {
      ...project,
      exists: await validateProjectPath(project.path),
      localMetadata: null,
      needsUpdate: false
    };

    // Try to load local metadata
    const metadataPath = path.join(project.path, '.claude', 'metadata.json');
    if (await fs.pathExists(metadataPath)) {
      try {
        status.localMetadata = await fs.readJson(metadataPath);
      } catch (e) {
        // Ignore read errors
      }
    }

    statuses.push(status);
  }

  return statuses;
}

/**
 * Get the global config directory path
 * @returns {string} Path to ~/.claude-init/
 */
export function getGlobalConfigDir() {
  return CLAUDE_INIT_DIR;
}

/**
 * Get the registry file path
 * @returns {string} Path to projects.json
 */
export function getRegistryPath() {
  return REGISTRY_PATH;
}

/**
 * Get the config file path
 * @returns {string} Path to config.json
 */
export function getConfigPath() {
  return CONFIG_PATH;
}
