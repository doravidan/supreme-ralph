import * as vscode from 'vscode';
import * as path from 'path';
import { runScript, getWorkspacePath } from '../utils/scriptRunner';

export class SetupWizardPanel {
  public static currentPanel: SetupWizardPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If panel exists, show it
    if (SetupWizardPanel.currentPanel) {
      SetupWizardPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Create new panel
    const panel = vscode.window.createWebviewPanel(
      'claudeSetupWizard',
      'Claude Code Setup Wizard',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'media'),
          vscode.Uri.joinPath(extensionUri, 'dist')
        ]
      }
    );

    SetupWizardPanel.currentPanel = new SetupWizardPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set initial HTML
    this._update();

    // Handle disposal
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from webview
    this._panel.webview.onDidReceiveMessage(
      async message => {
        switch (message.command) {
          case 'submit':
            await this._handleSubmit(message.data);
            break;
          case 'cancel':
            this._panel.dispose();
            break;
          case 'getDefaults':
            this._sendDefaults();
            break;
        }
      },
      null,
      this._disposables
    );
  }

  private _sendDefaults() {
    const workspacePath = getWorkspacePath();
    const projectName = workspacePath ? path.basename(workspacePath) : 'my-project';

    this._panel.webview.postMessage({
      command: 'setDefaults',
      data: {
        projectName,
        projectDescription: 'A software project',
        language: 'typescript',
        framework: 'none',
        buildCommand: 'npm run build',
        testCommand: 'npm test',
        lintCommand: 'npm run lint',
        setupHooks: true,
        setupAgents: true,
        setupCommands: true,
        setupRules: true
      }
    });
  }

  private async _handleSubmit(config: Record<string, unknown>) {
    const workspacePath = getWorkspacePath();

    if (!workspacePath) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }

    // Build args from config
    const args: string[] = ['--target', workspacePath, '--yes'];

    // Send progress update
    this._panel.webview.postMessage({
      command: 'progress',
      data: { status: 'running', message: 'Setting up project...' }
    });

    try {
      // For now, run with --yes and the config will come from defaults
      // In a more complete implementation, we'd modify setup-project.js to accept JSON config
      const result = await runScript('setup-project.js', args, {
        onOutput: output => {
          // Strip ANSI and send progress
          const clean = output.replace(/\x1b\[[0-9;]*m/g, '').trim();
          if (clean) {
            this._panel.webview.postMessage({
              command: 'progress',
              data: { status: 'running', message: clean.substring(0, 100) }
            });
          }
        }
      });

      if (result.success) {
        this._panel.webview.postMessage({
          command: 'progress',
          data: { status: 'success', message: 'Setup completed successfully!' }
        });

        vscode.window.showInformationMessage('Claude Code project setup completed!');
        vscode.commands.executeCommand('claudeInit.refreshViews');
        vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer');

        // Close panel after short delay
        setTimeout(() => {
          this._panel.dispose();
        }, 2000);
      } else {
        this._panel.webview.postMessage({
          command: 'progress',
          data: { status: 'error', message: result.error || 'Setup failed' }
        });
      }
    } catch (error) {
      this._panel.webview.postMessage({
        command: 'progress',
        data: { status: 'error', message: `Error: ${error}` }
      });
    }
  }

  private _update() {
    this._panel.webview.html = this._getHtmlForWebview();
  }

  private _getHtmlForWebview(): string {
    const styleUri = this._panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'wizard.css')
    );
    const scriptUri = this._panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'wizard.js')
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this._panel.webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <link href="${styleUri}" rel="stylesheet">
  <title>Claude Code Setup Wizard</title>
</head>
<body>
  <div class="container">
    <header>
      <h1>🚀 Claude Code Setup Wizard</h1>
      <p class="subtitle">Configure your project for Claude Code best practices</p>
    </header>

    <form id="setupForm">
      <section class="form-section">
        <h2>Project Information</h2>

        <div class="form-group">
          <label for="projectName">Project Name</label>
          <input type="text" id="projectName" name="projectName" required>
        </div>

        <div class="form-group">
          <label for="projectDescription">Description</label>
          <textarea id="projectDescription" name="projectDescription" rows="2"></textarea>
        </div>
      </section>

      <section class="form-section">
        <h2>Technology Stack</h2>

        <div class="form-row">
          <div class="form-group">
            <label for="language">Primary Language</label>
            <select id="language" name="language">
              <option value="typescript">TypeScript</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div class="form-group">
            <label for="framework">Framework</label>
            <select id="framework" name="framework">
              <option value="none">None</option>
              <option value="react">React</option>
              <option value="nextjs">Next.js</option>
              <option value="express">Express</option>
              <option value="fastapi">FastAPI</option>
              <option value="django">Django</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </section>

      <section class="form-section">
        <h2>Commands</h2>

        <div class="form-row">
          <div class="form-group">
            <label for="buildCommand">Build Command</label>
            <input type="text" id="buildCommand" name="buildCommand" placeholder="npm run build">
          </div>

          <div class="form-group">
            <label for="testCommand">Test Command</label>
            <input type="text" id="testCommand" name="testCommand" placeholder="npm test">
          </div>
        </div>

        <div class="form-group">
          <label for="lintCommand">Lint Command</label>
          <input type="text" id="lintCommand" name="lintCommand" placeholder="npm run lint">
        </div>
      </section>

      <section class="form-section">
        <h2>Features</h2>

        <div class="checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" id="setupRules" name="setupRules" checked>
            <span>Generate Rules</span>
            <small>Code style, security, and testing guidelines</small>
          </label>

          <label class="checkbox-label">
            <input type="checkbox" id="setupCommands" name="setupCommands" checked>
            <span>Generate Commands</span>
            <small>Slash commands for review, test, commit</small>
          </label>

          <label class="checkbox-label">
            <input type="checkbox" id="setupAgents" name="setupAgents" checked>
            <span>Generate Agents</span>
            <small>Code reviewer and debugger agents</small>
          </label>

          <label class="checkbox-label">
            <input type="checkbox" id="setupHooks" name="setupHooks" checked>
            <span>Generate Hooks</span>
            <small>Auto-lint on file save</small>
          </label>
        </div>
      </section>

      <div id="progressArea" class="progress-area hidden">
        <div class="progress-spinner"></div>
        <p id="progressMessage">Setting up...</p>
      </div>

      <div class="button-group">
        <button type="button" class="btn btn-secondary" id="cancelBtn">Cancel</button>
        <button type="submit" class="btn btn-primary" id="submitBtn">
          <span class="btn-icon">🚀</span>
          Setup Project
        </button>
      </div>
    </form>
  </div>

  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  public dispose() {
    SetupWizardPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
