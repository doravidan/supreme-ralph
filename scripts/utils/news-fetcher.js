/**
 * News Fetcher Utility
 *
 * Professional newsletter-style news aggregation for Claude/Anthropic content.
 * Inspired by top AI newsletters: The Rundown AI, TLDR AI, The Neuron, AlphaSignal
 *
 * Features:
 * - Multi-source aggregation (RSS, HN Algolia, Reddit)
 * - Relevance scoring and filtering
 * - Deduplication and curation
 * - Newsletter-ready HTML/text generation
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { aggregateNews, getTopStory, getNewsByCategory, getNewsStats } from './news-aggregator.js';
import { NEWS_CATEGORIES, NEWSLETTER_SECTIONS } from './news-sources.js';
import { CONFIG } from './config-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache file for news to avoid excessive API calls (using centralized config)
const CACHE_DIR = path.join(__dirname, '..', '..', 'knowledge-base', '.cache');
const NEWS_CACHE_FILE = path.join(CACHE_DIR, 'news-cache.json');

/**
 * Fallback curated news items (used when API fetching fails)
 * Updated periodically from web searches
 */
const CURATED_NEWS = [
  {
    id: 'cowork-launch',
    title: 'Claude Cowork: The AI Tool That Built Itself',
    description: 'Anthropic\'s viral new Cowork tool was built entirely by Claude Code — a milestone in "vibe coding" where AI writes production software with human guidance.',
    source: 'Axios',
    url: 'https://www.axios.com/2026/01/13/anthropic-claude-code-cowork-vibe-coding',
    category: 'product',
    date: '2026-01-13',
    icon: '🚀'
  },
  {
    id: 'one-hour-google',
    title: 'Claude Code Matches Year-Long Google Project in 60 Minutes',
    description: 'A Google engineer documented Claude Code reproducing a complex distributed system architecture in one hour that her team spent a full year building. The post went viral with 5.4M views.',
    source: 'The Decoder',
    url: 'https://the-decoder.com/google-engineer-says-claude-code-built-in-one-hour-what-her-team-spent-a-year-on/',
    category: 'viral',
    date: '2026-01-16',
    icon: '⚡'
  },
  {
    id: 'ten-billion-funding',
    title: 'Anthropic Raises $10B at $350B Valuation',
    description: 'Anthropic closes massive funding round led by GIC and Coatue. Sequoia breaks VC taboo by investing despite backing OpenAI and xAI. Revenue on track for $20-26B ARR in 2026.',
    source: 'TechCrunch',
    url: 'https://techcrunch.com/2026/01/07/anthropic-reportedly-raising-10b-at-350b-valuation/',
    category: 'business',
    date: '2026-01-07',
    icon: '💰'
  },
  {
    id: 'mcp-tool-search',
    title: 'New MCP Tool Search: Dynamic Tool Loading',
    description: 'Claude Code now dynamically discovers and loads MCP tools on demand. Token usage dropped from ~134k to ~5k in testing. Opus 4.5 accuracy jumped from 79.5% to 88.1%.',
    source: 'VentureBeat',
    url: 'https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features/',
    category: 'product',
    date: '2026-01-15',
    icon: '🔌'
  },
  {
    id: 'vibe-coding-mainstream',
    title: 'Vibe Coding Goes Mainstream: 41% of Code Now AI-Generated',
    description: 'Industry data shows 41% of all global code is now AI-generated. Among Y Combinator startups, 21% have codebases that are 91%+ AI-generated. Claude Code leads the charge.',
    source: 'Verdict',
    url: 'https://www.verdict.co.uk/vibe-coding-mainstream-in-2026/',
    category: 'viral',
    date: '2026-01-08',
    icon: '📈'
  },
  {
    id: 'creator-workflow',
    title: 'Boris Cherny\'s Claude Code Workflow Goes Viral',
    description: 'The creator of Claude Code shared his workflow: "5 Claudes in parallel" with numbered tabs. The post hit 4.4M views and 20K likes, sparking industry-wide discussion.',
    source: 'VentureBeat',
    url: 'https://venturebeat.com/technology/the-creator-of-claude-code-just-revealed-his-workflow-and-developers-are',
    category: 'community',
    date: '2026-01-05',
    icon: '🔥'
  },
  {
    id: 'healthcare-launch',
    title: 'Claude for Healthcare Announced',
    description: 'Anthropic launches Claude for Healthcare with secure health record access. Pro and Max subscribers can connect lab results and health data via HealthEx integration.',
    source: 'TechCrunch',
    url: 'https://techcrunch.com/2026/01/12/anthropic-announces-claude-for-healthcare-following-openais-chatgpt-health-reveal/',
    category: 'product',
    date: '2026-01-12',
    icon: '🏥'
  },
  {
    id: 'karpathy-earthquake',
    title: 'Karpathy: "Magnitude 9 Earthquake" for Programming',
    description: 'Andrej Karpathy\'s viral post (14M views) warns engineers slow to adapt risk being left behind. Calls Claude Code "the first convincing demonstration of what an LLM Agent looks like."',
    source: 'X/Twitter',
    url: 'https://x.com/karpathy/status/2004607146781278521',
    category: 'viral',
    date: '2026-01-06',
    icon: '🌋'
  },
  {
    id: 'claude-code-2.1',
    title: 'Claude Code 2.1.0: 1,096 Commits, Major Features',
    description: 'Major update with Automatic Skill Hot-Reload, Skill Context Forking, LSP tool for code intelligence, and critical OAuth security fix. Smoother workflows and smarter agents.',
    source: 'GitHub Changelog',
    url: 'https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md',
    category: 'changelog',
    date: '2026-01-07',
    icon: '📋'
  },
  {
    id: 'allianz-enterprise',
    title: 'Allianz Deploys Claude Code to All Employees',
    description: 'Global insurance giant makes Claude Code available company-wide, building custom AI agents for multistep workflows. First major enterprise deal of 2026.',
    source: 'TechCrunch',
    url: 'https://techcrunch.com/2026/01/09/anthropic-adds-allianz-to-growing-list-of-enterprise-wins/',
    category: 'business',
    date: '2026-01-09',
    icon: '🏢'
  },
  {
    id: 'ralph-wiggum',
    title: 'Ralph Wiggum Plugin: Autonomous Night Shifts',
    description: 'The quirky Simpsons-named plugin enables Claude Code to run autonomously for hours. Users report "shipping 6 repos overnight" and "$50k contracts for $297 in API costs."',
    source: 'VentureBeat',
    url: 'https://venturebeat.com/technology/how-ralph-wiggum-went-from-the-simpsons-to-the-biggest-name-in-ai-right-now/',
    category: 'community',
    date: '2026-01-10',
    icon: '🌙'
  },
  {
    id: 'mcp-100m-downloads',
    title: 'MCP Hits 100 Million Monthly Downloads',
    description: 'Model Context Protocol reaches milestone, becoming industry standard for connecting AI to tools and data. Adopted by major tech companies and open source projects.',
    source: 'Anthropic News',
    url: 'https://www.anthropic.com/news',
    category: 'product',
    date: '2026-01-13',
    icon: '📊'
  }
];

