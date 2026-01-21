#!/usr/bin/env node

/**
 * Setup Scheduler Script
 * Configures daily automatic knowledge base sync
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { ui } from './utils/design-system.js';
import inquirer from 'inquirer';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');
const CONFIG_PATH = path.join(process.env.HOME || process.env.USERPROFILE, '.claude-init-config.json');

/**
 * Load or create config
 */
async function loadConfig() {
  if (await fs.pathExists(CONFIG_PATH)) {
    return await fs.readJson(CONFIG_PATH);
  }

  return {
    autoSync: true,
    syncInterval: 'daily',
    syncTime: '09:00',
    notifyOnUpdate: true,
    emailSummaryEnabled: false,
    emailAddress: '',
    resendApiKey: '',
    lastEmailSent: null,
    defaultProjectType: 'typescript',
    includeExamples: true
  };
}

/**
 * Save config
 */
async function saveConfig(config) {
  await fs.writeJson(CONFIG_PATH, config, { spaces: 2 });
}

/**
 * Check operating system
 */
function getOS() {
  const platform = process.platform;
  if (platform === 'win32') return 'windows';
  if (platform === 'darwin') return 'macos';
  return 'linux';
}

/**
 * Setup cron job on Unix systems
 */
async function setupCronJob(syncTime) {
  const [hour, minute] = syncTime.split(':');
  const syncScript = path.join(PROJECT_ROOT, 'scripts', 'sync-knowledge.js');
  const cronEntry = `${minute} ${hour} * * * /usr/bin/node ${syncScript} >> ~/.claude-init-sync.log 2>&1`;

  try {
    // Get existing crontab
    let existingCron = '';
    try {
      const { stdout } = await execAsync('crontab -l');
      existingCron = stdout;
    } catch (e) {
      // No existing crontab
    }

    // Remove any existing claude-init entries
    const lines = existingCron.split('\n').filter(line =>
      !line.includes('sync-knowledge.js') && line.trim() !== ''
    );

    // Add new entry
    lines.push(cronEntry);

    // Write new crontab
    const newCron = lines.join('\n') + '\n';
    await execAsync(`echo "${newCron}" | crontab -`);

    return { success: true, message: 'Cron job installed successfully' };
  } catch (error) {
    return { success: false, message: `Failed to setup cron: ${error.message}` };
  }
}

/**
 * Setup Task Scheduler on Windows
 */
async function setupWindowsTask(syncTime) {
  const syncScript = path.join(PROJECT_ROOT, 'scripts', 'sync-knowledge.js');
  const taskName = 'ClaudeCodeKnowledgeSync';

  try {
    // Delete existing task if exists
    try {
      await execAsync(`schtasks /delete /tn "${taskName}" /f`);
    } catch (e) {
      // Task doesn't exist
    }

    // Create new task
    const command = `schtasks /create /tn "${taskName}" /tr "node ${syncScript}" /sc daily /st ${syncTime} /f`;
    await execAsync(command);

    return { success: true, message: 'Windows Task Scheduler job created successfully' };
  } catch (error) {
    return { success: false, message: `Failed to setup Windows task: ${error.message}` };
  }
}

/**
 * Setup launchd on macOS
 */
