/**
 * Centralized Configuration Manager
 *
 * All configuration constants for claude-init are defined here.
 * Values can be overridden via environment variables.
 *
 * @module config-manager
 */

/**
 * Get environment variable with fallback to default
 * @param {string} envVar - Environment variable name
 * @param {*} defaultValue - Default value if env var not set
 * @returns {*} The value (parsed as number if numeric)
 */
function getEnv(envVar, defaultValue) {
  const value = process.env[envVar];
  if (value === undefined) return defaultValue;

  // Try to parse as number if default is a number
  if (typeof defaultValue === 'number') {
    const parsed = Number(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  // Parse boolean strings
  if (typeof defaultValue === 'boolean') {
    return value === 'true' || value === '1';
  }

  return value;
}

/**
 * Validate configuration values
 * @param {object} config - Configuration object to validate
 * @throws {Error} If validation fails
 */
function validateConfig(config) {
  const errors = [];

  // Compact threshold must be 1-100
  if (config.compact.threshold < 1 || config.compact.threshold > 100) {
    errors.push(`compact.threshold must be 1-100, got ${config.compact.threshold}`);
  }

  // Max iterations must be positive
  if (config.ralph.defaultMaxIterations < 1) {
    errors.push(`ralph.defaultMaxIterations must be >= 1, got ${config.ralph.defaultMaxIterations}`);
  }

  // Timeouts must be positive
  if (config.timeouts.rssFeed < 1000) {
    errors.push(`timeouts.rssFeed must be >= 1000ms, got ${config.timeouts.rssFeed}`);
  }

  // Cache TTL must be reasonable (at least 1 minute)
  if (config.news.cacheTtl < 60 * 1000) {
    errors.push(`news.cacheTtl must be >= 60000ms, got ${config.news.cacheTtl}`);
  }

  // Similarity threshold must be 0-1
  if (config.news.similarityThreshold < 0 || config.news.similarityThreshold > 1) {
    errors.push(`news.similarityThreshold must be 0-1, got ${config.news.similarityThreshold}`);
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n  - ${errors.join('\n  - ')}`);
  }
}

/**
 * Main configuration object
 * All values can be overridden via environment variables prefixed with CLAUDE_INIT_
 */
export const CONFIG = {
  // ===========================================
  // Context Management
  // ===========================================
  compact: {
    /** Auto-compact threshold percentage (1-100) */
    threshold: getEnv('COMPACT_THRESHOLD', 70),

    /** Maximum context tokens before compaction */
    maxContextTokens: getEnv('MAX_CONTEXT_TOKENS', 200000),

    /** Estimated characters per token for size calculation */
    charsPerToken: getEnv('CHARS_PER_TOKEN', 4),

    /** Cooldown between auto-compact warnings (ms) */
    cooldown: getEnv('COMPACT_COOLDOWN', 5 * 60 * 1000), // 5 minutes
  },

  // ===========================================
  // RALPH Autonomous Agent
  // ===========================================
  ralph: {
    /** Default maximum iterations per run */
    defaultMaxIterations: getEnv('RALPH_MAX_ITERATIONS', 10),
  },

  // ===========================================
  // Timeouts (milliseconds)
  // ===========================================
  timeouts: {
    /** RSS feed fetch timeout */
    rssFeed: getEnv('TIMEOUT_RSS_FEED', 10000), // 10 seconds

    /** Documentation fetch timeout */
    docFetch: getEnv('TIMEOUT_DOC_FETCH', 30000), // 30 seconds

    /** Lint hook execution timeout (seconds for bash) */
    lintHook: getEnv('TIMEOUT_LINT_HOOK', 30),

    /** Auto-compact hook timeout (seconds for bash) */
    autoCompactHook: getEnv('TIMEOUT_AUTO_COMPACT_HOOK', 5),

    /** Validate bash hook timeout (seconds for bash) */
    validateBashHook: getEnv('TIMEOUT_VALIDATE_BASH_HOOK', 5),
  },

  // ===========================================
  // News Aggregation
  // ===========================================
  news: {
    /** Cache time-to-live (ms) */
    cacheTtl: getEnv('NEWS_CACHE_TTL', 2 * 60 * 60 * 1000), // 2 hours

    /** Default news items limit */
    defaultLimit: getEnv('NEWS_DEFAULT_LIMIT', 20),

    /** CLI default news limit */
    cliDefaultLimit: getEnv('NEWS_CLI_LIMIT', 10),

    /** News recency window - only show news newer than this (ms) */
    recencyWindow: getEnv('NEWS_RECENCY_WINDOW', 14 * 24 * 60 * 60 * 1000), // 14 days

    /** Minimum relevance score for filtering */
    relevanceThreshold: getEnv('NEWS_RELEVANCE_THRESHOLD', 10),

    /** Jaccard similarity threshold for deduplication (0-1) */
    similarityThreshold: getEnv('NEWS_SIMILARITY_THRESHOLD', 0.8),

    /** API-specific pagination settings */
    api: {
      hackerNews: {
        hitsPerPage: getEnv('NEWS_HN_HITS_PER_PAGE', 30),
      },
      reddit: {
        limit: getEnv('NEWS_REDDIT_LIMIT', 50),
      },
    },

    /** Newsletter section maximum items */
    sections: {
      featured: getEnv('NEWS_SECTION_FEATURED', 1),
      headlines: getEnv('NEWS_SECTION_HEADLINES', 4),
      productUpdates: getEnv('NEWS_SECTION_PRODUCT', 3),
      communityBuzz: getEnv('NEWS_SECTION_COMMUNITY', 3),
      deepDive: getEnv('NEWS_SECTION_DEEP_DIVE', 1),
      quickLinks: getEnv('NEWS_SECTION_QUICK_LINKS', 5),
    },
  },

  // ===========================================
  // Project Analysis
  // ===========================================
  analysis: {
    /** Maximum depth for markdown file scanning */
    markdownScanDepth: getEnv('ANALYSIS_MARKDOWN_DEPTH', 3),

    /** Maximum depth for directory tree building */
    directoryScanDepth: getEnv('ANALYSIS_DIRECTORY_DEPTH', 2),

    /** Top N production dependencies to analyze */
    topProductionDeps: getEnv('ANALYSIS_TOP_PROD_DEPS', 15),

    /** Top N dev dependencies to analyze */
    topDevDeps: getEnv('ANALYSIS_TOP_DEV_DEPS', 10),

    /** Truncation length for script names in output */
    scriptTruncateLength: getEnv('ANALYSIS_SCRIPT_TRUNCATE', 12),
  },

  // ===========================================
  // Diff Checker / Updates
  // ===========================================
  updates: {
    /** Default lookback window for checking updates (ms) */
    lookbackWindow: getEnv('UPDATE_LOOKBACK', 24 * 60 * 60 * 1000), // 24 hours
  },

  // ===========================================
  // HTTP Client
  // ===========================================
  http: {
    /** Default retry count for failed requests */
    retries: getEnv('HTTP_RETRIES', 3),

    /** Base delay for exponential backoff (ms) */
    retryDelay: getEnv('HTTP_RETRY_DELAY', 1000),

    /** Backoff multiplier for exponential backoff */
    backoffMultiplier: getEnv('HTTP_BACKOFF_MULTIPLIER', 2),

    /** Default request timeout (ms) */
    timeout: getEnv('HTTP_TIMEOUT', 30000), // 30 seconds

    /** User agent string for requests */
    userAgent: getEnv('HTTP_USER_AGENT', 'claude-init-news-aggregator/1.0'),
  },
};

// Validate configuration on load
try {
  validateConfig(CONFIG);
} catch (error) {
  console.error('Configuration error:', error.message);
  process.exit(1);
}

/**
 * Get a nested config value by path
 * @param {string} path - Dot-separated path (e.g., 'news.cacheTtl')
 * @param {*} defaultValue - Default if path not found
 * @returns {*} The config value
 */
export function getConfig(path, defaultValue = undefined) {
  const parts = path.split('.');
  let value = CONFIG;

  for (const part of parts) {
    if (value === undefined || value === null) return defaultValue;
    value = value[part];
  }

  return value !== undefined ? value : defaultValue;
}

/**
 * Get all config values as a flat object for logging/debugging
 * @returns {object} Flattened config
 */
export function getFlatConfig() {
  const flat = {};

  function flatten(obj, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        flatten(value, path);
      } else {
        flat[path] = value;
      }
    }
  }

  flatten(CONFIG);
  return flat;
}

/**
 * Print configuration for debugging
 */
export function printConfig() {
  console.log('\n=== Claude-Init Configuration ===\n');
  const flat = getFlatConfig();
  const maxKeyLen = Math.max(...Object.keys(flat).map(k => k.length));

  for (const [key, value] of Object.entries(flat)) {
    console.log(`  ${key.padEnd(maxKeyLen)} : ${value}`);
  }
  console.log('\n');
}

export default CONFIG;