/**
 * Category styles for news items
 */
const CATEGORY_STYLES = {
  product: { color: '#4f46e5', bg: '#eef2ff', label: 'Product' },
  viral: { color: '#dc2626', bg: '#fef2f2', label: 'Viral' },
  business: { color: '#059669', bg: '#ecfdf5', label: 'Business' },
  feature: { color: '#7c3aed', bg: '#f5f3ff', label: 'Feature' },
  trend: { color: '#0891b2', bg: '#ecfeff', label: 'Trend' },
  community: { color: '#ea580c', bg: '#fff7ed', label: 'Community' },
  industry: { color: '#4338ca', bg: '#eef2ff', label: 'Industry' },
  changelog: { color: '#2563eb', bg: '#eff6ff', label: 'Changelog' },
  research: { color: '#7c3aed', bg: '#f5f3ff', label: 'Research' },
  tutorial: { color: '#0891b2', bg: '#ecfeff', label: 'Tutorial' },
  opinion: { color: '#6366f1', bg: '#eef2ff', label: 'Opinion' }
};

/**
 * Load cached news if available and not expired
 */
async function loadCachedNews() {
  try {
    if (await fs.pathExists(NEWS_CACHE_FILE)) {
      const cache = await fs.readJson(NEWS_CACHE_FILE);
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
async function saveNewsCache(news) {
  try {
    await fs.ensureDir(CACHE_DIR);
    await fs.writeJson(NEWS_CACHE_FILE, {
      timestamp: Date.now(),
      news
    }, { spaces: 2 });
  } catch {
    // Ignore cache errors
  }
}

/**
 * Get news items from aggregator or fallback to curated list
 * @param {Object} options - Options for filtering
 * @param {number} options.limit - Max number of items to return
 * @param {string[]} options.categories - Filter by categories
 * @param {number} options.daysAgo - Only include news from last N days
 * @param {boolean} options.useLive - Force live fetch from sources
 * @returns {Array} Array of news items
 */
export async function getNews(options = {}) {
  const { limit = 5, categories = null, daysAgo = 14, useLive = true } = options;

  let news;

  // Try live aggregation first
  if (useLive) {
    try {
      news = await aggregateNews({ limit: 30 });
      if (news && news.length > 0) {
        // Transform to standard format
        news = news.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          source: item.source,
          url: item.url,
          category: item.category,
          date: item.date,
          icon: item.icon || item.categoryInfo?.icon || '📰',
          relevanceScore: item.relevanceScore,
          socialScore: item.socialScore
        }));
      }
    } catch (error) {
      console.error('Live aggregation failed, using curated news:', error.message);
      news = null;
    }
  }

  // Fallback to curated news
  if (!news || news.length === 0) {
    news = await loadCachedNews();
    if (!news) {
      news = CURATED_NEWS;
      await saveNewsCache(news);
    }
  }

  // Filter by date
  const cutoffDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  let filtered = news.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= cutoffDate;
  });

  // Filter by categories if specified
  if (categories && categories.length > 0) {
    filtered = filtered.filter(item => categories.includes(item.category));
  }

  // Sort by date (newest first) then by relevance score
  filtered.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (dateB - dateA !== 0) return dateB - dateA;
    return (b.relevanceScore || 0) - (a.relevanceScore || 0);
  });

  // Apply limit
  return filtered.slice(0, limit);
}

