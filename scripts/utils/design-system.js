/**
 * Design System
 * Centralized terminal output styling for the claude-init CLI
 *
 * Features:
 * - Multiple themes (default, light, dark, no-color)
 * - NO_COLOR environment variable support (https://no-color.org/)
 * - Theme-aware color functions
 * - Comprehensive icon set
 */

import chalk from 'chalk';
import ora from 'ora';

// =============================================================================
// THEME CONFIGURATION
// =============================================================================

/**
 * Theme definitions
 * Each theme defines colors for different semantic uses
 */
const THEMES = {
  default: {
    primary: chalk.blue,
    primaryBold: chalk.blue.bold,
    secondary: chalk.cyan,
    success: chalk.green,
    successBold: chalk.green.bold,
    warning: chalk.yellow,
    warningBold: chalk.yellow.bold,
    error: chalk.red,
    errorBold: chalk.red.bold,
    muted: chalk.gray,
    mutedDim: chalk.dim,
    bold: chalk.bold,
    dim: chalk.dim,
    inverse: chalk.inverse,
    underline: chalk.underline,
    highlight: chalk.bgYellow.black,
    code: chalk.cyan,
  },
  light: {
    primary: chalk.blue,
    primaryBold: chalk.blue.bold,
    secondary: chalk.cyan,
    success: chalk.green,
    successBold: chalk.green.bold,
    warning: chalk.yellow,
    warningBold: chalk.yellow.bold,
    error: chalk.red,
    errorBold: chalk.red.bold,
    muted: chalk.gray,
    mutedDim: chalk.dim,
    bold: chalk.bold,
    dim: chalk.dim,
    inverse: chalk.inverse,
    underline: chalk.underline,
    highlight: chalk.bgYellow.black,
    code: chalk.cyan,
  },
  dark: {
    primary: chalk.blueBright,
    primaryBold: chalk.blueBright.bold,
    secondary: chalk.cyanBright,
    success: chalk.greenBright,
    successBold: chalk.greenBright.bold,
    warning: chalk.yellowBright,
    warningBold: chalk.yellowBright.bold,
    error: chalk.redBright,
    errorBold: chalk.redBright.bold,
    muted: chalk.white,
    mutedDim: chalk.dim,
    bold: chalk.bold,
    dim: chalk.dim,
    inverse: chalk.inverse,
    underline: chalk.underline,
    highlight: chalk.bgYellowBright.black,
    code: chalk.cyanBright,
  },
  'no-color': {
    primary: (s) => s,
    primaryBold: (s) => s,
    secondary: (s) => s,
    success: (s) => s,
    successBold: (s) => s,
    warning: (s) => s,
    warningBold: (s) => s,
    error: (s) => s,
    errorBold: (s) => s,
    muted: (s) => s,
    mutedDim: (s) => s,
    bold: (s) => s,
    dim: (s) => s,
    inverse: (s) => s,
    underline: (s) => s,
    highlight: (s) => s,
    code: (s) => s,
  },
};

// =============================================================================
// THEME DETECTION
// =============================================================================

/**
 * Detect the current theme based on environment variables
 * @returns {string} Theme name
 */
function detectTheme() {
  // NO_COLOR standard: https://no-color.org/
  if (process.env.NO_COLOR !== undefined) {
    return 'no-color';
  }

  // FORCE_COLOR disables NO_COLOR
  if (process.env.FORCE_COLOR !== undefined) {
    return process.env.CLAUDE_INIT_THEME || 'default';
  }

  // Custom theme via environment variable
  if (process.env.CLAUDE_INIT_THEME) {
    const theme = process.env.CLAUDE_INIT_THEME;
    if (THEMES[theme]) {
      return theme;
    }
    console.warn(`Unknown theme '${theme}', using default`);
  }

  return 'default';
}

// Current theme state
let currentThemeName = detectTheme();
let currentTheme = THEMES[currentThemeName];

/**
 * Get current theme name
 * @returns {string} Current theme name
 */
export function getTheme() {
  return currentThemeName;
}

