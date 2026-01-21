/**
 * Email Sender Utility
 * Sends email summaries using Resend API
 */

import fs from 'fs-extra';
import path from 'path';
import { Resend } from 'resend';

// Support both old and new config locations
const CLAUDE_INIT_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude-init');
const NEW_CONFIG_PATH = path.join(CLAUDE_INIT_DIR, 'config.json');
const OLD_CONFIG_PATH = path.join(process.env.HOME || process.env.USERPROFILE, '.claude-init-config.json');

/**
 * Get the active config path (new location preferred)
 */
async function getConfigPath() {
  if (await fs.pathExists(NEW_CONFIG_PATH)) {
    return NEW_CONFIG_PATH;
  }
  if (await fs.pathExists(OLD_CONFIG_PATH)) {
    return OLD_CONFIG_PATH;
  }
  return NEW_CONFIG_PATH; // default to new location
}

/**
 * Load email configuration from config file
 */
export async function loadEmailConfig() {
  const configPath = await getConfigPath();

  if (await fs.pathExists(configPath)) {
    const config = await fs.readJson(configPath);
    return {
      emailSummaryEnabled: config.emailSummaryEnabled || false,
      emailAddress: config.emailAddress || '',
      resendApiKey: process.env.RESEND_API_KEY || config.resendApiKey || '',
      lastEmailSent: config.lastEmailSent || null
    };
  }

  return {
    emailSummaryEnabled: false,
    emailAddress: '',
    resendApiKey: process.env.RESEND_API_KEY || '',
    lastEmailSent: null
  };
}

/**
 * Validate email configuration
 */
export function validateEmailConfig(config) {
  const errors = [];

  if (!config.emailAddress) {
    errors.push('Email address is not configured');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.emailAddress)) {
    errors.push('Email address is invalid');
  }

  if (!config.resendApiKey) {
    errors.push('Resend API key is not configured (set RESEND_API_KEY env var or configure via setup)');
  } else if (!config.resendApiKey.startsWith('re_')) {
    errors.push('Resend API key appears invalid (should start with "re_")');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Send email via Resend API
 */
export async function sendEmail(to, subject, html, text) {
  const config = await loadEmailConfig();

  const validation = validateEmailConfig(config);
  if (!validation.valid) {
    throw new Error(`Email configuration invalid: ${validation.errors.join(', ')}`);
  }

  const resend = new Resend(config.resendApiKey);

  const { data, error } = await resend.emails.send({
    from: 'Claude Init <onboarding@resend.dev>',
    to: [to],
    subject: subject,
    html: html,
    text: text
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

/**
 * Update last email sent timestamp in config
 */
export async function markEmailSent() {
  const configPath = await getConfigPath();
  if (await fs.pathExists(configPath)) {
    const config = await fs.readJson(configPath);
    config.lastEmailSent = new Date().toISOString();
    await fs.writeJson(configPath, config, { spaces: 2 });
  }
}

/**
 * Get the config file path (exported for external use)
 */
export async function getEmailConfigPath() {
  return await getConfigPath();
}