/**
 * Get the top/featured news item
 */
export async function getTopNews() {
  const news = await getNews({ limit: 1 });
  return news[0] || null;
}

/**
 * Get category style
 */
export function getCategoryStyle(category) {
  return CATEGORY_STYLES[category] || NEWS_CATEGORIES[category] || { color: '#6b7280', bg: '#f3f4f6', label: category };
}

/**
 * Format date for display
 */
export function formatNewsDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Generate HTML for news section (The Rundown AI / TLDR style)
 */
export function generateNewsHtml(newsItems) {
  if (!newsItems || newsItems.length === 0) return '';

  const topItem = newsItems[0];
  const restItems = newsItems.slice(1, 5);
  const topStyle = getCategoryStyle(topItem.category);

  return `
    <!-- THE BUZZ Section - Newsletter Style -->
    <div style="margin-bottom: 32px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #f59e0b;">
        <span style="background: #f59e0b; color: white; font-size: 10px; padding: 4px 8px; border-radius: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">📰 The Buzz</span>
        <span style="font-size: 11px; color: #9ca3af;">Claude & Anthropic News</span>
      </div>

      <!-- Featured Story (Hero) -->
      <div style="margin-bottom: 24px; padding: 24px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; border-left: 4px solid #f59e0b;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <span style="font-size: 28px;">${topItem.icon}</span>
          <span style="background: ${topStyle.bg}; color: ${topStyle.color}; font-size: 10px; padding: 3px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase;">${topStyle.label}</span>
          <span style="font-size: 11px; color: #92400e; font-weight: 500;">${formatNewsDate(topItem.date)} • ${topItem.source}</span>
        </div>
        <h3 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #111827; line-height: 1.3;">
          <a href="${topItem.url}" style="color: #111827; text-decoration: none;">${topItem.title}</a>
        </h3>
        <p style="margin: 0 0 16px; font-size: 15px; color: #4b5563; line-height: 1.6;">${topItem.description}</p>
        <a href="${topItem.url}" style="display: inline-block; font-size: 13px; color: white; background: #f59e0b; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 600;">Read More →</a>
      </div>

      <!-- Other Headlines -->
      <div style="display: grid; gap: 16px;">
        ${restItems.map((item, idx) => {
          const style = getCategoryStyle(item.category);
          return `
          <div style="display: flex; gap: 16px; padding: 16px; background: #f9fafb; border-radius: 10px; border-left: 3px solid ${style.color};">
            <div style="font-size: 24px; flex-shrink: 0;">${item.icon}</div>
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; flex-wrap: wrap;">
                <span style="background: ${style.bg}; color: ${style.color}; font-size: 9px; padding: 2px 6px; border-radius: 3px; font-weight: 600; text-transform: uppercase;">${style.label}</span>
                <span style="font-size: 10px; color: #9ca3af;">${formatNewsDate(item.date)} • ${item.source}</span>
              </div>
              <h4 style="margin: 0 0 6px; font-size: 15px; font-weight: 600; line-height: 1.4;">
                <a href="${item.url}" style="color: #1f2937; text-decoration: none;">${item.title}</a>
              </h4>
              <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5;">${item.description.substring(0, 150)}${item.description.length > 150 ? '...' : ''}</p>
            </div>
          </div>`;
        }).join('')}
      </div>

      <div style="text-align: center; margin-top: 20px;">
        <a href="https://www.anthropic.com/news" style="font-size: 13px; color: #f59e0b; text-decoration: none; font-weight: 600;">More Anthropic News →</a>
      </div>
    </div>
  `;
}

