import * as vscode from 'vscode';
import { getProjectConfig, listClaudeFiles } from '../utils/config';

export class ProjectStatusProvider implements vscode.TreeDataProvider<StatusItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<StatusItem | undefined | null | void> =
    new vscode.EventEmitter<StatusItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<StatusItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor() {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: StatusItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: StatusItem): Promise<StatusItem[]> {
    if (!vscode.workspace.workspaceFolders) {
      return [];
    }

    const config = getProjectConfig();

    if (!element) {
      // Root level
      if (!config.hasClaudeConfig && !config.hasClaudeMd) {
        return [
          new StatusItem(
            'No Configuration',
            'Click to set up Claude Code',
            vscode.TreeItemCollapsibleState.None,
            'warning',
            {
              command: 'claudeInit.setupProject',
              title: 'Setup Project'
            }
          )
        ];
      }

      const items: StatusItem[] = [];

      // CLAUDE.md status
      items.push(
        new StatusItem(
          'CLAUDE.md',
          config.hasClaudeMd ? 'Present' : 'Missing',
          vscode.TreeItemCollapsibleState.None,
          config.hasClaudeMd ? 'check' : 'warning',
          config.hasClaudeMd
            ? {
                command: 'vscode.open',
                title: 'Open CLAUDE.md',
                arguments: [
                  vscode.Uri.joinPath(
                    vscode.workspace.workspaceFolders[0].uri,
                    'CLAUDE.md'
                  )
                ]
              }
            : undefined
        )
      );

      // .claude directory
      if (config.hasClaudeConfig) {
        items.push(
          new StatusItem(
            '.claude/',
            'Configured',
            vscode.TreeItemCollapsibleState.Collapsed,
            'folder'
          )
        );
      }

      return items;
    }

    // Children of .claude/
    if (element.label === '.claude/') {
      const items: StatusItem[] = [];

      // Settings
      items.push(
        new StatusItem(
          'settings.json',
          config.hasSettings ? 'Configured' : 'Missing',
          vscode.TreeItemCollapsibleState.None,
          config.hasSettings ? 'gear' : 'warning',
          config.hasSettings && config.claudeDir
            ? {
                command: 'vscode.open',
                title: 'Open settings.json',
                arguments: [
                  vscode.Uri.joinPath(vscode.Uri.file(config.claudeDir), 'settings.json')
                ]
              }
            : undefined
        )
      );

      // Rules
      const rules = listClaudeFiles('rules');
      items.push(
        new StatusItem(
          'rules/',
          `${rules.length} rule(s)`,
          rules.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
          rules.length > 0 ? 'law' : 'circle-outline',
          undefined,
          'rules'
        )
      );

      // Commands
      const commands = listClaudeFiles('commands');
      items.push(
        new StatusItem(
          'commands/',
          `${commands.length} command(s)`,
          commands.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
          commands.length > 0 ? 'terminal' : 'circle-outline',
          undefined,
          'commands'
        )
      );

      // Agents
      const agents = listClaudeFiles('agents');
      items.push(
        new StatusItem(
          'agents/',
          `${agents.length} agent(s)`,
          agents.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
          agents.length > 0 ? 'robot' : 'circle-outline',
          undefined,
          'agents'
        )
      );

      // Hooks
      items.push(
        new StatusItem(
          'hooks/',
          config.hasHooks ? 'Configured' : 'Not configured',
          vscode.TreeItemCollapsibleState.None,
          config.hasHooks ? 'zap' : 'circle-outline'
        )
      );

      return items;
    }

    // Children of subdirectories
    if (element.contextValue) {
      const files = listClaudeFiles(element.contextValue);
      const config = getProjectConfig();

      return files.map(
        file =>
          new StatusItem(
            file,
            '',
            vscode.TreeItemCollapsibleState.None,
            'file',
            config.claudeDir
              ? {
                  command: 'vscode.open',
                  title: `Open ${file}`,
                  arguments: [
                    vscode.Uri.joinPath(
                      vscode.Uri.file(config.claudeDir),
                      element.contextValue!,
                      file
                    )
                  ]
                }
              : undefined
          )
      );
    }

    return [];
  }
}

class StatusItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    iconName?: string,
    command?: vscode.Command,
    public readonly contextValue?: string
  ) {
    super(label, collapsibleState);
    this.description = description;
    this.command = command;

    if (iconName) {
      this.iconPath = new vscode.ThemeIcon(iconName);
    }
  }
}
