/**
 * Template Generator Utility
 * Generates customized templates based on project configuration
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';
import { render as renderTemplate, TemplateEngine } from './template-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_DIR = path.join(__dirname, '..', '..', 'templates');

// Create a non-strict engine for legacy compatibility (warns but doesn't throw)
const legacyEngine = new TemplateEngine({ strictMode: false, warnOnMissing: false });

/**
 * Load a template file
 */
export async function loadTemplate(templatePath) {
  const fullPath = path.join(TEMPLATE_DIR, templatePath);

  if (!await fs.pathExists(fullPath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  return await fs.readFile(fullPath, 'utf-8');
}

/**
 * Apply variables to a template
 * Uses the new template engine while maintaining backward compatibility
 */
export function applyVariables(template, variables) {
  // Handle {{#unless variable}} for backward compatibility (convert to {{#if !variable}})
  let processed = template.replace(
    /\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g,
    (match, varName, content) => {
      // Create negated variable
      const negatedKey = `_not_${varName}`;
      variables[negatedKey] = !variables[varName];
      return `{{#if ${negatedKey}}}${content}{{/if}}`;
    }
  );

  return legacyEngine.render(processed, variables);
}

/**
 * Generate CLAUDE.md for a project
 */
export async function generateClaudeMd(config) {
  const template = await loadTemplate('CLAUDE.md.template');
  
  const variables = {
    projectName: config.projectName || 'My Project',
    projectDescription: config.projectDescription || 'A software project',
    techStack: config.techStack || 'Not specified',
    buildCommand: config.buildCommand || 'npm run build',
    testCommand: config.testCommand || 'npm test',
    lintCommand: config.lintCommand || 'npm run lint',
    devCommand: config.devCommand || 'npm run dev',
    hasTypeScript: config.language === 'typescript',
    hasPython: config.language === 'python',
    hasReact: config.framework === 'react',
    hasDocker: config.hasDocker || false,
    hasDatabase: config.hasDatabase || false,
    databaseType: config.databaseType || 'PostgreSQL',
    includeSecuritySection: config.includeSecuritySection !== false,
    includePerformanceSection: config.includePerformanceSection !== false,
    customInstructions: config.customInstructions || ''
  };
  
  return applyVariables(template, variables);
}

/**
 * Generate settings.json for a project
 */
export async function generateSettings(config) {
  const template = await loadTemplate('settings/settings.json.template');
  
  const settings = {
    permissions: {
      allow: config.allowedTools || [],
      deny: config.deniedTools || ['Read(.env)', 'Read(.env.*)', 'Read(./secrets/**)'],
      defaultMode: config.defaultPermissionMode || 'default'
    },
    env: config.envVariables || {}
  };
  
  if (config.hooks) {
    settings.hooks = config.hooks;
  }
  
  return JSON.stringify(settings, null, 2);
}

/**
 * Generate a rule file
 */
export async function generateRule(ruleName, config) {
  const template = await loadTemplate(`rules/${ruleName}.md.template`);
  return applyVariables(template, config);
}

/**
 * Generate a command file
 */
export async function generateCommand(commandName, config) {
  const template = await loadTemplate(`commands/${commandName}.md.template`);
  return applyVariables(template, config);
}

/**
 * Generate an agent file
 */
export async function generateAgent(agentName, config) {
  const template = await loadTemplate(`agents/${agentName}.md.template`);
  return applyVariables(template, config);
}

/**
 * Generate a skill
 */
export async function generateSkill(skillName, config) {
  const skillDir = `skills/${skillName}`;
  const template = await loadTemplate(`${skillDir}/SKILL.md.template`);
  return applyVariables(template, config);
}

/**
 * Generate MCP configuration
 */
export async function generateMcpConfig(config) {
  const mcpConfig = {
    mcpServers: {}
  };
  
  if (config.includeGitHub) {
    mcpConfig.mcpServers.github = {
      type: 'http',
      url: 'https://api.githubcopilot.com/mcp/'
    };
  }
  
  if (config.includeDatabase && config.databaseConfig) {
    mcpConfig.mcpServers.database = {
      type: 'stdio',
      command: 'npx',
      args: ['-y', '@bytebase/dbhub', '--dsn', config.databaseConfig.dsn || '']
    };
  }
  
  if (config.customMcpServers) {
    Object.assign(mcpConfig.mcpServers, config.customMcpServers);
  }
  
  return JSON.stringify(mcpConfig, null, 2);
}

/**
 * Generate hooks configuration
 */
export async function generateHooksConfig(config) {
  const hooks = {
    hooks: {}
  };
  
  if (config.lintOnSave) {
    hooks.hooks.PostToolUse = hooks.hooks.PostToolUse || [];
    hooks.hooks.PostToolUse.push({
      matcher: 'Write|Edit',
      hooks: [{
        type: 'command',
        command: config.lintCommand || 'npm run lint:fix'
      }]
    });
  }
  
  if (config.formatOnSave) {
    hooks.hooks.PostToolUse = hooks.hooks.PostToolUse || [];
    hooks.hooks.PostToolUse.push({
      matcher: 'Write|Edit',
      hooks: [{
        type: 'command',
        command: config.formatCommand || 'npm run format'
      }]
    });
  }
  
  if (config.validateBashCommands) {
    hooks.hooks.PreToolUse = hooks.hooks.PreToolUse || [];
    hooks.hooks.PreToolUse.push({
      matcher: 'Bash',
      hooks: [{
        type: 'command',
        command: '${CLAUDE_PROJECT_DIR}/.claude/hooks/validate-bash.sh'
      }]
    });
  }

  // Auto-compact hook - monitors context usage and warns at threshold
  if (config.autoCompact !== false) {
    const threshold = config.compactThreshold || 70;
    hooks.hooks.Stop = hooks.hooks.Stop || [];
    hooks.hooks.Stop.push({
      matcher: '.*',
      hooks: [{
        type: 'command',
        command: `COMPACT_THRESHOLD=${threshold} \${CLAUDE_PROJECT_DIR}/.claude/hooks/auto-compact.sh`,
        timeout: 5
      }]
    });
  }

  return JSON.stringify(hooks, null, 2);
}

/**
 * List all available templates
 */
export async function listTemplates() {
  const templates = {
    main: [],
    settings: [],
    rules: [],
    commands: [],
    agents: [],
    skills: [],
    hooks: [],
    mcp: []
  };
  
  // Main templates
  const mainFiles = await fs.readdir(TEMPLATE_DIR);
  templates.main = mainFiles.filter(f => f.endsWith('.template'));
  
  // Subdirectories
  for (const subdir of ['settings', 'rules', 'commands', 'agents', 'skills', 'hooks', 'mcp']) {
    const subdirPath = path.join(TEMPLATE_DIR, subdir);
    if (await fs.pathExists(subdirPath)) {
      const files = await fs.readdir(subdirPath, { recursive: true });
      templates[subdir] = files.filter(f => f.endsWith('.template') || f.endsWith('.md.template'));
    }
  }
  
  return templates;
}

/**
 * Validate a template file
 */
export async function validateTemplate(templatePath) {
  const errors = [];
  const warnings = [];
  
  try {
    const content = await loadTemplate(templatePath);
    
    // Check for unclosed template blocks
    const openIfs = (content.match(/\{\{#if/g) || []).length;
    const closeIfs = (content.match(/\{\{\/if\}\}/g) || []).length;
    if (openIfs !== closeIfs) {
      errors.push(`Mismatched {{#if}} blocks: ${openIfs} opens, ${closeIfs} closes`);
    }
    
    // Check for undefined variables (variables not in common set)
    const commonVars = ['projectName', 'projectDescription', 'techStack', 'buildCommand', 
                       'testCommand', 'lintCommand', 'devCommand', 'language', 'framework'];
    const usedVars = content.match(/\{\{\s*(\w+)\s*\}\}/g) || [];
    for (const match of usedVars) {
      const varName = match.replace(/\{\{\s*|\s*\}\}/g, '');
      if (!commonVars.includes(varName) && !varName.startsWith('#') && !varName.startsWith('/')) {
        warnings.push(`Custom variable used: ${varName}`);
      }
    }
    
    return { valid: errors.length === 0, errors, warnings };
  } catch (error) {
    return { valid: false, errors: [error.message], warnings: [] };
  }
}
