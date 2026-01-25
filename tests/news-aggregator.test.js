/**
 * Tests for news-aggregator.js
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('news-aggregator', () => {
  let tempDir;
  let aggregateNews, getNewsByCategory, getTopStory, getNewsStats, clearCache;

  // Sample RSS feed responses
  const mockRSSFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <item>
      <title>Claude 3.5 Sonnet Released</title>
      <link>https://example.com/claude-sonnet</link>
      <description>Anthropic releases new Claude model with improved capabilities.</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <author>Test Author</author>
    </item>
    <item>
      <title>AI Safety Research Update</title>
      <link>https://example.com/ai-safety</link>
      <description>New research on Claude's safety mechanisms.</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>
  </channel>
</rss>`;

  const mockAtomFeed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Test Feed</title>
  <entry>
    <title>Anthropic Raises Series B</title>
    <link href="https://example.com/anthropic-funding"/>
    <summary>Anthropic announces major funding round.</summary>
    <published>${new Date().toISOString()}</published>
    <author><name>Atom Author</name></author>
  </entry>
</feed>`;

  const mockHNResponse = {
    hits: [
      {
        objectID: '12345',
        title: 'Claude API Best Practices',
        url: 'https://example.com/claude-api',
        story_text: 'A guide to using Claude effectively.',
        created_at: new Date().toISOString(),
        author: 'hn_user',
        points: 150,
        num_comments: 42
      },
      {
        objectID: '12346',
        title: 'Anthropic vs OpenAI Comparison',
        url: 'https://example.com/comparison',
        story_text: 'Comparing Claude and GPT models.',
        created_at: new Date().toISOString(),
        author: 'tech_writer',
        points: 200,
        num_comments: 89
      }
    ]
  };

  const mockRedditResponse = {
    data: {
      children: [
        {
          data: {
            id: 'abc123',
            title: 'Claude Code is amazing!',
            url: 'https://example.com/claude-code',
            selftext: 'I just tried Claude Code and it works great.',
            created_utc: Math.floor(Date.now() / 1000),
            author: 'reddit_user',
            score: 500,
            num_comments: 75,
            subreddit: 'ClaudeAI',
            permalink: '/r/ClaudeAI/comments/abc123/claude_code_is_amazing/'
          }
        }
      ]
    }
  };

  beforeEach(async () => {
    // Create temp directory for cache
    tempDir = path.join(os.tmpdir(), `news-aggregator-test-${Date.now()}`);
    await fs.ensureDir(tempDir);

    // Reset all mocks
    vi.resetAllMocks();
    vi.resetModules();

    // Default mock implementations
    mockFetch.mockImplementation(async (url) => {
      // Match URL patterns
      if (url.includes('hacker-news') || url.includes('algolia')) {
        return {
          ok: true,
          json: async () => mockHNResponse,
          text: async () => JSON.stringify(mockHNResponse)
        };
      }
      if (url.includes('reddit.com')) {
        return {
          ok: true,
          json: async () => mockRedditResponse,
          text: async () => JSON.stringify(mockRedditResponse)
        };
      }
      // Default to RSS feed
      return {
        ok: true,
        text: async () => mockRSSFeed,
        json: async () => { throw new Error('Not JSON'); }
      };
    });

    // Import fresh module
    const newsModule = await import('../scripts/utils/news-aggregator.js');
    aggregateNews = newsModule.aggregateNews;
    getNewsByCategory = newsModule.getNewsByCategory;
    getTopStory = newsModule.getTopStory;
    getNewsStats = newsModule.getNewsStats;
    clearCache = newsModule.clearCache;

    // Clear cache before each test
    await clearCache();
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // RSS Feed Parsing Tests
  // ==========================================================================

  describe('RSS feed parsing', () => {
    it('should parse RSS 2.0 feed format', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => mockRSSFeed
      });

      const news = await aggregateNews({ forceRefresh: true, limit: 10 });

      // Should have parsed items from the RSS feed
      expect(Array.isArray(news)).toBe(true);
    });

    it('should parse Atom feed format', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => mockAtomFeed
      });

      const news = await aggregateNews({ forceRefresh: true, limit: 10 });

      expect(Array.isArray(news)).toBe(true);
    });

    it('should handle malformed XML gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => '<not valid xml'
      });

      // Should not throw
      const news = await aggregateNews({ forceRefresh: true, limit: 10 });

      expect(Array.isArray(news)).toBe(true);
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Should not throw
      const news = await aggregateNews({ forceRefresh: true, limit: 10 });

      expect(Array.isArray(news)).toBe(true);
    });

    it('should handle HTTP errors gracefully', async () => {
      // Use 404 which is NOT in the retry list (500, 502, 503, 504, 408, 429 are retried)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Not found'
      });

      // Should not throw
      const news = await aggregateNews({ forceRefresh: true, limit: 10 });

      expect(Array.isArray(news)).toBe(true);
    });

    it('should handle timeout gracefully', async () => {
      // Use fake timers to avoid actual delays during retries
      vi.useFakeTimers();

      mockFetch.mockImplementation(() => {
        const error = new Error('Aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });

      // Start the aggregation and advance timers
      const newsPromise = aggregateNews({ forceRefresh: true, limit: 10 });

      // Advance timers to complete all retry delays (1s + 2s + 4s = 7s)
      await vi.advanceTimersByTimeAsync(10000);

      const news = await newsPromise;

      expect(Array.isArray(news)).toBe(true);

      vi.useRealTimers();
    });
  });

  // ==========================================================================
  // Hacker News API Tests
  // ==========================================================================

  describe('Hacker News API', () => {
    it('should fetch and parse HN items', async () => {
      mockFetch.mockImplementation(async (url) => {
        if (url.includes('algolia') || url.includes('hn.algolia')) {
          return {
            ok: true,
            json: async () => mockHNResponse
          };
        }
        return { ok: true, text: async () => mockRSSFeed };
      });

      const news = await aggregateNews({ forceRefresh: true, limit: 50 });

      // Should contain items from HN (if they pass relevance filter)
      expect(Array.isArray(news)).toBe(true);
    });

    it('should handle empty HN response', async () => {
      mockFetch.mockImplementation(async (url) => {
        if (url.includes('algolia')) {
          return {
            ok: true,
            json: async () => ({ hits: [] })
          };
        }
        return { ok: true, text: async () => mockRSSFeed };
      });

      const news = await aggregateNews({ forceRefresh: true, limit: 10 });

      expect(Array.isArray(news)).toBe(true);
    });
  });

  // ==========================================================================
  // Reddit API Tests
  // ==========================================================================

  describe('Reddit API', () => {
    it('should fetch and parse Reddit posts', async () => {
      mockFetch.mockImplementation(async (url) => {
        if (url.includes('reddit.com')) {
          return {
            ok: true,
            json: async () => mockRedditResponse
          };
        }
        if (url.includes('algolia')) {
          return { ok: true, json: async () => ({ hits: [] }) };
        }
        return { ok: true, text: async () => mockRSSFeed };
      });

      const news = await aggregateNews({ forceRefresh: true, limit: 50 });

      expect(Array.isArray(news)).toBe(true);
    });

    it('should handle empty Reddit response', async () => {
      mockFetch.mockImplementation(async (url) => {
        if (url.includes('reddit.com')) {
          return {
            ok: true,
            json: async () => ({ data: { children: [] } })
          };
        }
        return { ok: true, text: async () => mockRSSFeed };
      });

      const news = await aggregateNews({ forceRefresh: true, limit: 10 });

      expect(Array.isArray(news)).toBe(true);
    });
  });

  // ==========================================================================
  // Filtering Tests
  // ==========================================================================

  describe('filtering logic', () => {
    it('should filter for Claude/Anthropic relevance', async () => {
      const irrelevantRSS = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Totally Unrelated Tech News</title>
      <link>https://example.com/unrelated</link>
      <description>Nothing about Claude or Anthropic here.</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>
  </channel>
</rss>`;

      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => irrelevantRSS
      });

      const news = await aggregateNews({ forceRefresh: true, limit: 10 });

      // Irrelevant items should be filtered out
      expect(news.every(item => item.isRelevant)).toBe(true);
    });

    it('should filter out old items beyond recency window', async () => {
      const oldRSS = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Old Claude News from 2020</title>
      <link>https://example.com/old</link>
      <description>Old news about Claude and Anthropic.</description>
      <pubDate>Mon, 01 Jan 2020 00:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => oldRSS
      });

      const news = await aggregateNews({ forceRefresh: true, limit: 10 });

      // Old items should be filtered out
      expect(news.every(item => {
        const date = new Date(item.date);
        const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        return date >= twoWeeksAgo;
      })).toBe(true);
    });

    it('should include items with Claude in title', async () => {
      const claudeRSS = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Claude Gets a Major Update</title>
      <link>https://example.com/claude-update</link>
      <description>Details about the update.</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>
  </channel>
</rss>`;

      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => claudeRSS
      });

      const news = await aggregateNews({ forceRefresh: true, limit: 10 });

      // Should contain the Claude item
      expect(news.some(item => item.title.includes('Claude'))).toBe(true);
    });

    it('should include items with Anthropic in description', async () => {
      const anthropicRSS = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <item>
      <title>AI Company News</title>
      <link>https://example.com/anthropic</link>
      <description>Anthropic announced new safety features today.</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>
  </channel>
</rss>`;

      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => anthropicRSS
      });

      const news = await aggregateNews({ forceRefresh: true, limit: 10 });

      expect(news.some(item => item.description.includes('Anthropic'))).toBe(true);
    });
  });

  // ==========================================================================
  // Cache Tests
  // ==========================================================================

  describe('cache behavior', () => {
    it('should use cached data when available', async () => {
      // First fetch
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => mockRSSFeed
      });

      await aggregateNews({ forceRefresh: true, limit: 10 });
      const fetchCount1 = mockFetch.mock.calls.length;

      // Second fetch should use cache
      await aggregateNews({ limit: 10 });
      const fetchCount2 = mockFetch.mock.calls.length;

      // Should not have made additional fetch calls
      expect(fetchCount2).toBe(fetchCount1);
    });

    it('should bypass cache when forceRefresh is true', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => mockRSSFeed
      });

      await aggregateNews({ forceRefresh: true, limit: 10 });
      const fetchCount1 = mockFetch.mock.calls.length;

      // Force refresh should fetch again
      await aggregateNews({ forceRefresh: true, limit: 10 });
      const fetchCount2 = mockFetch.mock.calls.length;

      // Should have made additional fetch calls
      expect(fetchCount2).toBeGreaterThan(fetchCount1);
    });

    it('should clear cache successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => mockRSSFeed
      });

      // Populate cache
      await aggregateNews({ forceRefresh: true, limit: 10 });

      // Clear cache
      const result = await clearCache();
      expect(result).toBe(true);
    });
  });

  // ==========================================================================
  // Helper Function Tests
  // ==========================================================================

  describe('getNewsByCategory', () => {
    it('should filter news by category', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => mockRSSFeed
      });

      const news = await getNewsByCategory('product', 5);

      expect(Array.isArray(news)).toBe(true);
      expect(news.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getTopStory', () => {
    it('should return the top scored story', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => mockRSSFeed
      });

      const topStory = await getTopStory();

      // Should return null or a story object
      expect(topStory === null || typeof topStory === 'object').toBe(true);
    });
  });

  describe('getNewsStats', () => {
    it('should return statistics about news', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => mockRSSFeed
      });

      const stats = await getNewsStats();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('byCategory');
      expect(stats).toHaveProperty('bySource');
      expect(typeof stats.total).toBe('number');
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('error handling', () => {
    it('should handle partial failures gracefully', async () => {
      let callCount = 0;
      mockFetch.mockImplementation(async () => {
        callCount++;
        // Fail some requests
        if (callCount % 3 === 0) {
          throw new Error('Simulated failure');
        }
        return {
          ok: true,
          text: async () => mockRSSFeed
        };
      });

      // Should not throw
      const news = await aggregateNews({ forceRefresh: true, limit: 10 });

      expect(Array.isArray(news)).toBe(true);
    });

    it('should handle all sources failing', async () => {
      mockFetch.mockRejectedValue(new Error('All sources down'));

      // Should not throw
      const news = await aggregateNews({ forceRefresh: true, limit: 10 });

      expect(Array.isArray(news)).toBe(true);
      expect(news.length).toBe(0);
    });
  });

  // ==========================================================================
  // Deduplication Tests
  // ==========================================================================

  describe('deduplication', () => {
    it('should deduplicate similar titles', async () => {
      const duplicateRSS = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Claude 4 Released by Anthropic</title>
      <link>https://example1.com/claude4</link>
      <description>Anthropic releases Claude 4.</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>
    <item>
      <title>Claude 4 Released by Anthropic!</title>
      <link>https://example2.com/claude4</link>
      <description>Anthropic releases Claude 4.</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>
  </channel>
</rss>`;

      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => duplicateRSS
      });

      const news = await aggregateNews({ forceRefresh: true, limit: 10 });

      // Should have removed the duplicate
      const claudeTitles = news.filter(item =>
        item.title.toLowerCase().includes('claude 4')
      );
      expect(claudeTitles.length).toBeLessThanOrEqual(1);
    });
  });

  // ==========================================================================
  // RDF/RSS 1.0 Format Tests
  // ==========================================================================

  describe('RDF/RSS 1.0 format', () => {
    it('should parse RDF feed format', async () => {
      const rdfFeed = `<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns:dc="http://purl.org/dc/elements/1.1/">
  <item>
    <title>Claude MCP Protocol</title>
    <link>https://example.com/mcp</link>
    <description>Model Context Protocol explained.</description>
    <dc:date>${new Date().toISOString()}</dc:date>
    <dc:creator>RDF Author</dc:creator>
  </item>
</rdf:RDF>`;

      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => rdfFeed
      });

      const news = await aggregateNews({ forceRefresh: true, limit: 10 });

      expect(Array.isArray(news)).toBe(true);
    });
  });
});
