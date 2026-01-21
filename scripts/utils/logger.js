/**
 * Debug Logger Utility
 *
 * Provides leveled logging with configurable verbosity.
 * Logs are stored in memory and can be retrieved for diagnostics.
 *
 * @module utils/logger
 */

import chalk from 'chalk';

// =============================================================================
// LOG LEVELS
// =============================================================================

export const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4
};

// =============================================================================
// LOGGER CLASS
// =============================================================================

/**
 * Logger class with configurable verbosity and memory storage
 */
class Logger {
  constructor(options = {}) {
    this.level = LOG_LEVELS[options.level] ?? LOG_LEVELS.warn;
    this.prefix = options.prefix || '';
    this.useColors = options.useColors !== false;
    this.outputToConsole = options.outputToConsole !== false;

    // In-memory log storage for later retrieval
    this.logs = [];
    this.maxLogs = options.maxLogs || 1000;
  }

  /**
   * Set the current log level
   * @param {string} level - Log level name (debug, info, warn, error, silent)
   */
  setLevel(level) {
    if (LOG_LEVELS[level] !== undefined) {
      this.level = LOG_LEVELS[level];
    }
  }

  /**
   * Get the current log level name
   * @returns {string} Current log level
   */
  getLevel() {
    return Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === this.level) || 'warn';
  }

  /**
   * Store a log entry in memory
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {object} context - Additional context
   */
  _store(level, message, context = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    };

    this.logs.push(entry);

    // Trim if over limit
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Format a log message with prefix and optional color
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @returns {string} Formatted message
   */
  _format(level, message) {
    const prefix = this.prefix ? `[${this.prefix}] ` : '';
    const levelTag = `[${level.toUpperCase()}]`;

    if (!this.useColors) {
      return `${levelTag} ${prefix}${message}`;
    }

    switch (level) {
      case 'debug':
        return chalk.gray(`${levelTag} ${prefix}${message}`);
      case 'info':
        return chalk.blue(`${levelTag} ${prefix}${message}`);
      case 'warn':
        return chalk.yellow(`${levelTag} ${prefix}${message}`);
      case 'error':
        return chalk.red(`${levelTag} ${prefix}${message}`);
      default:
        return `${levelTag} ${prefix}${message}`;
    }
  }

  /**
   * Log at debug level
   * @param {string} message - Log message
   * @param {object} context - Additional context
   */
  debug(message, context = null) {
    this._store('debug', message, context);

    if (this.level <= LOG_LEVELS.debug && this.outputToConsole) {
      console.log(this._format('debug', message));
      if (context) console.log(chalk.gray('  Context:'), context);
    }
  }

  /**
   * Log at info level
   * @param {string} message - Log message
   * @param {object} context - Additional context
   */
  info(message, context = null) {
    this._store('info', message, context);

    if (this.level <= LOG_LEVELS.info && this.outputToConsole) {
      console.log(this._format('info', message));
      if (context) console.log('  Context:', context);
    }
  }

  /**
   * Log at warn level
   * @param {string} message - Log message
   * @param {object} context - Additional context
   */
  warn(message, context = null) {
    this._store('warn', message, context);

    if (this.level <= LOG_LEVELS.warn && this.outputToConsole) {
      console.warn(this._format('warn', message));
      if (context) console.warn('  Context:', context);
    }
  }

  /**
   * Log at error level
   * @param {string} message - Log message
   * @param {object} context - Additional context
   */
  error(message, context = null) {
    this._store('error', message, context);

    if (this.level <= LOG_LEVELS.error && this.outputToConsole) {
      console.error(this._format('error', message));
      if (context) console.error('  Context:', context);
    }
  }

  /**
   * Get all stored logs
   * @param {string} minLevel - Minimum log level to include
   * @returns {array} Array of log entries
   */
  getLogs(minLevel = 'debug') {
    const minLevelNum = LOG_LEVELS[minLevel] ?? LOG_LEVELS.debug;
    return this.logs.filter(entry => LOG_LEVELS[entry.level] >= minLevelNum);
  }

  /**
   * Get logs filtered by level
   * @param {string} level - Exact log level to filter
   * @returns {array} Array of log entries
   */
  getLogsByLevel(level) {
    return this.logs.filter(entry => entry.level === level);
  }

  /**
   * Get warnings (useful for analysis.warnings)
   * @returns {array} Array of warning messages
   */
  getWarnings() {
    return this.getLogsByLevel('warn').map(entry => entry.message);
  }

  /**
   * Get errors (useful for analysis.errors)
   * @returns {array} Array of error messages
   */
  getErrors() {
    return this.getLogsByLevel('error').map(entry => entry.message);
  }

  /**
   * Clear all stored logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Create a child logger with a new prefix
   * @param {string} prefix - Additional prefix for child logger
   * @returns {Logger} New logger instance
   */
  child(prefix) {
    const childPrefix = this.prefix ? `${this.prefix}:${prefix}` : prefix;
    return new Logger({
      level: this.getLevel(),
      prefix: childPrefix,
      useColors: this.useColors,
      outputToConsole: this.outputToConsole,
      maxLogs: this.maxLogs
    });
  }
}

// =============================================================================
// DEFAULT INSTANCE AND EXPORTS
// =============================================================================

// Default logger instance - level controlled by DEBUG env var
const defaultLevel = process.env.DEBUG === '1' || process.env.DEBUG === 'true'
  ? 'debug'
  : process.env.LOG_LEVEL || 'warn';

const defaultLogger = new Logger({
  level: defaultLevel,
  outputToConsole: process.env.LOG_OUTPUT !== 'false'
});

// Create pre-configured loggers for different modules
export const analyzerLogger = defaultLogger.child('analyzer');
export const setupLogger = defaultLogger.child('setup');
export const ralphLogger = defaultLogger.child('ralph');
export const newsLogger = defaultLogger.child('news');

/**
 * Create a new logger instance
 * @param {object} options - Logger options
 * @returns {Logger} New logger instance
 */
export function createLogger(options = {}) {
  return new Logger(options);
}

/**
 * Set global log level for default logger
 * @param {string} level - Log level name
 */
export function setLogLevel(level) {
  defaultLogger.setLevel(level);
}

export { Logger };
export default defaultLogger;