async function setupLaunchd(syncTime) {
  const [hour, minute] = syncTime.split(':');
  const syncScript = path.join(PROJECT_ROOT, 'scripts', 'sync-knowledge.js');
  const plistPath = path.join(process.env.HOME, 'Library', 'LaunchAgents', 'com.claude-init.sync.plist');

  const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.claude-init.sync</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>${syncScript}</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>${parseInt(hour)}</integer>
        <key>Minute</key>
        <integer>${parseInt(minute)}</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>${process.env.HOME}/.claude-init-sync.log</string>
    <key>StandardErrorPath</key>
    <string>${process.env.HOME}/.claude-init-sync.log</string>
</dict>
</plist>`;

  try {
    // Unload existing job if exists
    try {
      await execAsync(`launchctl unload ${plistPath}`);
    } catch (e) {
      // Job doesn't exist
    }

    // Write plist file
    await fs.ensureDir(path.dirname(plistPath));
    await fs.writeFile(plistPath, plistContent, 'utf-8');

    // Load the job
    await execAsync(`launchctl load ${plistPath}`);

    return { success: true, message: 'launchd job installed successfully' };
  } catch (error) {
    return { success: false, message: `Failed to setup launchd: ${error.message}` };
  }
}

/**
 * Main function
 */
async function main() {
  ui.header('Claude Code Knowledge Base Scheduler Setup', 'schedule');

  const config = await loadConfig();
  const os = getOS();

  ui.muted(`Operating System: ${os}`);
  ui.muted(`Config file: ${CONFIG_PATH}\n`);

  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'enableAutoSync',
      message: 'Enable automatic daily sync?',
      default: config.autoSync
    },
    {
      type: 'input',
      name: 'syncTime',
      message: 'What time should the sync run? (24h format, e.g., 09:00)',
      default: config.syncTime,
      when: (answers) => answers.enableAutoSync,
      validate: (input) => {
        const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!regex.test(input)) {
          return 'Please enter a valid time in 24h format (e.g., 09:00)';
        }
        return true;
      }
    },
    {
      type: 'confirm',
      name: 'notifyOnUpdate',
      message: 'Show notification when updates are available?',
      default: config.notifyOnUpdate,
      when: (answers) => answers.enableAutoSync
    },
    {
      type: 'confirm',
      name: 'emailSummaryEnabled',
      message: 'Send daily email summary of changes?',
      default: config.emailSummaryEnabled || false,
      when: (answers) => answers.enableAutoSync
    },
    {
      type: 'input',
      name: 'emailAddress',
      message: 'Email address for daily summaries:',
      default: config.emailAddress || '',
      when: (answers) => answers.emailSummaryEnabled,
      validate: (input) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(input) || 'Please enter a valid email address';
      }
    },
    {
      type: 'password',
      name: 'resendApiKey',
      message: 'Resend API key (or set RESEND_API_KEY env var later):',
      when: (answers) => answers.emailSummaryEnabled && !process.env.RESEND_API_KEY,
      validate: (input) => {
        if (!input) return 'API key is required (or set RESEND_API_KEY env var)';
        return input.startsWith('re_') || 'Resend API keys start with "re_"';
      }
    }
  ]);

  // Update config
  config.autoSync = answers.enableAutoSync;
  if (answers.enableAutoSync) {
    config.syncTime = answers.syncTime;
    config.notifyOnUpdate = answers.notifyOnUpdate;
    config.emailSummaryEnabled = answers.emailSummaryEnabled || false;
    if (answers.emailSummaryEnabled) {
      config.emailAddress = answers.emailAddress;
      if (answers.resendApiKey) {
        config.resendApiKey = answers.resendApiKey;
      }
    }
  }

  await saveConfig(config);
  ui.success('Configuration saved');

  if (answers.emailSummaryEnabled) {
    ui.muted(`   Email summaries will be sent to: ${answers.emailAddress}`);
    if (process.env.RESEND_API_KEY) {
      ui.muted('   Using RESEND_API_KEY from environment');
    }
  }
  ui.blank();

  if (answers.enableAutoSync) {
    ui.info('Setting up scheduled task...\n');

    let result;
    switch (os) {
      case 'macos':
        result = await setupLaunchd(answers.syncTime);
        break;
      case 'windows':
        result = await setupWindowsTask(answers.syncTime);
        break;
      default:
        result = await setupCronJob(answers.syncTime);
    }

    if (result.success) {
      ui.success(result.message);
      ui.muted(`\nThe knowledge base will sync daily at ${answers.syncTime}`);
      ui.muted(`Logs will be written to ~/.claude-init-sync.log\n`);
    } else {
      ui.error(result.message);
      ui.warningText('\nYou can manually run sync with: npm run sync-knowledge');
      ui.warningText('Or set up your own scheduled task using:');
      ui.muted(`  node ${path.join(PROJECT_ROOT, 'scripts', 'sync-knowledge.js')}\n`);
    }
  } else {
    ui.warningText('Automatic sync disabled.');
    ui.muted('Run "npm run sync-knowledge" manually to update the knowledge base.\n');
  }
}

main().catch(error => {
  console.error(ui.colors.error(`\n${ui.icons.error} Setup failed:`), error.message);
  process.exit(1);
});
