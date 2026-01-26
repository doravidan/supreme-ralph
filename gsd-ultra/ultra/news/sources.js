/**
 * News Sources Configuration
 *
 * Curated list of sources for Claude/Anthropic news aggregation
 * Based on research from top AI newsletters:
 * - The Rundown AI (1.75M subscribers)
 * - TLDR AI (1.25M subscribers)
 * - The Neuron (600K subscribers)
 * - AlphaSignal (180K subscribers)
 */

/**
 * RSS Feed Sources - Direct feeds that can be parsed
 */
export const RSS_FEEDS = {
  // Official Anthropic feeds (community-generated)
  anthropic_news: {
    name: 'Anthropic News',
    url: 'https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_news.xml',
    category: 'official',
    priority: 1,
    icon: '🏢'
  },
  anthropic_engineering: {
    name: 'Anthropic Engineering',
    url: 'https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_engineering.xml',
    category: 'official',
    priority: 1,
    icon: '⚙️'
  },
  anthropic_research: {
    name: 'Anthropic Research',
    url: 'https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_research.xml',
    category: 'official',
    priority: 1,
    icon: '🔬'
  },
  claude_code_changelog: {
    name: 'Claude Code Changelog',
    url: 'https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_changelog_claude_code.xml',
    category: 'official',
    priority: 1,
    icon: '📋'
  },

  // Major Tech News - AI Sections
  techcrunch_ai: {
    name: 'TechCrunch AI',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    category: 'tech_news',
    priority: 2,
    icon: '📰'
  },
  verge_ai: {
    name: 'The Verge AI',
    url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    category: 'tech_news',
    priority: 2,
    icon: '📱'
  },
  arstechnica_ai: {
    name: 'Ars Technica AI',
    url: 'https://arstechnica.com/ai/feed/',
    category: 'tech_news',
    priority: 2,
    icon: '🖥️'
  },
  venturebeat_ai: {
    name: 'VentureBeat AI',
    url: 'https://venturebeat.com/category/ai/feed/',
    category: 'tech_news',
    priority: 2,
    icon: '💼'
  },
  wired_ai: {
    name: 'WIRED AI',
    url: 'https://www.wired.com/feed/tag/ai/latest/rss',
    category: 'tech_news',
    priority: 3,
    icon: '🔌'
  },
  mit_tech_review: {
    name: 'MIT Technology Review',
    url: 'https://www.technologyreview.com/feed/',
    category: 'tech_news',
    priority: 3,
    icon: '🎓'
  }
};

/**
 * API Sources - Endpoints for programmatic fetching
 */
export const API_SOURCES = {
  hacker_news: {
    name: 'Hacker News',
    type: 'algolia',
    baseUrl: 'https://hn.algolia.com/api/v1',
    searchEndpoint: '/search_by_date',
    queries: ['anthropic', 'claude ai', 'claude code', 'claude sonnet', 'claude opus'],
    category: 'community',
    priority: 1,
    icon: '🟠'
  },
  reddit_claudeai: {
    name: 'r/ClaudeAI',
    type: 'reddit',
    baseUrl: 'https://www.reddit.com/r/ClaudeAI',
    endpoints: ['/hot.json', '/new.json', '/top.json'],
    category: 'community',
    priority: 2,
    icon: '🔴'
  },
  reddit_anthropic: {
    name: 'r/Anthropic',
    type: 'reddit',
    baseUrl: 'https://www.reddit.com/r/Anthropic',
    endpoints: ['/hot.json', '/new.json'],
    category: 'community',
    priority: 3,
    icon: '🔴'
  }
};

/**
 * Keywords for filtering Claude/Anthropic content from general AI feeds
 */
export const FILTER_KEYWORDS = {
  // Primary - must match at least one
  primary: [
    'anthropic',
    'claude',
    'claude code',
    'claude ai',
    'claude sonnet',
    'claude opus',
    'claude haiku'
  ],
  // Secondary - boost relevance score
  secondary: [
    'mcp',
    'model context protocol',
    'constitutional ai',
    'claude.ai',
    'dario amodei',
    'daniela amodei',
    'boris cherny',
    'vibe coding',
    'claude cowork'
  ],
  // Exclusions - skip if these are primary focus
  exclusions: [
    'chatgpt only',
    'openai exclusive',
    'gemini only'
  ]
};

/**
 * News Categories with styling
 */
export const NEWS_CATEGORIES = {
  product: {
    label: 'Product',
    color: '#4f46e5',
    bg: '#eef2ff',
    icon: '🚀',
    description: 'New features, updates, and launches'
  },
  research: {
    label: 'Research',
    color: '#7c3aed',
    bg: '#f5f3ff',
    icon: '🔬',
    description: 'Papers, studies, and technical advances'
  },
  business: {
    label: 'Business',
    color: '#059669',
    bg: '#ecfdf5',
    icon: '💰',
    description: 'Funding, partnerships, and enterprise'
  },
  viral: {
    label: 'Viral',
    color: '#dc2626',
    bg: '#fef2f2',
    icon: '🔥',
    description: 'Trending stories and social buzz'
  },
  community: {
    label: 'Community',
    color: '#ea580c',
    bg: '#fff7ed',
    icon: '👥',
    description: 'Developer stories and user content'
  },
  tutorial: {
    label: 'Tutorial',
    color: '#0891b2',
    bg: '#ecfeff',
    icon: '📚',
    description: 'Guides, tips, and how-tos'
  },
  opinion: {
    label: 'Opinion',
    color: '#6366f1',
    bg: '#eef2ff',
    icon: '💭',
    description: 'Analysis and commentary'
  },
  changelog: {
    label: 'Changelog',
    color: '#2563eb',
    bg: '#eff6ff',
    icon: '📋',
    description: 'Version updates and release notes'
  }
};

