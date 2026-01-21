/**
 * Template Writer Module
 *
 * Generic template writing functions that unify the repetitive
 * writeRules/writeCommands/writeAgents/writeSkills patterns.
 *
 * @module setup/template-writer
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { ui } from '../utils/design-system.js';
import {
  generateRule,
  generateCommand,
  generateAgent,
  generateSkill
} from '../utils/template-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Template type configurations
 * Maps template types to their generator functions and output patterns
 */
const TEMPLATE_TYPES = {
  rules: {
    generator: generateRule,
    outputPattern: (name) => `${name}.md`,
    displayName: 'rules',
    defaultItems: ['code-style', 'security', 'testing', 'documentation']
  },
  commands: {
    generator: generateCommand,
    outputPattern: (name) => `${name}.md`,
    displayName: 'commands',
    defaultItems: ['review', 'test', 'commit', 'deploy']
  },
  agents: {
    generator: generateAgent,
    outputPattern: (name) => `${name}.md`,
    displayName: 'agents',
    defaultItems: ['code-reviewer', 'debugger', 'researcher']
  },
  skills: {
    generator: generateSkill,
    outputPattern: (name) => path.join(name, 'SKILL.md'),
    displayName: 'skills',
    defaultItems: ['code-review'],
    needsSubdir: true
  }
};

/**
 * Build template variables from config based on template type
 *
 * @param {string} type - Template type (rules, commands, agents, skills)
 * @param {object} config - Project configuration
 * @returns {object} Template variables
 */
export function buildTemplateVariables(type, config) {
  const baseVars = {
    language: config.language || 'typescript'
  };

  switch (type) {
    case 'rules':
      return {
        ...baseVars,
        indentation: config.language === 'python' ? '4 spaces' : '2 spaces',
        hasTypeScript: config.language === 'typescript' || config.language === 'javascript',
        hasPython: config.language === 'python'
      };

    case 'commands':
      return {
        ...baseVars,
        testCommand: config.testCommand || 'npm test',
        buildCommand: config.buildCommand || 'npm run build',
        lintCommand: config.lintCommand || 'npm run lint'
      };

    case 'agents':
    case 'skills':
      return baseVars;

    default:
      return baseVars;
  }
}

/**
 * Write a single template file
 *
 * @param {string} targetDir - Target directory
 * @param {string} name - Template name
 * @param {Function} generator - Template generator function
 * @param {object} variables - Template variables
 * @param {object} options - Additional options
 * @returns {Promise<{success: boolean, path: string, error?: string}>}
 */
async function writeTemplate(targetDir, name, generator, variables, options = {}) {
  const { outputPattern, displayName, needsSubdir } = options;

  try {
    // Generate content
    const content = await generator(name, variables);

    // Determine output path
    const outputFile = outputPattern ? outputPattern(name) : `${name}.md`;
    const outputPath = path.join(targetDir, outputFile);

    // Create subdirectory if needed (e.g., for skills)
    if (needsSubdir) {
      const subdir = path.dirname(outputPath);
      await fs.ensureDir(subdir);
    }

    // Write file
    await fs.writeFile(outputPath, content, 'utf-8');

    // Report success
    const relativePath = `${displayName}/${outputFile}`;
    ui.successText(`  ${ui.icons.success} Created ${relativePath}`);

    return { success: true, path: outputPath };
  } catch (error) {
    // Report failure
    const relativePath = `${displayName}/${name}.md`;
    ui.warningText(`  ${ui.icons.warning} Could not create ${relativePath}: ${error.message}`);

    return { success: false, path: null, error: error.message };
  }
}

/**
 * Write multiple templates of a specific type
 *
 * @param {string} type - Template type (rules, commands, agents, skills)
 * @param {string} targetDir - Target directory for this type
 * @param {object} config - Project configuration
 * @param {string[]} [items] - List of template names to write (uses defaults if not provided)
 * @returns {Promise<{written: string[], failed: string[]}>}
 */
export async function writeTemplates(type, targetDir, config, items = null) {
  const typeConfig = TEMPLATE_TYPES[type];

  if (!typeConfig) {
    throw new Error(`Unknown template type: ${type}`);
  }

  const templateNames = items || typeConfig.defaultItems;
  const variables = buildTemplateVariables(type, config);

  const results = {
    written: [],
    failed: []
  };

  for (const name of templateNames) {
    const result = await writeTemplate(targetDir, name, typeConfig.generator, variables, {
      outputPattern: typeConfig.outputPattern,
      displayName: typeConfig.displayName,
      needsSubdir: typeConfig.needsSubdir
    });

    if (result.success) {
      results.written.push(name);
    } else {
      results.failed.push(name);
    }
  }

  return results;
}

/**
 * Write rules to the .claude/rules directory
 *
 * @param {string} claudeDir - Path to .claude directory
 * @param {object} config - Project configuration
 * @param {string[]} [rules] - Specific rules to write
 * @returns {Promise<{written: string[], failed: string[]}>}
 */
export async function writeRules(claudeDir, config, rules = null) {
  const rulesDir = path.join(claudeDir, 'rules');
  return writeTemplates('rules', rulesDir, config, rules);
}

/**
 * Write commands to the .claude/commands directory
 *
 * @param {string} claudeDir - Path to .claude directory
 * @param {object} config - Project configuration
 * @param {string[]} [commands] - Specific commands to write
 * @returns {Promise<{written: string[], failed: string[]}>}
 */
export async function writeCommands(claudeDir, config, commands = null) {
  const commandsDir = path.join(claudeDir, 'commands');
  return writeTemplates('commands', commandsDir, config, commands);
}

/**
 * Write agents to the .claude/agents directory
 *
 * @param {string} claudeDir - Path to .claude directory
 * @param {object} config - Project configuration
 * @param {string[]} [agents] - Specific agents to write
 * @returns {Promise<{written: string[], failed: string[]}>}
 */
export async function writeAgents(claudeDir, config, agents = null) {
  const agentsDir = path.join(claudeDir, 'agents');
  return writeTemplates('agents', agentsDir, config, agents);
}

/**
 * Write skills to the .claude/skills directory
 *
 * @param {string} claudeDir - Path to .claude directory
 * @param {object} config - Project configuration
 * @param {string[]} [skills] - Specific skills to write
 * @returns {Promise<{written: string[], failed: string[]}>}
 */
export async function writeSkills(claudeDir, config, skills = null) {
  const skillsDir = path.join(claudeDir, 'skills');
  return writeTemplates('skills', skillsDir, config, skills);
}

/**
 * Get available template types
 *
 * @returns {string[]} List of available template types
 */
export function getAvailableTypes() {
  return Object.keys(TEMPLATE_TYPES);
}

/**
 * Get default items for a template type
 *
 * @param {string} type - Template type
 * @returns {string[]} Default items for the type
 */
export function getDefaultItems(type) {
  const typeConfig = TEMPLATE_TYPES[type];
  return typeConfig ? [...typeConfig.defaultItems] : [];
}

export default {
  writeTemplates,
  writeRules,
  writeCommands,
  writeAgents,
  writeSkills,
  buildTemplateVariables,
  getAvailableTypes,
  getDefaultItems
};
