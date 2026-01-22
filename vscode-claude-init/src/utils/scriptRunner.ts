import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';

export interface ScriptResult {
  success: boolean;
  output: string;
  error?: string;
  code: number | null;
}

export interface ScriptOptions {
  cwd?: string;
  timeout?: number;
  onOutput?: (data: string) => void;
  onError?: (data: string) => void;
}

/**
 * Get the path to the scripts directory
 */
export function getScriptsPath(): string {
  const config = vscode.workspace.getConfiguration('claudeInit');
  const customPath = config.get<string>('scriptsPath');

  if (customPath && customPath.trim()) {
    return customPath;
  }

  // Default to the scripts directory relative to the extension
  // In development, this is the parent project's scripts folder
  // When bundled, scripts would be included in the extension
  return path.join(__dirname, '..', '..', '..', 'scripts');
}

/**
 * Execute a Node.js script from the scripts directory
 */
export async function runScript(
  scriptName: string,
  args: string[] = [],
  options: ScriptOptions = {}
): Promise<ScriptResult> {
  return new Promise((resolve) => {
    const scriptsPath = getScriptsPath();
    const scriptPath = path.join(scriptsPath, scriptName);

    const cwd = options.cwd || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();

    let output = '';
    let errorOutput = '';
    let child: ChildProcess;

    try {
      child = spawn('node', [scriptPath, ...args], {
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: process.platform === 'win32'
      });
    } catch (err) {
      resolve({
        success: false,
        output: '',
        error: `Failed to spawn process: ${err}`,
        code: -1
      });
      return;
    }

    child.stdout?.on('data', (data: Buffer) => {
      const str = data.toString();
      output += str;
      options.onOutput?.(str);
    });

    child.stderr?.on('data', (data: Buffer) => {
      const str = data.toString();
      errorOutput += str;
      options.onError?.(str);
    });

    child.on('close', (code) => {
      resolve({
        success: code === 0,
        output: output.trim(),
        error: errorOutput.trim() || undefined,
        code
      });
    });

    child.on('error', (err) => {
      resolve({
        success: false,
        output: output.trim(),
        error: err.message,
        code: -1
      });
    });

    // Handle timeout
    if (options.timeout) {
      setTimeout(() => {
        child.kill();
        resolve({
          success: false,
          output: output.trim(),
          error: 'Process timed out',
          code: -1
        });
      }, options.timeout);
    }
  });
}

/**
 * Run script with VS Code progress notification
 */
export async function runScriptWithProgress(
  scriptName: string,
  args: string[] = [],
  title: string,
  options: ScriptOptions = {}
): Promise<ScriptResult> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title,
      cancellable: true
    },
    async (progress, token) => {
      return new Promise<ScriptResult>((resolve) => {
        const scriptsPath = getScriptsPath();
        const scriptPath = path.join(scriptsPath, scriptName);
        const cwd = options.cwd || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();

        let output = '';
        let errorOutput = '';
        let child: ChildProcess;

        try {
          child = spawn('node', [scriptPath, ...args], {
            cwd,
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: process.platform === 'win32'
          });
        } catch (err) {
          resolve({
            success: false,
            output: '',
            error: `Failed to spawn process: ${err}`,
            code: -1
          });
          return;
        }

        // Handle cancellation
        token.onCancellationRequested(() => {
          child.kill();
          resolve({
            success: false,
            output: output.trim(),
            error: 'Cancelled by user',
            code: -1
          });
        });

        child.stdout?.on('data', (data: Buffer) => {
          const str = data.toString();
          output += str;

          // Parse output for progress updates
          const lines = str.split('\n').filter(l => l.trim());
          if (lines.length > 0) {
            const lastLine = lines[lines.length - 1];
            // Strip ANSI codes for display
            const cleanLine = lastLine.replace(/\x1b\[[0-9;]*m/g, '').trim();
            if (cleanLine) {
              progress.report({ message: cleanLine.substring(0, 50) });
            }
          }

          options.onOutput?.(str);
        });

        child.stderr?.on('data', (data: Buffer) => {
          const str = data.toString();
          errorOutput += str;
          options.onError?.(str);
        });

        child.on('close', (code) => {
          resolve({
            success: code === 0,
            output: output.trim(),
            error: errorOutput.trim() || undefined,
            code
          });
        });

        child.on('error', (err) => {
          resolve({
            success: false,
            output: output.trim(),
            error: err.message,
            code: -1
          });
        });
      });
    }
  );
}

/**
 * Check if a script exists
 */
export function scriptExists(scriptName: string): boolean {
  const fs = require('fs');
  const scriptPath = path.join(getScriptsPath(), scriptName);
  return fs.existsSync(scriptPath);
}

/**
 * Get workspace folder path
 */
export function getWorkspacePath(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}
