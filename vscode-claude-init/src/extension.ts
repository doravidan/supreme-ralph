import * as vscode from 'vscode';
import { setupProjectCommand, quickSetupCommand } from './commands/setupProject';
import {
  syncKnowledgeCommand,
  checkUpdatesCommand,
  viewChangesCommand,
  validateTemplatesCommand
} from './commands/syncKnowledge';
import { ProjectStatusProvider } from './views/ProjectStatusProvider';
import { TemplatesProvider } from './views/TemplatesProvider';
import { ActionsProvider } from './views/ActionsProvider';
import { SetupWizardPanel } from './panels/SetupWizardPanel';

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  console.log('Claude Code Initializer extension is now active!');

  // Create view providers
  const projectStatusProvider = new ProjectStatusProvider();
  const templatesProvider = new TemplatesProvider();
  const actionsProvider = new ActionsProvider();

  // Register tree view providers
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('claudeInit.projectStatus', projectStatusProvider),
    vscode.window.registerTreeDataProvider('claudeInit.templates', templatesProvider),
    vscode.window.registerTreeDataProvider('claudeInit.actions', actionsProvider)
  );

  // Register commands
  context.subscriptions.push(
    // Setup commands
    vscode.commands.registerCommand('claudeInit.setupProject', setupProjectCommand),
    vscode.commands.registerCommand('claudeInit.quickSetup', quickSetupCommand),

    // Wizard command
    vscode.commands.registerCommand('claudeInit.openWizard', () => {
      SetupWizardPanel.createOrShow(context.extensionUri);
    }),

    // Knowledge base commands
    vscode.commands.registerCommand('claudeInit.syncKnowledge', syncKnowledgeCommand),
    vscode.commands.registerCommand('claudeInit.checkUpdates', checkUpdatesCommand),
    vscode.commands.registerCommand('claudeInit.viewChanges', viewChangesCommand),
    vscode.commands.registerCommand('claudeInit.validateTemplates', validateTemplatesCommand),

    // Refresh command
    vscode.commands.registerCommand('claudeInit.refreshViews', () => {
      projectStatusProvider.refresh();
      templatesProvider.refresh();
      actionsProvider.refresh();
    })
  );

  // Create status bar item
  const config = vscode.workspace.getConfiguration('claudeInit');
  if (config.get<boolean>('showStatusBar', true)) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'claudeInit.setupProject';
    statusBarItem.text = '$(hubot) Claude Code';
    statusBarItem.tooltip = 'Claude Code Project Initializer';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
  }

  // Watch for file changes to refresh views
  const fileWatcher = vscode.workspace.createFileSystemWatcher('**/.claude/**');
  fileWatcher.onDidChange(() => projectStatusProvider.refresh());
  fileWatcher.onDidCreate(() => projectStatusProvider.refresh());
  fileWatcher.onDidDelete(() => projectStatusProvider.refresh());
  context.subscriptions.push(fileWatcher);

  const claudeMdWatcher = vscode.workspace.createFileSystemWatcher('**/CLAUDE.md');
  claudeMdWatcher.onDidChange(() => projectStatusProvider.refresh());
  claudeMdWatcher.onDidCreate(() => projectStatusProvider.refresh());
  claudeMdWatcher.onDidDelete(() => projectStatusProvider.refresh());
  context.subscriptions.push(claudeMdWatcher);

  // Auto-sync if configured
  if (config.get<boolean>('autoSync', false)) {
    vscode.commands.executeCommand('claudeInit.syncKnowledge');
  }

  // Show welcome message if no config exists
  const projectConfig = require('./utils/config').getProjectConfig();
  if (!projectConfig.hasClaudeConfig && !projectConfig.hasClaudeMd) {
    vscode.window
      .showInformationMessage(
        'Welcome to Claude Code Initializer! Would you like to set up this project?',
        'Setup Now',
        'Later'
      )
      .then(selection => {
        if (selection === 'Setup Now') {
          vscode.commands.executeCommand('claudeInit.setupProject');
        }
      });
  }
}

export function deactivate() {
  console.log('Claude Code Initializer extension deactivated');
}
