import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface ProjectConfig {
  hasClaudeConfig: boolean;
  hasClaudeMd: boolean;
  hasSettings: boolean;
  hasRules: boolean;
  hasCommands: boolean;
  hasAgents: boolean;
  hasHooks: boolean;
  claudeDir: string | null;
}

/**
 * Check if the workspace has Claude Code configuration
 */
export function getProjectConfig(): ProjectConfig {
  const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  const config: ProjectConfig = {
    hasClaudeConfig: false,
    hasClaudeMd: false,
    hasSettings: false,
    hasRules: false,
    hasCommands: false,
    hasAgents: false,
    hasHooks: false,
    claudeDir: null
  };

  if (!workspacePath) {
    return config;
  }

  const claudeDir = path.join(workspacePath, '.claude');
  const claudeMd = path.join(workspacePath, 'CLAUDE.md');

  config.claudeDir = claudeDir;
  config.hasClaudeMd = fs.existsSync(claudeMd);
  config.hasClaudeConfig = fs.existsSync(claudeDir);

  if (config.hasClaudeConfig) {
    config.hasSettings = fs.existsSync(path.join(claudeDir, 'settings.json'));
    config.hasRules = fs.existsSync(path.join(claudeDir, 'rules')) &&
      fs.readdirSync(path.join(claudeDir, 'rules')).length > 0;
    config.hasCommands = fs.existsSync(path.join(claudeDir, 'commands')) &&
      fs.readdirSync(path.join(claudeDir, 'commands')).length > 0;
    config.hasAgents = fs.existsSync(path.join(claudeDir, 'agents')) &&
      fs.readdirSync(path.join(claudeDir, 'agents')).length > 0;
    config.hasHooks = fs.existsSync(path.join(claudeDir, 'hooks', 'hooks.json'));
  }

  return config;
}

/**
 * Read the CLAUDE.md file content
 */
export function readClaudeMd(): string | null {
  const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspacePath) {
    return null;
  }

  const claudeMdPath = path.join(workspacePath, 'CLAUDE.md');
  if (!fs.existsSync(claudeMdPath)) {
    return null;
  }

  return fs.readFileSync(claudeMdPath, 'utf-8');
}

/**
 * Read settings.json
 */
export function readSettings(): Record<string, unknown> | null {
  const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspacePath) {
    return null;
  }

  const settingsPath = path.join(workspacePath, '.claude', 'settings.json');
  if (!fs.existsSync(settingsPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(settingsPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * List files in a Claude subdirectory
 */
export function listClaudeFiles(subdir: string): string[] {
  const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspacePath) {
    return [];
  }

  const dirPath = path.join(workspacePath, '.claude', subdir);
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  try {
    return fs.readdirSync(dirPath).filter(f => !f.startsWith('.'));
  } catch {
    return [];
  }
}

/**
 * Get the templates directory path
 */
export function getTemplatesPath(): string {
  // Relative to extension, up to parent project's templates
  return path.join(__dirname, '..', '..', '..', 'templates');
}

/**
 * List available templates
 */
export function listTemplates(): Record<string, string[]> {
  const templatesPath = getTemplatesPath();
  const templates: Record<string, string[]> = {
    main: [],
    rules: [],
    commands: [],
    agents: [],
    skills: [],
    hooks: []
  };

  if (!fs.existsSync(templatesPath)) {
    return templates;
  }

  try {
    // Main templates
    const mainFiles = fs.readdirSync(templatesPath);
    templates.main = mainFiles.filter(f => f.endsWith('.template'));

    // Subdirectories
    const subdirs = ['rules', 'commands', 'agents', 'skills', 'hooks'];
    for (const subdir of subdirs) {
      const subdirPath = path.join(templatesPath, subdir);
      if (fs.existsSync(subdirPath)) {
        templates[subdir] = fs.readdirSync(subdirPath)
          .filter(f => f.endsWith('.template') || f.endsWith('.md.template'));
      }
    }
  } catch {
    // Ignore errors
  }

  return templates;
}
