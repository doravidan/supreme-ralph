/**
 * Tests for config-manager.js
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// We need to mock process.env before importing config-manager
describe('config-manager', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    // Clear any CLAUDE_INIT related env vars
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('COMPACT_') || key.startsWith('RALPH_') ||
          key.startsWith('TIMEOUT_') || key.startsWith('NEWS_') ||
          key.startsWith('HTTP_') || key.startsWith('ANALYSIS_') ||
          key.startsWith('UPDATE_') || key.startsWith('MAX_') ||
          key.startsWith('CHARS_')) {
        delete process.env[key];
      }
    });
    // Reset modules to re-import with clean env
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  describe('CONFIG defaults', () => {
    it('should have correct default compact threshold', async () => {
      const { CONFIG } = await import('../scripts/utils/config-manager.js');
      expect(CONFIG.compact.threshold).toBe(70);
    });

    it('should have correct default max context tokens', async () => {
      const { CONFIG } = await import('../scripts/utils/config-manager.js');
      expect(CONFIG.compact.maxContextTokens).toBe(200000);
    });

    it('should have correct default ralph iterations', async () => {
      const { CONFIG } = await import('../scripts/utils/config-manager.js');
      expect(CONFIG.ralph.defaultMaxIterations).toBe(10);
    });

    it('should have correct default RSS feed timeout', async () => {
      const { CONFIG } = await import('../scripts/utils/config-manager.js');
      expect(CONFIG.timeouts.rssFeed).toBe(10000);
    });

    it('should have correct default news cache TTL', async () => {
      const { CONFIG } = await import('../scripts/utils/config-manager.js');
      expect(CONFIG.news.cacheTtl).toBe(2 * 60 * 60 * 1000); // 2 hours
    });

    it('should have correct default HTTP retries', async () => {
      const { CONFIG } = await import('../scripts/utils/config-manager.js');
      expect(CONFIG.http.retries).toBe(3);
    });
  });

  describe('environment variable overrides', () => {
    it('should override compact threshold from env', async () => {
      process.env.COMPACT_THRESHOLD = '80';
      const { CONFIG } = await import('../scripts/utils/config-manager.js');
      expect(CONFIG.compact.threshold).toBe(80);
    });

    it('should override ralph iterations from env', async () => {
      process.env.RALPH_MAX_ITERATIONS = '20';
      const { CONFIG } = await import('../scripts/utils/config-manager.js');
      expect(CONFIG.ralph.defaultMaxIterations).toBe(20);
    });

    it('should override HTTP retries from env', async () => {
      process.env.HTTP_RETRIES = '5';
      const { CONFIG } = await import('../scripts/utils/config-manager.js');
      expect(CONFIG.http.retries).toBe(5);
    });

    it('should handle invalid number gracefully', async () => {
      process.env.COMPACT_THRESHOLD = 'invalid';
      const { CONFIG } = await import('../scripts/utils/config-manager.js');
      expect(CONFIG.compact.threshold).toBe(70); // Falls back to default
    });
  });

  describe('getConfig helper', () => {
    it('should get nested config value', async () => {
      const { getConfig } = await import('../scripts/utils/config-manager.js');
      expect(getConfig('compact.threshold')).toBe(70);
    });

    it('should get deeply nested config value', async () => {
      const { getConfig } = await import('../scripts/utils/config-manager.js');
      expect(getConfig('news.api.hackerNews.hitsPerPage')).toBe(30);
    });

    it('should return default for missing path', async () => {
      const { getConfig } = await import('../scripts/utils/config-manager.js');
      expect(getConfig('nonexistent.path', 'default')).toBe('default');
    });

    it('should return undefined for missing path without default', async () => {
      const { getConfig } = await import('../scripts/utils/config-manager.js');
      expect(getConfig('nonexistent.path')).toBeUndefined();
    });
  });

  describe('getFlatConfig helper', () => {
    it('should return flattened config object', async () => {
      const { getFlatConfig } = await import('../scripts/utils/config-manager.js');
      const flat = getFlatConfig();
      expect(flat['compact.threshold']).toBe(70);
      expect(flat['news.cacheTtl']).toBe(2 * 60 * 60 * 1000);
      expect(flat['http.retries']).toBe(3);
    });

    it('should include all config paths', async () => {
      const { getFlatConfig } = await import('../scripts/utils/config-manager.js');
      const flat = getFlatConfig();
      const keys = Object.keys(flat);
      expect(keys).toContain('compact.threshold');
      expect(keys).toContain('ralph.defaultMaxIterations');
      expect(keys).toContain('timeouts.rssFeed');
      expect(keys).toContain('news.cacheTtl');
      expect(keys).toContain('http.timeout');
    });
  });

  describe('CONFIG structure', () => {
    it('should have all required sections', async () => {
      const { CONFIG } = await import('../scripts/utils/config-manager.js');
      expect(CONFIG).toHaveProperty('compact');
      expect(CONFIG).toHaveProperty('ralph');
      expect(CONFIG).toHaveProperty('timeouts');
      expect(CONFIG).toHaveProperty('news');
      expect(CONFIG).toHaveProperty('analysis');
      expect(CONFIG).toHaveProperty('updates');
      expect(CONFIG).toHaveProperty('http');
    });

    it('should have valid compact config', async () => {
      const { CONFIG } = await import('../scripts/utils/config-manager.js');
      expect(CONFIG.compact.threshold).toBeGreaterThanOrEqual(1);
      expect(CONFIG.compact.threshold).toBeLessThanOrEqual(100);
      expect(CONFIG.compact.maxContextTokens).toBeGreaterThan(0);
      expect(CONFIG.compact.charsPerToken).toBeGreaterThan(0);
    });

    it('should have valid timeout config', async () => {
      const { CONFIG } = await import('../scripts/utils/config-manager.js');
      expect(CONFIG.timeouts.rssFeed).toBeGreaterThanOrEqual(1000);
      expect(CONFIG.timeouts.docFetch).toBeGreaterThanOrEqual(1000);
    });

    it('should have valid news config', async () => {
      const { CONFIG } = await import('../scripts/utils/config-manager.js');
      expect(CONFIG.news.similarityThreshold).toBeGreaterThanOrEqual(0);
      expect(CONFIG.news.similarityThreshold).toBeLessThanOrEqual(1);
    });
  });
});
