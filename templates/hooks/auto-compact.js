#!/usr/bin/env node

/**
 * Auto-Compact Hook Script
 *
 * Monitors context usage and triggers /compact when threshold is reached.
 * This script is designed to be run as a PostToolUse hook to check after
 * each tool execution if context is getting too large.
 *
 * Configuration:
 * - COMPACT_THRESHOLD: Percentage (0-100) at which to trigger compact (default: 70)
 * - MAX_CONTEXT_TOKENS: Estimated max context window (default: 200000)
 *
 * Usage in hooks.json:
 * {
 *   "hooks": {
 *     "PostToolUse": [{
 *       "matcher": ".*",
 *       "hooks": [{
 *         "type": "command",
 *         "command": "node ${CLAUDE_PROJECT_DIR}/.claude/hooks/auto-compact.js"
 *       }]
 *     }]
 *   }
 * }
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Configuration
const COMPACT_THRESHOLD = parseInt(process.env.COMPACT_THRESHOLD || '70', 10);
const MAX_CONTEXT_TOKENS = parseInt(process.env.MAX_CONTEXT_TOKENS || '200000', 10);
const CHARS_PER_TOKEN = 4; // Rough estimate: ~4 characters per token

// State file to track last check and prevent rapid re-triggering
const STATE_FILE = path.join(process.env.HOME || process.env.USERPROFILE, '.claude', 'auto-compact-state.json');

/**
 * Parse input from Claude Code hook
 */
function parseInput() {
  try {
    const input = fs.readFileSync(0, 'utf8'); // Read from stdin
    return JSON.parse(input);
  } catch {
    return {};
  }
}

/**
 * Load state to prevent rapid re-triggering
 */
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch {
    // Ignore state errors
  }
  return { lastCompactSuggestion: 0, sessionId: null };
}

/**
 * Save state
 */
function saveState(state) {
  try {
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch {
    // Ignore state errors
  }
}

/**
 * Estimate token count from transcript file
 */
function estimateTokensFromTranscript(transcriptPath) {
  try {
    if (!transcriptPath || !fs.existsSync(transcriptPath)) {
      return 0;
    }

    const stats = fs.statSync(transcriptPath);
    const fileSizeBytes = stats.size;

    // Estimate: file size in bytes ≈ characters, divide by chars per token
    return Math.floor(fileSizeBytes / CHARS_PER_TOKEN);
  } catch {
    return 0;
  }
}

/**
 * Calculate context usage percentage
 */
function calculateUsagePercentage(estimatedTokens) {
  return (estimatedTokens / MAX_CONTEXT_TOKENS) * 100;
}

/**
 * Main function
 */
function main() {
  const input = parseInput();
  const state = loadState();

  // Get transcript path from input or environment
  const transcriptPath = input.transcript_path || process.env.CLAUDE_TRANSCRIPT_PATH;
  const sessionId = input.session_id || 'unknown';

  // Check if this is a new session (reset state)
  if (state.sessionId !== sessionId) {
    state.sessionId = sessionId;
    state.lastCompactSuggestion = 0;
    saveState(state);
  }

  // Estimate current context usage
  const estimatedTokens = estimateTokensFromTranscript(transcriptPath);
  const usagePercentage = calculateUsagePercentage(estimatedTokens);

  // Check if we've recently suggested compacting (within last 5 minutes)
  const now = Date.now();
  const cooldownMs = 5 * 60 * 1000; // 5 minutes
  const recentlySuggested = (now - state.lastCompactSuggestion) < cooldownMs;

  // Output status to stderr (visible to user but doesn't affect hook)
  if (process.env.CLAUDE_AUTO_COMPACT_DEBUG) {
    console.error(`[auto-compact] Tokens: ~${estimatedTokens.toLocaleString()} | Usage: ${usagePercentage.toFixed(1)}% | Threshold: ${COMPACT_THRESHOLD}%`);
  }

  // If usage exceeds threshold and we haven't recently suggested
  if (usagePercentage >= COMPACT_THRESHOLD && !recentlySuggested) {
    state.lastCompactSuggestion = now;
    saveState(state);

    // Output a message that will be shown to the user
    console.error(`\n⚠️  Context usage at ${usagePercentage.toFixed(0)}% (threshold: ${COMPACT_THRESHOLD}%)`);
    console.error(`   Consider running /compact to free up context space.\n`);

    // Return JSON to inject a suggestion into Claude's context
    // This is a soft suggestion, not a hard block
    const output = {
      result: 'continue',
      message: `Context usage is at ${usagePercentage.toFixed(0)}%. Consider running /compact to optimize context.`
    };

    console.log(JSON.stringify(output));
  }

  // Exit successfully (don't block)
  process.exit(0);
}

main();