/**
 * Newsletter Sections Configuration
 * Based on successful newsletter formats (The Rundown, TLDR AI, The Neuron)
 */
export const NEWSLETTER_SECTIONS = {
  featured: {
    title: '⚡ Top Story',
    description: 'The biggest Claude/Anthropic news this week',
    maxItems: 1,
    style: 'hero'
  },
  headlines: {
    title: '📰 Headlines',
    description: 'Key news you need to know',
    maxItems: 4,
    style: 'compact'
  },
  product_updates: {
    title: '🚀 Product Updates',
    description: 'Latest Claude features and releases',
    maxItems: 3,
    style: 'cards',
    categories: ['product', 'changelog']
  },
  community_buzz: {
    title: '🔥 Community Buzz',
    description: 'What developers are saying',
    maxItems: 3,
    style: 'social',
    categories: ['viral', 'community']
  },
  deep_dive: {
    title: '🔬 Deep Dive',
    description: 'One story explored in depth',
    maxItems: 1,
    style: 'article',
    categories: ['research', 'opinion']
  },
  quick_links: {
    title: '⚡ Quick Links',
    description: 'More worth reading',
    maxItems: 5,
    style: 'list'
  }
};

/**
 * Social Media Accounts to Monitor
 * (For manual curation - X API requires paid access)
 */
export const SOCIAL_ACCOUNTS = {
  official: [
    { handle: '@AnthropicAI', platform: 'x', priority: 1 },
    { handle: '@claudeai', platform: 'x', priority: 1 },
    { handle: '@alexalbert__', platform: 'x', priority: 2 }, // Alex Albert - Developer Relations
    { handle: '@btibor91', platform: 'x', priority: 3 } // Tibor Blaho - Feature leaks
  ],
  influencers: [
    { handle: '@karpathy', platform: 'x', priority: 1 }, // Andrej Karpathy
    { handle: '@swyx', platform: 'x', priority: 2 }, // Latent Space
    { handle: '@rowan_cheung', platform: 'x', priority: 2 }, // The Rundown AI
    { handle: '@bentossell', platform: 'x', priority: 3 } // Ben's Bites
  ]
};

/**
 * Source reliability and credibility scores
 */
export const SOURCE_CREDIBILITY = {
  'anthropic.com': 10,
  'techcrunch.com': 9,
  'theverge.com': 8,
  'venturebeat.com': 8,
  'wired.com': 8,
  'arstechnica.com': 8,
  'technologyreview.com': 9,
  'axios.com': 8,
  'cnbc.com': 7,
  'bloomberg.com': 9,
  'news.ycombinator.com': 7,
  'reddit.com': 6,
  'medium.com': 5,
  'dev.to': 6,
  'github.com': 8
};

/**
 * Get credibility score for a URL
 */
export function getCredibilityScore(url) {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return SOURCE_CREDIBILITY[hostname] || 5;
  } catch {
    return 5;
  }
}

/**
 * Categorize an article based on content analysis
 */
export function categorizeArticle(title, description = '', source = '') {
  const text = `${title} ${description}`.toLowerCase();

  // Check for specific patterns
  if (/changelog|release|version|update \d|v\d/.test(text)) return 'changelog';
  if (/funding|valuation|raise|million|billion|revenue|ipo/.test(text)) return 'business';
  if (/paper|research|study|arxiv|findings/.test(text)) return 'research';
  if (/tutorial|guide|how to|tips|workflow/.test(text)) return 'tutorial';
  if (/viral|trending|million views|going crazy|losing their minds/.test(text)) return 'viral';
  if (/launch|announce|introducing|new feature|now available/.test(text)) return 'product';
  if (/reddit|hacker news|community|developer/.test(source.toLowerCase())) return 'community';
  if (/opinion|analysis|think|believe|future/.test(text)) return 'opinion';

  return 'product'; // Default
}

/**
 * Calculate relevance score for Claude/Anthropic content
 */
export function calculateRelevanceScore(title, description = '') {
  const text = `${title} ${description}`.toLowerCase();
  let score = 0;

  // Primary keywords - high weight
  for (const keyword of FILTER_KEYWORDS.primary) {
    if (text.includes(keyword.toLowerCase())) {
      score += 10;
    }
  }

  // Secondary keywords - medium weight
  for (const keyword of FILTER_KEYWORDS.secondary) {
    if (text.includes(keyword.toLowerCase())) {
      score += 5;
    }
  }

  // Check exclusions
  for (const exclusion of FILTER_KEYWORDS.exclusions) {
    if (text.includes(exclusion.toLowerCase())) {
      score -= 20;
    }
  }

  return Math.max(0, score);
}

/**
 * Check if article is relevant to Claude/Anthropic
 */
export function isRelevant(title, description = '') {
  return calculateRelevanceScore(title, description) >= 10;
}

export default {
  RSS_FEEDS,
  API_SOURCES,
  FILTER_KEYWORDS,
  NEWS_CATEGORIES,
  NEWSLETTER_SECTIONS,
  SOCIAL_ACCOUNTS,
  SOURCE_CREDIBILITY,
  getCredibilityScore,
  categorizeArticle,
  calculateRelevanceScore,
  isRelevant
};
