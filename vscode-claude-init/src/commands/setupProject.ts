import * as vscode from 'vscode';
import { runScriptWithProgress, getWorkspacePath } from '../utils/scriptRunner';

/**
 * Interactive project setup command
 */
export async function setupProjectCommand(): Promise<void> {
  const workspacePath = getWorkspacePath();

  if (!workspacePath) {
    vscode.window.showErrorMessage('Please open a folder first to set up Claude Code configuration.');
    return;
  }

  // Ask user for setup mode
  const mode = await vscode.window.showQuickPick(
    [
      {
        label: '$(rocket) Interactive Setup',
        description: 'Configure all options step by step',
        value: 'interactive'
      },
      {
        label: '$(zap) Quick Setup',
        description: 'Use default settings',
        value: 'quick'
      },
      {
        label: '$(git-merge) Merge with Existing',
        description: 'Merge with existing configuration',
        value: 'merge'
      }
    ],
    {
      placeHolder: 'Select setup mode',
      title: 'Claude Code Project Setup'
    }
  );

  if (!mode) {
    return; // User cancelled
  }

  // For interactive mode, open the wizard panel
  if (mode.value === 'interactive') {
    vscode.commands.executeCommand('claudeInit.openWizard');
    return;
  }

  // Build arguments
  const args: string[] = ['--target', workspacePath];

  if (mode.value === 'quick') {
    args.push('--yes');
  } else if (mode.value === 'merge') {
    args.push('--merge');
  }

  // Run the setup script
  const result = await runScriptWithProgress(
    'setup-project.js',
    args,
    'Setting up Claude Code project...'
  );

  if (result.success) {
    const action = await vscode.window.showInformationMessage(
      'Claude Code project setup completed successfully!',
      'Open CLAUDE.md',
      'Refresh Explorer'
    );

    if (action === 'Open CLAUDE.md') {
      const claudeMdUri = vscode.Uri.joinPath(vscode.Uri.file(workspacePath), 'CLAUDE.md');
      vscode.window.showTextDocument(claudeMdUri);
    } else if (action === 'Refresh Explorer') {
      vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer');
    }

    // Refresh our views
    vscode.commands.executeCommand('claudeInit.refreshViews');
  } else {
    vscode.window.showErrorMessage(
      `Setup failed: ${result.error || 'Unknown error'}`,
      'View Output'
    ).then(action => {
      if (action === 'View Output') {
        const outputChannel = vscode.window.createOutputChannel('Claude Code Init');
        outputChannel.appendLine('=== Setup Output ===');
        outputChannel.appendLine(result.output);
        if (result.error) {
          outputChannel.appendLine('\n=== Errors ===');
          outputChannel.appendLine(result.error);
        }
        outputChannel.show();
      }
    });
  }
}

/**
 * Quick setup with defaults
 */
export async function quickSetupCommand(): Promise<void> {
  const workspacePath = getWorkspacePath();

  if (!workspacePath) {
    vscode.window.showErrorMessage('Please open a folder first to set up Claude Code configuration.');
    return;
  }

  const result = await runScriptWithProgress(
    'setup-project.js',
    ['--target', workspacePath, '--yes'],
    'Quick setup with defaults...'
  );

  if (result.success) {
    vscode.window.showInformationMessage('Claude Code quick setup completed!');
    vscode.commands.executeCommand('claudeInit.refreshViews');
    vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer');
  } else {
    vscode.window.showErrorMessage(`Quick setup failed: ${result.error || 'Unknown error'}`);
  }
}
