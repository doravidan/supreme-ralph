import * as vscode from 'vscode';

export class ActionsProvider implements vscode.TreeDataProvider<ActionItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ActionItem | undefined | null | void> =
    new vscode.EventEmitter<ActionItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ActionItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor() {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ActionItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<ActionItem[]> {
    return [
      new ActionItem(
        'Setup Project',
        'Configure Claude Code for this project',
        'rocket',
        {
          command: 'claudeInit.setupProject',
          title: 'Setup Project'
        }
      ),
      new ActionItem(
        'Quick Setup',
        'Use default configuration',
        'zap',
        {
          command: 'claudeInit.quickSetup',
          title: 'Quick Setup'
        }
      ),
      new ActionItem(
        'Open Setup Wizard',
        'Interactive configuration wizard',
        'window',
        {
          command: 'claudeInit.openWizard',
          title: 'Open Wizard'
        }
      ),
      new ActionItem(
        'Sync Knowledge Base',
        'Fetch latest documentation',
        'sync',
        {
          command: 'claudeInit.syncKnowledge',
          title: 'Sync Knowledge Base'
        }
      ),
      new ActionItem(
        'Check for Updates',
        'Check if knowledge base needs updating',
        'bell',
        {
          command: 'claudeInit.checkUpdates',
          title: 'Check for Updates'
        }
      ),
      new ActionItem(
        'Validate Templates',
        'Check template syntax',
        'check',
        {
          command: 'claudeInit.validateTemplates',
          title: 'Validate Templates'
        }
      ),
      new ActionItem(
        'View Changelog',
        'See recent changes',
        'history',
        {
          command: 'claudeInit.viewChanges',
          title: 'View Changelog'
        }
      )
    ];
  }
}

class ActionItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    iconName: string,
    command: vscode.Command
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = description;
    this.command = command;
    this.iconPath = new vscode.ThemeIcon(iconName);
    this.contextValue = 'action';
  }
}