/**
 * Generate plain text for news section (TLDR style)
 */
export function generateNewsText(newsItems) {
  if (!newsItems || newsItems.length === 0) return '';

  let text = `${'═'.repeat(50)}
📰 THE BUZZ - Claude & Anthropic News
${'═'.repeat(50)}

`;

  const topItem = newsItems[0];
  const topStyle = getCategoryStyle(topItem.category);

  // Featured story
  text += `⭐ FEATURED
${topItem.icon} ${topItem.title.toUpperCase()}
[${topStyle.label}] ${formatNewsDate(topItem.date)} • ${topItem.source}

${topItem.description}

→ ${topItem.url}

${'─'.repeat(50)}
MORE HEADLINES
${'─'.repeat(50)}

`;

  // Other stories
  const restItems = newsItems.slice(1, 5);
  for (const item of restItems) {
    const style = getCategoryStyle(item.category);
    text += `${item.icon} ${item.title}
   [${style.label}] ${formatNewsDate(item.date)} • ${item.source}
   ${item.description.substring(0, 120)}${item.description.length > 120 ? '...' : ''}
   → ${item.url}

`;
  }

  text += `${'─'.repeat(50)}
→ More news: https://www.anthropic.com/news
${'─'.repeat(50)}

`;

  return text;
}

/**
 * Update curated news (for manual updates)
 */
export async function updateCuratedNews(newItems) {
  const existingIds = new Set(CURATED_NEWS.map(n => n.id));
  const toAdd = newItems.filter(n => !existingIds.has(n.id));

  const valid = toAdd.every(item =>
    item.id && item.title && item.description && item.source && item.url && item.category && item.date
  );

  if (!valid) {
    throw new Error('Invalid news item format');
  }

  return toAdd.length;
}

/**
 * Force refresh news from all sources
 */
export async function refreshNews() {
  try {
    const news = await aggregateNews({ forceRefresh: true, limit: 30 });
    await saveNewsCache(news);
    return news.length;
  } catch (error) {
    console.error('Failed to refresh news:', error.message);
    return 0;
  }
}

/**
 * Get news statistics
 */
export { getNewsStats };

export default {
  getNews,
  getTopNews,
  getCategoryStyle,
  formatNewsDate,
  generateNewsHtml,
  generateNewsText,
  updateCuratedNews,
  refreshNews,
  getNewsStats
};
