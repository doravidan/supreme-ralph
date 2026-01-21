/**
 * HTTP Client with Retry Logic
 *
 * Provides a robust HTTP client with:
 * - Configurable retry count
 * - Exponential backoff
 * - Timeout configuration
 * - Request/response logging
 *
 * @module utils/http-client
 */

import { CONFIG } from './config-manager.js';
import { newsLogger as logger } from './logger.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

const DEFAULT_OPTIONS = {
  retries: CONFIG.http.retries || 3,
  retryDelay: CONFIG.http.retryDelay || 1000,
  timeout: CONFIG.http.timeout || 30000,
  backoffMultiplier: CONFIG.http.backoffMultiplier || 2,
  userAgent: CONFIG.http.userAgent || 'claude-init/1.0',
  retryOnStatus: [408, 429, 500, 502, 503, 504],
  retryOnNetworkError: true
};

// =============================================================================
// HTTP CLIENT CLASS
// =============================================================================

/**
 * HTTP Client with built-in retry logic
 */
class HttpClient {
  constructor(options = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Make an HTTP request with retry logic
   * @param {string} url - URL to fetch
   * @param {object} options - Fetch options
   * @returns {Promise<Response>} Fetch response
   */
  async fetch(url, options = {}) {
    const {
      retries,
      retryDelay,
      timeout,
      backoffMultiplier,
      userAgent,
      retryOnStatus,
      retryOnNetworkError
    } = { ...this.options, ...options };

    let lastError;
    let attempt = 0;

    while (attempt <= retries) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        logger.debug(`HTTP ${options.method || 'GET'} ${url} (attempt ${attempt + 1}/${retries + 1})`);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'User-Agent': userAgent,
            ...options.headers
          }
        });

        clearTimeout(timeoutId);

        // Check if we should retry based on status code
        if (!response.ok && retryOnStatus.includes(response.status)) {
          const retryable = attempt < retries;
          logger.debug(`HTTP ${response.status} from ${url}${retryable ? ' - will retry' : ''}`);

          if (retryable) {
            lastError = new Error(`HTTP ${response.status}`);
            lastError.status = response.status;
            lastError.retryable = true;
          } else {
            return response; // Return the failing response on last attempt
          }
        } else {
          // Success or non-retryable error
          if (response.ok) {
            logger.debug(`HTTP ${response.status} OK from ${url}`);
          }
          return response;
        }
      } catch (error) {
        clearTimeout(timeoutId);

        const isTimeout = error.name === 'AbortError';
        const isNetworkError = error.name === 'TypeError' || error.code === 'ENOTFOUND';

        if (isTimeout) {
          lastError = new Error(`Request timeout after ${timeout}ms`);
          lastError.timeout = true;
        } else {
          lastError = error;
        }

        const shouldRetry = retryOnNetworkError && (isTimeout || isNetworkError) && attempt < retries;

        logger.debug(`HTTP error for ${url}: ${error.message}${shouldRetry ? ' - will retry' : ''}`, {
          attempt: attempt + 1,
          maxRetries: retries + 1,
          isTimeout,
          isNetworkError
        });

        if (!shouldRetry) {
          throw lastError;
        }
      }

      // Wait before retrying with exponential backoff
      if (attempt < retries) {
        const delay = retryDelay * Math.pow(backoffMultiplier, attempt);
        logger.debug(`Waiting ${delay}ms before retry...`);
        await sleep(delay);
      }

      attempt++;
    }

    // Should not reach here, but just in case
    throw lastError || new Error('Request failed');
  }

  /**
   * GET request with retry logic
   * @param {string} url - URL to fetch
   * @param {object} options - Additional options
   * @returns {Promise<Response>}
   */
  async get(url, options = {}) {
    return this.fetch(url, { ...options, method: 'GET' });
  }

  /**
   * GET JSON with retry logic
   * @param {string} url - URL to fetch
   * @param {object} options - Additional options
   * @returns {Promise<object>} Parsed JSON
   */
  async getJson(url, options = {}) {
    const response = await this.get(url, options);

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.status = response.status;
      error.response = response;
      throw error;
    }

    return response.json();
  }

  /**
   * GET text with retry logic
   * @param {string} url - URL to fetch
   * @param {object} options - Additional options
   * @returns {Promise<string>} Response text
   */
  async getText(url, options = {}) {
    const response = await this.get(url, options);

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.status = response.status;
      error.response = response;
      throw error;
    }

    return response.text();
  }

  /**
   * POST request with retry logic
   * @param {string} url - URL to fetch
   * @param {object} body - Request body
   * @param {object} options - Additional options
   * @returns {Promise<Response>}
   */
  async post(url, body, options = {}) {
    const isJson = typeof body === 'object';

    return this.fetch(url, {
      ...options,
      method: 'POST',
      body: isJson ? JSON.stringify(body) : body,
      headers: {
        ...(isJson ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers
      }
    });
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with timeout (no retry)
 * @param {string} url - URL to fetch
 * @param {number} timeout - Timeout in ms
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function fetchWithTimeout(url, timeout = 30000, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch all URLs with allSettled pattern
 * Returns results for all URLs, even if some fail
 * @param {string[]} urls - URLs to fetch
 * @param {object} options - Fetch options
 * @returns {Promise<Array<{url: string, status: 'fulfilled'|'rejected', value?: any, reason?: Error}>>}
 */
export async function fetchAllSettled(urls, options = {}) {
  const client = new HttpClient(options);

  const results = await Promise.allSettled(
    urls.map(async url => {
      const response = await client.get(url);
      return {
        url,
        response,
        data: await response.text()
      };
    })
  );

  return results.map((result, index) => ({
    url: urls[index],
    ...result
  }));
}

/**
 * Fetch with retry - convenience function
 * @param {string} url - URL to fetch
 * @param {object} options - Options including retries, timeout, etc.
 * @returns {Promise<Response>}
 */
export async function fetchWithRetry(url, options = {}) {
  const client = new HttpClient(options);
  return client.fetch(url, options);
}

// =============================================================================
// EXPORTS
// =============================================================================

// Create default client instance
const defaultClient = new HttpClient();

export { HttpClient };
export default defaultClient;
