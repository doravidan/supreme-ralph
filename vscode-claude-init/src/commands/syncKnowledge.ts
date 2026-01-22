import * as vscode from 'vscode';
import { runScriptWithProgress } from '../utils/scriptRunner';

/**
 * Sync knowledge base from Anthropic documentation
 */
export async function syncKnowledgeCommand(): Promise<void> {
  const result = await runScriptWithProgress(
    'sync-knowledge.js',
    [],
    'Syncing knowledge base from Anthropic...'
  );

  if (result.success) {
    // Parse output for summary
    const addedMatch = result.output.match(/Added \((\d+)\)/);
    const modifiedMatch = result.output.match(/Modified \((\d+)\)/);
    const unchangedMatch = result.output.match(/Unchanged: (\d+)/);

    let summary = 'Knowledge base synced successfully!';
    if (addedMatch || modifiedMatch) {
      const added = addedMatch ? parseInt(addedMatch[1]) : 0;
      const modified = modifiedMatch ? parseInt(modifiedMatch[1]) : 0;
      summary = `Knowledge base synced: ${added} added, ${modified} modified`;
    } else if (unchangedMatch) {
      summary = 'Knowledge base is already up to date!';
    }

    vscode.window.showInformationMessage(summary);
  } else {
    vscode.window.showErrorMessage(
      `Sync failed: ${result.error || 'Unknown error'}`,
      'View Details'
    ).then(action => {
      if (action === 'View Details') {
        const outputChannel = vscode.window.createOutputChannel('Claude Code Init');
        outputChannel.appendLine('=== Sync Output ===');
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
 * Check for knowledge base updates
 */
export async function checkUpdatesCommand(): Promise<void> {
  const result = await runScriptWithProgress(
    'check-updates.js',
    [],
    'Checking for updates...'
  );

  if (result.success) {
    if (result.output.includes('up to date') || result.output.includes('No updates')) {
      vscode.window.showInformationMessage('Knowledge base is up to date!');
    } else if (result.output.includes('updates available') || result.output.includes('has been updated')) {
      const action = await vscode.window.showWarningMessage(
        'Knowledge base updates are available!',
        'Sync Now',
        'View Changes'
      );

      if (action === 'Sync Now') {
        vscode.commands.executeCommand('claudeInit.syncKnowledge');
      } else if (action === 'View Changes') {
        vscode.commands.executeCommand('claudeInit.viewChanges');
      }
    } else {
      vscode.window.showInformationMessage('Update check completed.');
    }
  } else {
    vscode.window.showErrorMessage(`Update check failed: ${result.error || 'Unknown error'}`);
  }
}

/**
 * View changelog since last setup
 */
export async function viewChangesCommand(): Promise<void> {
  const result = await runScriptWithProgress(
    'view-changes.js',
    [],
    'Loading changelog...'
  );

  if (result.success) {
    // Show changelog in a new document
    const doc = await vscode.workspace.openTextDocument({
      content: stripAnsi(result.output),
      language: 'markdown'
    });
    await vscode.window.showTextDocument(doc, { preview: true });
  } else {
    if (result.output.includes('No changes') || result.output.includes('No changelog')) {
      vscode.window.showInformationMessage('No changes recorded since last setup.');
    } else {
      vscode.window.showErrorMessage(`Failed to load changelog: ${result.error || 'Unknown error'}`);
    }
  }
}

/**
 * Validate template files
 */
export async function validateTemplatesCommand(): Promise<void> {
  const result = await runScriptWithProgress(
    'validate-templates.js',
    [],
    'Validating templates...'
  );

  if (result.success) {
    if (result.output.includes('All templates valid') || result.output.includes('✓')) {
      vscode.window.showInformationMessage('All templates are valid!');
    } else {
      // Show validation results
      const doc = await vscode.workspace.openTextDocument({
        content: stripAnsi(result.output),
        language: 'plaintext'
      });
      await vscode.window.showTextDocument(doc, { preview: true });
    }
  } else {
    vscode.window.showErrorMessage(
      `Template validation failed: ${result.error || 'Unknown error'}`,
      'View Details'
    ).then(async action => {
      if (action === 'View Details') {
        const doc = await vscode.workspace.openTextDocument({
          content: stripAnsi(result.output + '\n\n' + (result.error || '')),
          language: 'plaintext'
        });
        await vscode.window.showTextDocument(doc, { preview: true });
      }
    });
  }
}

/**
 * Strip ANSI color codes from string
 */
function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}