/**
 * Set the current theme
 * @param {string} themeName - Theme name (default, light, dark, no-color)
 * @returns {boolean} True if theme was set successfully
 */
export function setTheme(themeName) {
  if (THEMES[themeName]) {
    currentThemeName = themeName;
    currentTheme = THEMES[themeName];
    return true;
  }
  return false;
}

/**
 * Get available theme names
 * @returns {string[]} Array of theme names
 */
export function getAvailableThemes() {
  return Object.keys(THEMES);
}

// =============================================================================
// ICONS
// =============================================================================

/**
 * Comprehensive icon set covering all CLI use cases
 */
export const icons = {
  // Status indicators
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
  pending: '○',
  inProgress: '◐',
  complete: '●',

  // Change indicators
  add: '+',
  modify: '~',
  remove: '-',
  update: '↻',

  // File system
  file: '📄',
  folder: '📁',
  link: '🔗',
  config: '⚙️',

  // Features/Actions
  rocket: '🚀',
  search: '🔍',
  sync: '📚',
  schedule: '⏰',
  settings: '🔧',
  list: '📋',
  changelog: '📜',
  summary: '📊',
  tip: '💡',
  docs: '📖',
  calendar: '📅',
  announce: '📢',
  done: '✅',
  check: '✓',
  cross: '✗',

  // Arrows
  arrowRight: '→',
  arrowLeft: '←',
  arrowUp: '↑',
  arrowDown: '↓',
  chevronRight: '›',
  chevronLeft: '‹',

  // Special
  star: '★',
  heart: '♥',
  bullet: '•',
  dash: '─',
  ellipsis: '…',
  newBadge: '✨',

  // Technical
  branch: '⎇',
  commit: '○',
  merge: '⎌',
  tag: '⚑',
  debug: '🐛',
  test: '🧪',
  build: '🔨',
  deploy: '🚀',
  package: '📦',

  // User/Security
  user: '👤',
  lock: '🔒',
  key: '🔑',
  shield: '🛡️',
};

// =============================================================================
// COLOR FUNCTIONS
// =============================================================================

/**
 * Get theme-aware colors object
 * Colors automatically adapt to the current theme
 * @returns {object} Colors object
 */
function getColors() {
  return currentTheme;
}

/**
 * Legacy colors export (for backward compatibility)
 */
export const colors = new Proxy({}, {
  get: (_, prop) => currentTheme[prop]
});

// =============================================================================
// UI COMPONENTS
// =============================================================================

/**
 * Main UI object for terminal output
 */
