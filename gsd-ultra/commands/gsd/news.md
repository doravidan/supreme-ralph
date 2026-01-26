---
name: gsd:news
description: Fetch and display AI/Claude news from multiple sources
argument-hint: "[--refresh]"
allowed-tools:
  - Read
  - Bash
  - WebFetch
---

<objective>
Aggregate and display the latest AI and Claude-related news from RSS feeds and APIs. Keep up with Anthropic announcements, Claude updates, and industry developments.
</objective>

<execution_context>
@~/.claude/ultra/news/aggregator.js
@~/.claude/ultra/news/sources.js
</execution_context>

<context>
$ARGUMENTS
</context>

<sources>

## Official Sources
- **Anthropic Blog** - Official announcements and research
- **Claude Release Notes** - Feature updates and changes

## Tech News
- **Hacker News** - Community discussions (Algolia API)
- **TechCrunch AI** - Industry coverage
- **The Verge AI** - Consumer-focused AI news
- **Ars Technica** - Technical deep dives

## Community
- **Reddit r/ClaudeAI** - User discussions and tips
- **Reddit r/MachineLearning** - Research community

</sources>

<actions>

## fetch (default)
Display cached news or fetch if stale (>2 hours).

```
/gsd:news
→ Shows latest 10 items across all sources
```

## --refresh
Force fetch fresh news, ignoring cache.

```
/gsd:news --refresh
→ Fetching from 8 sources...
→ Found 45 items, showing top 10
```

## --source [name]
Filter to specific source.

```
/gsd:news --source anthropic
→ Shows only Anthropic blog posts
```

## --category [name]
Filter by category.

```
/gsd:news --category official
/gsd:news --category tech_news
/gsd:news --category community
```

## --limit [n]
Change number of items shown.

```
/gsd:news --limit 20
→ Shows 20 items instead of default 10
```

## --json
Output as JSON for programmatic use.

```
/gsd:news --json
→ Raw JSON array of news items
```

</actions>

<output_format>

```
╔══════════════════════════════════════════════════════════════════╗
║  AI & Claude News                                      2026-01-26 ║
╚══════════════════════════════════════════════════════════════════╝

📰 ANTHROPIC BLOG
   Claude 4 Opus Introduces Extended Thinking
   https://anthropic.com/news/claude-4-opus
   2 hours ago

🔥 HACKER NEWS (142 points)
   Discussion: Claude Code vs Cursor comparison
   https://news.ycombinator.com/item?id=12345678
   4 hours ago

💬 REDDIT r/ClaudeAI
   Tips for effective prompt engineering with Claude
   https://reddit.com/r/ClaudeAI/comments/...
   6 hours ago

───────────────────────────────────────────────────────────────────
Showing 10 of 45 items | Cache: 2 hours old | /gsd:news --refresh
```

</output_format>

<caching>

News is cached to `.planning/.news-cache.json`:
- Cache TTL: 2 hours (configurable)
- Stores: items, timestamps, source metadata
- Automatic cleanup of items older than 7 days

</caching>

<process>

1. **Check cache**
   If cache exists and not stale, use cached data.
   If `--refresh` flag, skip cache.

2. **Fetch from sources**
   Parallel fetch from all enabled sources.
   Parse RSS/XML and API responses.

3. **Filter and sort**
   - Filter for Claude/AI relevance
   - Sort by recency
   - Apply any user filters

4. **Format output**
   Present in readable format with source icons.

5. **Update cache**
   Store fetched items for future use.

</process>

<success_criteria>
- [ ] News fetched or loaded from cache
- [ ] Relevant items displayed
- [ ] Sources clearly identified
- [ ] Cache updated (if fetched)
</success_criteria>
