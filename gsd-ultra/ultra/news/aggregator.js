/**
 * News Aggregator
 *
 * Fetches and aggregates Claude/Anthropic news from multiple sources:
 * - RSS feeds (official Anthropic, tech news sites)
 * - Hacker News Algolia API
 * - Reddit JSON API
 *
 * Inspired by top AI newsletters:
 * - The Rundown AI, TLDR AI, The Neuron, AlphaSignal
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { XMLParser } from 'fast-xml-parser';
import {
  RSS_FEEDS,
  API_SOURCES,
  NEWS_CATEGORIES,
  getCredibilityScore,
  categorizeArticle,
  calculateRelevanceScore,
  isRelevant
} from './news-sources.js';
import { CONFIG } from './config-manager.js';
import { newsLogger as logger } from './logger.js';
import httpClient, { fetchAllSettled } from './http-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache configuration (from centralized config)
const CACHE_DIR = path.join(__dirname, '..', '..', 'knowledge-base', '.cache');
const AGGREGATED_CACHE_FILE = path.join(CACHE_DIR, 'aggregated-news.json');

// User agent for API requests (from centralized config)
const USER_AGENT = CONFIG.http.userAgent;

// XML Parser instance with options for RSS/Atom parsing
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  cdataPropName: '#cdata',
  parseAttributeValue: true,
  trimValues: true,
  processEntities: true,
  htmlEntities: true
});

/**
 * RSS/Atom Feed Parser using fast-xml-parser
 * Handles both RSS 2.0 and Atom feed formats properly
 */
async function parseRSSFeed(url, timeout = CONFIG.timeouts.rssFeed) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xml = await response.text();

    // Parse XML using fast-xml-parser
    let parsed;
    try {
      parsed = xmlParser.parse(xml);
    } catch (parseError) {
      logger.warn(`Malformed XML from ${url}: ${parseError.message}`);
      throw new Error(`Invalid XML: ${parseError.message}`);
    }

    const items = [];

    // Try RSS 2.0 format first
    if (parsed.rss?.channel?.item) {
      const rssItems = Array.isArray(parsed.rss.channel.item)
        ? parsed.rss.channel.item
        : [parsed.rss.channel.item];

      for (const item of rssItems) {
        items.push(parseRSSItem(item));
      }
    }
    // Try Atom format
    else if (parsed.feed?.entry) {
      const atomEntries = Array.isArray(parsed.feed.entry)
        ? parsed.feed.entry
        : [parsed.feed.entry];

      for (const entry of atomEntries) {
        items.push(parseAtomEntry(entry));
      }
    }
    // Try RDF/RSS 1.0 format
    else if (parsed['rdf:RDF']?.item) {
      const rdfItems = Array.isArray(parsed['rdf:RDF'].item)
        ? parsed['rdf:RDF'].item
        : [parsed['rdf:RDF'].item];

      for (const item of rdfItems) {
        items.push(parseRSSItem(item));
      }
    }
    else {
      logger.debug(`Unknown feed format from ${url}`, { keys: Object.keys(parsed) });
    }

    logger.debug(`Parsed ${items.length} items from ${url}`);
    return items;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Parse RSS 2.0 item
 */
function parseRSSItem(item) {
  return {
    title: extractText(item.title),
    link: extractText(item.link) || extractText(item.guid),
    description: cleanHtml(
      extractText(item.description) ||
      extractText(item['content:encoded']) ||
      ''
    ),
    pubDate: extractText(item.pubDate) || extractText(item['dc:date']),
    author: extractText(item.author) || extractText(item['dc:creator'])
  };
}

/**
 * Parse Atom entry
 */