export const ui = {
  /**
   * Get the current color palette
   */
  get colors() {
    return currentTheme;
  },

  /**
   * Icon constants
   */
  icons,

  // ===========================================================================
  // HEADERS
  // ===========================================================================

  /**
   * Print a main header
   * @param {string} text - Header text
   * @param {string} iconKey - Optional icon key
   */
  header: (text, iconKey) => {
    const icon = icons[iconKey] ? `${icons[iconKey]} ` : '';
    console.log(currentTheme.primaryBold(`\n${icon}${text}\n`));
  },

  /**
   * Print a subheader
   * @param {string} text - Subheader text
   * @param {string} iconKey - Optional icon key
   */
  subheader: (text, iconKey) => {
    const icon = icons[iconKey] ? `${icons[iconKey]} ` : '';
    console.log(currentTheme.bold(`\n${icon}${text}`));
  },

  /**
   * Print a section header with divider
   * @param {string} text - Section text
   */
  section: (text) => {
    console.log(currentTheme.primaryBold(`\n── ${text} ──`));
  },

  // ===========================================================================
  // STATUS MESSAGES
  // ===========================================================================

  /**
   * Print a success message with checkmark
   */
  success: (text) => console.log(currentTheme.success(`${icons.success} ${text}`)),

  /**
   * Print an error message with cross
   */
  error: (text) => console.log(currentTheme.error(`${icons.error} ${text}`)),

  /**
   * Print a warning message with warning icon
   */
  warning: (text) => console.log(currentTheme.warning(`${icons.warning} ${text}`)),

  /**
   * Print an info message
   */
  info: (text) => console.log(currentTheme.primary(`${icons.info} ${text}`)),

  /**
   * Print muted text
   */
  muted: (text) => console.log(currentTheme.muted(text)),

  // ===========================================================================
  // STATUS MESSAGES WITHOUT ICONS
  // ===========================================================================

  successText: (text) => console.log(currentTheme.success(text)),
  errorText: (text) => console.log(currentTheme.error(text)),
  warningText: (text) => console.log(currentTheme.warning(text)),
  infoText: (text) => console.log(currentTheme.primary(text)),
  mutedText: (text) => console.log(currentTheme.muted(text)),

  // ===========================================================================
  // SPECIAL MESSAGES
  // ===========================================================================

  /**
   * Print a tip/recommendation
   */
  tip: (text) => console.log(currentTheme.primary(`${icons.tip} ${text}`)),

  /**
   * Print code/command
   */
  code: (text) => console.log(currentTheme.code(`  ${text}`)),

  /**
   * Print a highlighted message
   */
  highlight: (text) => console.log(currentTheme.highlight(text)),

  // ===========================================================================
  // CHANGE LIST ITEMS
  // ===========================================================================

  added: (text) => console.log(currentTheme.success(`    ${icons.add} ${text}`)),
  modified: (text) => console.log(currentTheme.warning(`    ${icons.modify} ${text}`)),
  removed: (text) => console.log(currentTheme.error(`    ${icons.remove} ${text}`)),
  updated: (text) => console.log(currentTheme.primary(`    ${icons.update} ${text}`)),

  // ===========================================================================
  // FILE TREE ITEMS
  // ===========================================================================

  fileItem: (name, prefix = '') => console.log(currentTheme.muted(`${prefix}${icons.file} ${name}`)),
  folderItem: (name, prefix = '') => console.log(currentTheme.primary(`${prefix}${icons.folder} ${name}/`)),
  linkItem: (name, prefix = '') => console.log(currentTheme.secondary(`${prefix}${icons.link} ${name}`)),

  // ===========================================================================
  // LISTS
  // ===========================================================================

  /**
   * Print a bullet list item
   */
  bullet: (text, indent = 0) => {
    const prefix = '  '.repeat(indent);
    console.log(`${prefix}${icons.bullet} ${text}`);
  },

  /**
   * Print a numbered list item
   */
  numbered: (number, text, indent = 0) => {
    const prefix = '  '.repeat(indent);
    console.log(`${prefix}${number}. ${text}`);
  },

  // ===========================================================================
  // PROGRESS/STATUS INDICATORS
  // ===========================================================================

  /**
   * Print a pending item
   */
  pending: (text) => console.log(currentTheme.muted(`${icons.pending} ${text}`)),

  /**
   * Print an in-progress item
   */
  inProgress: (text) => console.log(currentTheme.primary(`${icons.inProgress} ${text}`)),

  /**
   * Print a completed item
   */
  completed: (text) => console.log(currentTheme.success(`${icons.complete} ${text}`)),

  // ===========================================================================
  // UTILITY
  // ===========================================================================

  /**
   * Print a divider line
   */
  divider: (length = 40) => console.log(currentTheme.muted('─'.repeat(length))),

  /**
   * Print a double divider line
   */
  doubleDivider: (length = 40) => console.log(currentTheme.muted('═'.repeat(length))),

  /**
   * Print a blank line
   */
  blank: () => console.log(),

  /**
   * Print a newline
   */
  newline: () => console.log(),

  /**
   * Create a spinner instance
   */
  spinner: (text) => ora(text),

  /**
   * Print raw text (no formatting)
   */
  raw: (text) => console.log(text),

  // ===========================================================================
  // THEME CONTROL
  // ===========================================================================

  /**
   * Get current theme name
   */
  getTheme,

  /**
   * Set current theme
   */
  setTheme,

  /**
   * Get available themes
   */
  getAvailableThemes,

  /**
   * Check if colors are enabled
   */
  hasColors: () => currentThemeName !== 'no-color',
};

// =============================================================================
// EXPORTS
// =============================================================================

export default ui;
