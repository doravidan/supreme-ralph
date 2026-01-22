import * as vscode from 'vscode';
import { listTemplates, getTemplatesPath } from '../utils/config';
import * as path from 'path';

export class TemplatesProvider implements vscode.TreeDataProvider<TemplateItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TemplateItem | undefined | null | void> =
    new vscode.EventEmitter<TemplateItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TemplateItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor() {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TemplateItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TemplateItem): Promise<TemplateItem[]> {
    const templates = listTemplates();

    if (!element) {
      // Root level - categories
      const items: TemplateItem[] = [];

      if (templates.main.length > 0) {
        items.push(
          new TemplateItem(
            'Main Templates',
            vscode.TreeItemCollapsibleState.Collapsed,
            'file-code',
            undefined,
            'main'
          )
        );
      }

      if (templates.rules.length > 0) {
        items.push(
          new TemplateItem(
            'Rules',
            vscode.TreeItemCollapsibleState.Collapsed,
            'law',
            undefined,
            'rules'
          )
        );
      }

      if (templates.commands.length > 0) {
        items.push(
          new TemplateItem(
            'Commands',
            vscode.TreeItemCollapsibleState.Collapsed,
            'terminal',
            undefined,
            'commands'
          )
        );
      }

      if (templates.agents.length > 0) {
        items.push(
          new TemplateItem(
            'Agents',
            vscode.TreeItemCollapsibleState.Collapsed,
            'robot',
            undefined,
            'agents'
          )
        );
      }

      if (templates.skills.length > 0) {
        items.push(
          new TemplateItem(
            'Skills',
            vscode.TreeItemCollapsibleState.Collapsed,
            'lightbulb',
            undefined,
            'skills'
          )
        );
      }

      if (templates.hooks.length > 0) {
        items.push(
          new TemplateItem(
            'Hooks',
            vscode.TreeItemCollapsibleState.Collapsed,
            'zap',
            undefined,
            'hooks'
          )
        );
      }

      if (items.length === 0) {
        items.push(
          new TemplateItem(
            'No templates found',
            vscode.TreeItemCollapsibleState.None,
            'warning'
          )
        );
      }

      return items;
    }

    // Children - template files
    if (element.category) {
      const templatesPath = getTemplatesPath();
      const categoryTemplates = templates[element.category as keyof typeof templates] || [];

      return categoryTemplates.map(file => {
        const filePath =
          element.category === 'main'
            ? path.join(templatesPath, file)
            : path.join(templatesPath, element.category!, file);

        return new TemplateItem(
          file.replace('.template', '').replace('.md', ''),
          vscode.TreeItemCollapsibleState.None,
          'file',
          {
            command: 'vscode.open',
            title: 'Open Template',
            arguments: [vscode.Uri.file(filePath)]
          }
        );
      });
    }

    return [];
  }
}

class TemplateItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    iconName?: string,
    command?: vscode.Command,
    public readonly category?: string
  ) {
    super(label, collapsibleState);
    this.command = command;

    if (iconName) {
      this.iconPath = new vscode.ThemeIcon(iconName);
    }
  }
}