function parseAtomEntry(entry) {
  // Atom link can be an object with href attribute or array of links
  let link = '';
  if (entry.link) {
    if (Array.isArray(entry.link)) {
      // Find the link with rel="alternate" or no rel attribute
      const altLink = entry.link.find(l =>
        !l['@_rel'] || l['@_rel'] === 'alternate'
      );
      link = altLink?.['@_href'] || entry.link[0]?.['@_href'] || '';
    } else if (typeof entry.link === 'object') {
      link = entry.link['@_href'] || '';
    } else {
      link = extractText(entry.link);
    }
  }

  return {
    title: extractText(entry.title),
    link,
    description: cleanHtml(
      extractText(entry.summary) ||
      extractText(entry.content) ||
      ''
    ),
    pubDate: extractText(entry.published) || extractText(entry.updated),
    author: entry.author?.name
      ? extractText(entry.author.name)
      : extractText(entry.author)
  };
}

/**
 * Extract text content from parsed XML value
 * Handles various formats: string, object with #text or #cdata, etc.
 */
function extractText(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);

  // Handle object with text or cdata content
  if (typeof value === 'object') {
    if (value['#cdata']) return String(value['#cdata']).trim();
    if (value['#text']) return String(value['#text']).trim();
    // Some feeds have content directly in the object
    if (value['@_type'] === 'html' && value['#text']) {
      return String(value['#text']).trim();
    }
  }

  return String(value).trim();
}

/**
 * Clean HTML tags from text
 */
function cleanHtml(text) {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 500);
}

/**
 * Fetch all RSS feeds in parallel using allSettled pattern
 * Partial failures don't break the entire fetch
 */
async function fetchAllRSSFeeds() {
  const feedEntries = Object.entries(RSS_FEEDS);

  // Use Promise.allSettled to handle partial failures gracefully
  const results = await Promise.allSettled(
    feedEntries.map(async ([key, feed]) => {
      const items = await parseRSSFeed(feed.url);
      return items.map(item => ({
        ...item,
        source: feed.name,
        sourceKey: key,
        sourceIcon: feed.icon,
        sourceCategory: feed.category,
        priority: feed.priority
      }));
    })
  );

  // Process results, logging failures
  const allItems = [];
  results.forEach((result, index) => {
    const [key, feed] = feedEntries[index];
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
      logger.debug(`Fetched ${result.value.length} items from ${feed.name}`);
    } else {
      logger.warn(`Failed to fetch ${feed.name}: ${result.reason?.message || 'Unknown error'}`);
    }
  });

  return allItems;
}

/**
 * Fetch from Hacker News Algolia API with retry logic
 */
async function fetchHackerNews() {
  const { baseUrl, searchEndpoint, queries } = API_SOURCES.hacker_news;
  const results = [];
  const seenUrls = new Set();

  // Build URLs for all queries
  const urls = queries.map(query =>
    `${baseUrl}${searchEndpoint}?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=${CONFIG.news.api.hackerNews.hitsPerPage}`
  );

  // Fetch all queries in parallel with allSettled
  const responses = await Promise.allSettled(
    urls.map(url => httpClient.getJson(url))
  );

  // Process results
  responses.forEach((result, index) => {
    if (result.status === 'rejected') {
      logger.warn(`HN query "${queries[index]}" failed: ${result.reason?.message}`);
      return;
    }

    const data = result.value;
    for (const hit of data.hits || []) {
      if (seenUrls.has(hit.url)) continue;
      seenUrls.add(hit.url);

      results.push({
        title: hit.title,
        link: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        description: hit.story_text || '',
        pubDate: new Date(hit.created_at).toISOString(),
        author: hit.author,
        source: 'Hacker News',
        sourceKey: 'hacker_news',
        sourceIcon: '🟠',
        sourceCategory: 'community',
        priority: 1,
        hnId: hit.objectID,
        points: hit.points,
        numComments: hit.num_comments
      });
    }
  });

  logger.debug(`Fetched ${results.length} items from Hacker News`);
  return results;
}

/**
 * Fetch from Reddit JSON API with retry logic
 */
