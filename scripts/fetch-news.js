#!/usr/bin/env node

/**
 * News Fetcher CLI
 *
 * Standalone command to fetch and preview Claude/Anthropic news.
 * Used for testing the news aggregation system and manually refreshing news.
 *
 * Usage:
 *   node scripts/fetch-news.js              # Preview news
 *   node scripts/fetch-news.js --refresh    # Force refresh from sources
 *   node scripts/fetch-news.js --json       # Output as JSON
 *   node scripts/fetch-news.js --stats      # Show statistics
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getNews, refreshNews, getNewsStats, generateNewsText, getCategoryStyle, formatNewsDate } from './utils/news-fetcher.js';

const program = new Command();

/**
 * Display news in a formatted table
 */
function displayNewsTable(news) {
  console.log('\n' + chalk.bold.yellow('═'.repeat(60)));
  console.log(chalk.bold.yellow('  📰 CLAUDE & ANTHROPIC NEWS'));
  console.log(chalk.bold.yellow('═'.repeat(60)) + '\n');

  if (news.length === 0) {
    console.log(chalk.gray('  No news items found.\n'));
    return;
  }

  // Featured story
  const featured = news[0];
  const featuredStyle = getCategoryStyle(featured.category);

  console.log(chalk.bgYellow.black(' ⭐ FEATURED '));
  console.log();
  console.log(`  ${featured.icon}  ${chalk.bold(featured.title)}`);
  console.log(`     ${chalk.cyan(`[${featuredStyle.label}]`)} ${chalk.gray(formatNewsDate(featured.date))} • ${chalk.gray(featured.source)}`);
  console.log(`     ${chalk.white(featured.description)}`);
  console.log(`     ${chalk.blue.underline(featured.url)}`);
  console.log();

  // Other stories
  if (news.length > 1) {
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.bold('  MORE HEADLINES'));
    console.log(chalk.gray('─'.repeat(60)) + '\n');

    for (const item of news.slice(1, 8)) {
      const style = getCategoryStyle(item.category);
      console.log(`  ${item.icon}  ${chalk.bold(item.title)}`);
      console.log(`     ${chalk.cyan(`[${style.label}]`)} ${chalk.gray(formatNewsDate(item.date))} • ${chalk.gray(item.source)}`);
      console.log(`     ${chalk.gray(item.description.substring(0, 100))}${item.description.length > 100 ? '...' : ''}`);
      console.log(`     ${chalk.blue.underline(item.url)}`);
      console.log();
    }
  }

  console.log(chalk.gray('─'.repeat(60)));
  console.log(`  ${chalk.gray(`Total: ${news.length} items`)} | ${chalk.gray('→ https://www.anthropic.com/news')}`);
  console.log(chalk.gray('─'.repeat(60)) + '\n');
}

/**
 * Display news statistics
 */
function displayStats(stats) {
  console.log('\n' + chalk.bold.cyan('═'.repeat(50)));
  console.log(chalk.bold.cyan('  📊 NEWS STATISTICS'));
  console.log(chalk.bold.cyan('═'.repeat(50)) + '\n');

  console.log(`  ${chalk.bold('Total Items:')} ${stats.total}`);
  console.log(`  ${chalk.bold('Date Range:')} ${stats.oldestDate || 'N/A'} → ${stats.latestDate || 'N/A'}`);

  console.log('\n  ' + chalk.bold('By Category:'));
  for (const [category, count] of Object.entries(stats.byCategory || {})) {
    const style = getCategoryStyle(category);
    console.log(`    ${chalk.hex(style.color)(`[${style.label}]`)} ${count} items`);
  }

  console.log('\n  ' + chalk.bold('By Source:'));
  const sortedSources = Object.entries(stats.bySource || {}).sort((a, b) => b[1] - a[1]);
  for (const [source, count] of sortedSources.slice(0, 10)) {
    console.log(`    ${chalk.gray('•')} ${source}: ${count}`);
  }

  console.log('\n' + chalk.gray('─'.repeat(50)) + '\n');
}

async function main() {
  program
    .name('fetch-news')
    .description('Fetch and preview Claude/Anthropic news from multiple sources')
    .option('-r, --refresh', 'Force refresh from all sources')
    .option('-j, --json', 'Output as JSON')
    .option('-s, --stats', 'Show news statistics')
    .option('-l, --limit <number>', 'Limit number of items', '10')
    .option('-c, --category <category>', 'Filter by category')
    .option('-t, --text', 'Output as plain text (newsletter format)')
    .parse(process.argv);

  const options = program.opts();
  const limit = parseInt(options.limit, 10);

  try {
    // Force refresh if requested
    if (options.refresh) {
      const spinner = ora('Refreshing news from all sources...').start();
      const count = await refreshNews();
      spinner.succeed(`Refreshed news: ${count} items fetched`);
    }

    // Show statistics
    if (options.stats) {
      const spinner = ora('Gathering statistics...').start();
      const stats = await getNewsStats();
      spinner.stop();
      displayStats(stats);
      return;
    }

    // Fetch news
    const spinner = ora('Fetching news...').start();
    const newsOptions = {
      limit,
      daysAgo: 14,
      useLive: options.refresh || false
    };

    if (options.category) {
      newsOptions.categories = [options.category];
    }

    const news = await getNews(newsOptions);
    spinner.stop();

    // Output format
    if (options.json) {
      console.log(JSON.stringify(news, null, 2));
    } else if (options.text) {
      console.log(generateNewsText(news));
    } else {
      displayNewsTable(news);
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
  }
}

main();
