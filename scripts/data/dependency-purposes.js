/**
 * Dependency Purposes Registry
 *
 * Maps package names to their purposes for documentation generation.
 * Used by project-analyzer.js to describe project dependencies.
 *
 * To add a new package:
 * 1. Find the appropriate category
 * 2. Add: 'package-name': 'Brief description'
 *
 * @module data/dependency-purposes
 */

export const DEPENDENCY_PURPOSES = {
  // ===========================================
  // Build Tools
  // ===========================================
  'typescript': 'TypeScript compiler',
  'esbuild': 'Fast JavaScript/TypeScript bundler',
  'webpack': 'Module bundler',
  'vite': 'Next-gen frontend build tool',
  'rollup': 'ES module bundler',
  'parcel': 'Zero-config bundler',
  'babel': 'JavaScript compiler',
  '@babel/core': 'Babel compiler core',
  'swc': 'Super-fast compiler',
  '@swc/core': 'SWC compiler core',
  'turbopack': 'Incremental bundler',

  // ===========================================
  // Testing
  // ===========================================
  'jest': 'JavaScript testing framework',
  'mocha': 'Test framework',
  'vitest': 'Vite-native testing framework',
  'ava': 'Test runner',
  'tap': 'Test framework',
  'uvu': 'Fast test runner',
  '@testing-library/react': 'React testing utilities',
  '@testing-library/jest-dom': 'Jest DOM matchers',
  '@testing-library/vue': 'Vue testing utilities',
  '@testing-library/svelte': 'Svelte testing utilities',
  'cypress': 'E2E testing framework',
  'playwright': 'Browser automation and testing',
  '@playwright/test': 'Playwright test runner',
  'supertest': 'HTTP assertion library',
  'msw': 'API mocking library',
  'nock': 'HTTP mocking library',

  // ===========================================
  // Linting & Formatting
  // ===========================================
  'eslint': 'JavaScript linter',
  'prettier': 'Code formatter',
  'biome': 'Fast formatter and linter',
  '@biomejs/biome': 'Biome toolchain',
  '@typescript-eslint/parser': 'TypeScript ESLint parser',
  '@typescript-eslint/eslint-plugin': 'TypeScript ESLint rules',
  'stylelint': 'CSS linter',
  'commitlint': 'Commit message linter',
  'lint-staged': 'Run linters on staged files',
  'husky': 'Git hooks',

  // ===========================================
  // Frameworks - Frontend
  // ===========================================
  'react': 'React UI library',
  'react-dom': 'React DOM renderer',
  'next': 'React framework with SSR',
  'vue': 'Vue.js framework',
  'nuxt': 'Vue.js framework with SSR',
  'svelte': 'Svelte framework',
  '@sveltejs/kit': 'SvelteKit framework',
  'angular': 'Angular framework',
  '@angular/core': 'Angular core',
  'solid-js': 'Solid.js reactive framework',
  'preact': 'Lightweight React alternative',
  'qwik': 'Resumable framework',
  'astro': 'Content-focused framework',
  'remix': 'Full stack React framework',

  // ===========================================
  // Frameworks - Backend
  // ===========================================
  'express': 'Web framework for Node.js',
  'fastify': 'Fast web framework',
  'koa': 'Expressive middleware framework',
  'hapi': 'Server framework',
  '@hapi/hapi': 'Hapi server framework',
  'nest': 'Progressive Node.js framework',
  '@nestjs/core': 'NestJS core',
  '@nestjs/common': 'NestJS common utilities',
  'hono': 'Ultrafast web framework',
  'elysia': 'Bun web framework',
  'itty-router': 'Tiny router',

  // ===========================================
  // Database
  // ===========================================
  'prisma': 'Next-gen ORM',
  '@prisma/client': 'Prisma database client',
  'mongoose': 'MongoDB ODM',
  'sequelize': 'SQL ORM',
  'typeorm': 'TypeScript ORM',
  'drizzle-orm': 'TypeScript ORM',
  'knex': 'SQL query builder',
  'pg': 'PostgreSQL client',
  'mysql2': 'MySQL client',
  'sqlite3': 'SQLite bindings',
  'better-sqlite3': 'Better SQLite bindings',
  'redis': 'Redis client',
  'ioredis': 'Redis client',
  '@upstash/redis': 'Serverless Redis',
  'mongodb': 'MongoDB driver',

  // ===========================================
  // Authentication
  // ===========================================
  'passport': 'Authentication middleware',
  'jsonwebtoken': 'JWT implementation',
  'jose': 'JWT/JWE/JWS library',
  'bcrypt': 'Password hashing',
  'bcryptjs': 'Pure JS bcrypt',
  'argon2': 'Password hashing',
  '@auth/core': 'Auth.js core',
  'next-auth': 'NextAuth.js',
  '@clerk/nextjs': 'Clerk authentication',
  '@supabase/auth-helpers-nextjs': 'Supabase auth for Next.js',

  // ===========================================
  // API
  // ===========================================
  'axios': 'HTTP client',
  'node-fetch': 'Fetch API for Node.js',
  'got': 'HTTP request library',
  'ky': 'Tiny HTTP client',
  'graphql': 'GraphQL query language',
  'apollo-server': 'GraphQL server',
  '@apollo/server': 'Apollo GraphQL server',
  '@apollo/client': 'Apollo GraphQL client',
  'trpc': 'End-to-end typesafe APIs',
  '@trpc/server': 'tRPC server',
  '@trpc/client': 'tRPC client',
  '@trpc/react-query': 'tRPC React Query',
  'openapi-typescript': 'OpenAPI TypeScript generator',
  'swagger-ui-express': 'Swagger UI for Express',

  // ===========================================
  // State Management
  // ===========================================
  'redux': 'State container',
  '@reduxjs/toolkit': 'Redux toolkit',
  'zustand': 'State management',
  'jotai': 'Primitive state management',
  'recoil': 'State management for React',
  'mobx': 'State management',
  'mobx-react': 'MobX React bindings',
  'pinia': 'Vue state management',
  'vuex': 'Vue state management',
  'valtio': 'Proxy-based state',
  '@tanstack/react-query': 'Data fetching/caching',
  'swr': 'React hooks for data fetching',

  // ===========================================
  // Utilities
  // ===========================================
  'lodash': 'Utility library',
  'lodash-es': 'Lodash ES modules',
  'ramda': 'Functional utility library',
  'date-fns': 'Date utility library',
  'dayjs': 'Date library',
  'moment': 'Date library (legacy)',
  'luxon': 'Date/time library',
  'zod': 'Schema validation',
  'yup': 'Schema validation',
  'joi': 'Schema validation',
  'valibot': 'Schema validation',
  'uuid': 'UUID generation',
  'nanoid': 'Unique ID generator',
  'cuid': 'Collision-resistant IDs',

  // ===========================================
  // CLI
  // ===========================================
  'commander': 'CLI framework',
  'yargs': 'CLI argument parser',
  'cac': 'CLI framework',
  'citty': 'CLI framework',
  'inquirer': 'Interactive CLI prompts',
  '@inquirer/prompts': 'Inquirer prompts',
  'prompts': 'CLI prompts',
  'chalk': 'Terminal styling',
  'picocolors': 'Terminal colors',
  'ora': 'Terminal spinner',
  'cli-spinners': 'Spinner collection',
  'cli-table3': 'CLI tables',
  'boxen': 'Boxes in terminal',

  // ===========================================
  // File System
  // ===========================================
  'fs-extra': 'Enhanced fs module',
  'glob': 'File pattern matching',
  'fast-glob': 'Fast glob implementation',
  'globby': 'User-friendly glob',
  'chokidar': 'File watcher',
  'rimraf': 'rm -rf for Node.js',
  'del': 'Delete files/folders',
  'make-dir': 'Make directories',

  // ===========================================
  // Logging
  // ===========================================
  'winston': 'Logging library',
  'pino': 'Fast logger',
  'bunyan': 'JSON logger',
  'debug': 'Debug utility',
  'consola': 'Console logger',
  'signale': 'Hackable console logger',

  // ===========================================
  // Validation
  // ===========================================
  'class-validator': 'Decorator-based validation',
  'express-validator': 'Express validation',
  'validator': 'String validation',
  'ajv': 'JSON schema validator',

  // ===========================================
  // Email
  // ===========================================
  'nodemailer': 'Email sending',
  'resend': 'Email API',
  '@sendgrid/mail': 'SendGrid email',
  '@aws-sdk/client-ses': 'AWS SES client',
  'postmark': 'Postmark email',

  // ===========================================
  // Markdown & Content
  // ===========================================
  'marked': 'Markdown parser',
  'markdown-it': 'Markdown parser',
  'remark': 'Markdown processor',
  'rehype': 'HTML processor',
  'turndown': 'HTML to Markdown',
  'shiki': 'Syntax highlighter',
  'prismjs': 'Syntax highlighting',

  // ===========================================
  // YAML/JSON/Config
  // ===========================================
  'yaml': 'YAML parser',
  'js-yaml': 'YAML parser',
  'toml': 'TOML parser',
  'dotenv': 'Environment variables',
  'cross-env': 'Cross-platform env vars',
  'envalid': 'Environment validation',

  // ===========================================
  // AI/ML
  // ===========================================
  'openai': 'OpenAI API client',
  '@anthropic-ai/sdk': 'Anthropic Claude SDK',
  'langchain': 'LLM framework',
  '@langchain/core': 'LangChain core',
  'ai': 'Vercel AI SDK',
  'ollama': 'Ollama client',

  // ===========================================
  // Real-time
  // ===========================================
  'socket.io': 'Real-time communication',
  'socket.io-client': 'Socket.IO client',
  'ws': 'WebSocket library',
  'pusher': 'Pusher client',
  '@pusher/push-notifications-web': 'Pusher notifications',

  // ===========================================
  // Cloud/Deployment
  // ===========================================
  '@aws-sdk/client-s3': 'AWS S3 client',
  '@google-cloud/storage': 'Google Cloud Storage',
  '@azure/storage-blob': 'Azure Blob Storage',
  'vercel': 'Vercel CLI',
  'wrangler': 'Cloudflare Workers CLI',
};

/**
 * Get the purpose of a dependency
 * @param {string} packageName - Package name
 * @returns {string|undefined} Purpose description or undefined
 */
export function getDependencyPurpose(packageName) {
  return DEPENDENCY_PURPOSES[packageName];
}

/**
 * Get purposes for multiple dependencies
 * @param {string[]} packageNames - Array of package names
 * @returns {object} Map of package name to purpose
 */
export function getDependencyPurposes(packageNames) {
  const purposes = {};
  for (const name of packageNames) {
    const purpose = DEPENDENCY_PURPOSES[name];
    if (purpose) {
      purposes[name] = purpose;
    }
  }
  return purposes;
}

export default DEPENDENCY_PURPOSES;