async function fetchReddit() {
  const results = [];
  const seenIds = new Set();

  // Build all Reddit fetch requests
  const requests = [];
  for (const [key, source] of Object.entries(API_SOURCES).filter(([_, s]) => s.type === 'reddit')) {
    for (const endpoint of source.endpoints) {
      requests.push({
        url: `${source.baseUrl}${endpoint}?limit=${CONFIG.news.api.reddit.limit}`,
        key,
        source
      });
    }
  }

  // Fetch all Reddit endpoints in parallel with allSettled
  const responses = await Promise.allSettled(
    requests.map(req => httpClient.getJson(req.url))
  );

  // Process results
  responses.forEach((result, index) => {
    const { key, source } = requests[index];

    if (result.status === 'rejected') {
      logger.warn(`Reddit ${source.name} failed: ${result.reason?.message}`);
      return;
    }

    const data = result.value;
    for (const child of data?.data?.children || []) {
      const post = child.data;
      if (seenIds.has(post.id)) continue;
      seenIds.add(post.id);

      results.push({
        title: post.title,
        link: post.url.startsWith('http') ? post.url : `https://reddit.com${post.permalink}`,
        description: post.selftext || '',
        pubDate: new Date(post.created_utc * 1000).toISOString(),
        author: post.author,
        source: source.name,
        sourceKey: key,
        sourceIcon: '🔴',
        sourceCategory: 'community',
        priority: source.priority,
        redditId: post.id,
        score: post.score,
        numComments: post.num_comments,
        subreddit: post.subreddit
      });
    }
  });

  logger.debug(`Fetched ${results.length} items from Reddit`);
  return results;
}

/**
 * Process and enrich news items
 */
function processNewsItems(items) {
  const now = new Date();
  const recencyWindow = new Date(now - CONFIG.news.recencyWindow);

  return items
    .map(item => {
      // Parse and validate date
      let date;
      try {
        date = new Date(item.pubDate);
        if (isNaN(date.getTime())) date = now;
      } catch {
        date = now;
      }

      // Calculate scores
      const relevanceScore = calculateRelevanceScore(item.title, item.description);
      const credibilityScore = getCredibilityScore(item.link);
      const category = categorizeArticle(item.title, item.description, item.source);

      // Social engagement score (for HN/Reddit)
      const socialScore = (item.points || 0) + (item.score || 0) + ((item.numComments || 0) * 2);

      // Recency score (higher for newer)
      const ageHours = (now - date) / (1000 * 60 * 60);
      const recencyScore = Math.max(0, 100 - ageHours);

      // Combined score
      const totalScore = (relevanceScore * 3) + (credibilityScore * 2) + (socialScore * 0.1) + recencyScore;

      return {
        id: generateId(item.title, item.link),
        title: item.title,
        description: item.description.substring(0, 300),
        url: item.link,
        date: date.toISOString().split('T')[0],
        dateObj: date,
        author: item.author,
        source: item.source,
        sourceIcon: item.sourceIcon || '📰',
        category,
        categoryInfo: NEWS_CATEGORIES[category] || NEWS_CATEGORIES.product,
        icon: NEWS_CATEGORIES[category]?.icon || '📰',
        relevanceScore,
        credibilityScore,
        socialScore,
        recencyScore,
        totalScore,
        isRelevant: relevanceScore >= 10,
        hnId: item.hnId,
        redditId: item.redditId,
        points: item.points,
        numComments: item.numComments
      };
    })
    .filter(item => {
      // Filter: relevant to Claude/Anthropic and within 2 weeks
      return item.isRelevant && item.dateObj >= recencyWindow;
    })
    .sort((a, b) => b.totalScore - a.totalScore);
}

/**
 * Generate unique ID for news item
 */
function generateId(title, url) {
  const str = `${title}-${url}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Deduplicate news items by similarity
 */
function deduplicateNews(items) {
  const seen = new Map();
  const result = [];

  for (const item of items) {
    // Create normalized title for comparison
    const normalizedTitle = item.title.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Check for similar titles
    let isDuplicate = false;
    for (const [seenTitle, seenItem] of seen) {
      if (similarity(normalizedTitle, seenTitle) > CONFIG.news.similarityThreshold) {
        // Keep the one with higher score
        if (item.totalScore > seenItem.totalScore) {
          result[result.indexOf(seenItem)] = item;
          seen.delete(seenTitle);
          seen.set(normalizedTitle, item);
        }
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      seen.set(normalizedTitle, item);
      result.push(item);
    }
  }

  return result;
}

/**
 * Simple string similarity (Jaccard index on words)
 */
function similarity(str1, str2) {
  const set1 = new Set(str1.split(' '));
  const set2 = new Set(str2.split(' '));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

/**
 * Load cached news
 */
async function loadCache() {
  try {
    if (await fs.pathExists(AGGREGATED_CACHE_FILE)) {
      const cache = await fs.readJson(AGGREGATED_CACHE_FILE);
      if (Date.now() - cache.timestamp < CONFIG.news.cacheTtl) {
        return cache.news;
      }
    }
  } catch {
    // Ignore cache errors
  }
  return null;
}

/**
 * Save news to cache
 */
async function saveCache(news) {
  try {
    await fs.ensureDir(CACHE_DIR);
    await fs.writeJson(AGGREGATED_CACHE_FILE, {
      timestamp: Date.now(),
      fetchedAt: new Date().toISOString(),
      count: news.length,
      news
    }, { spaces: 2 });
  } catch {
    // Ignore cache errors
  }
}

/**
 * Main aggregation function
 * Fetches from all sources and returns curated news
 */
export async function aggregateNews(options = {}) {
  const { forceRefresh = false, limit = 20 } = options;

  // Check cache first
  if (!forceRefresh) {
    const cached = await loadCache();
    if (cached) {
      return cached.slice(0, limit);
    }
  }

  console.log('Aggregating news from all sources...');

  // Fetch from all sources in parallel
  const [rssItems, hnItems, redditItems] = await Promise.all([
    fetchAllRSSFeeds().catch(err => {
      console.error('RSS fetch failed:', err.message);
      return [];
    }),
    fetchHackerNews().catch(err => {
      console.error('HN fetch failed:', err.message);
      return [];
    }),
    fetchReddit().catch(err => {
      console.error('Reddit fetch failed:', err.message);
      return [];
    })
  ]);

  console.log(`Fetched: ${rssItems.length} RSS, ${hnItems.length} HN, ${redditItems.length} Reddit`);

  // Combine all items
  const allItems = [...rssItems, ...hnItems, ...redditItems];

  // Process, filter, and sort
  const processedItems = processNewsItems(allItems);

  // Deduplicate
  const uniqueItems = deduplicateNews(processedItems);

  console.log(`After filtering: ${uniqueItems.length} relevant items`);

  // Cache results
  await saveCache(uniqueItems);

  return uniqueItems.slice(0, limit);
}

/**
 * Get news by category
 */
export async function getNewsByCategory(category, limit = 5) {
  const allNews = await aggregateNews({ limit: 50 });
  return allNews.filter(item => item.category === category).slice(0, limit);
}

/**
 * Get featured/top story
 */
export async function getTopStory() {
  const allNews = await aggregateNews({ limit: 10 });
  return allNews[0] || null;
}

/**
 * Get news summary stats
 */
export async function getNewsStats() {
  const allNews = await aggregateNews({ limit: 100 });

  const byCategory = {};
  const bySource = {};

  for (const item of allNews) {
    byCategory[item.category] = (byCategory[item.category] || 0) + 1;
    bySource[item.source] = (bySource[item.source] || 0) + 1;
  }

  return {
    total: allNews.length,
    byCategory,
    bySource,
    latestDate: allNews[0]?.date,
    oldestDate: allNews[allNews.length - 1]?.date
  };
}

/**
 * Clear cache (force refresh on next fetch)
 */
export async function clearCache() {
  try {
    await fs.remove(AGGREGATED_CACHE_FILE);
    return true;
  } catch {
    return false;
  }
}

export default {
  aggregateNews,
  getNewsByCategory,
  getTopStory,
  getNewsStats,
  clearCache
};
