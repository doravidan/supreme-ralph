/**
 * FileSystem Helper Utility
 *
 * Provides common file system operations with consistent error handling,
 * caching, and logging. Reduces code duplication across the codebase.
 *
 * @module fs-helper
 */

import fs from 'fs-extra';
import path from 'path';

// Simple in-memory cache for directory listings
const cache = new Map();
const cacheMtimes = new Map();

/**
 * Clear all cached results
 */
export function clearCache() {
  cache.clear();
  cacheMtimes.clear();
}

/**
 * Read directory recursively with filtering options
 *
 * @param {string} dirPath - Directory to read
 * @param {object} options - Options
 * @param {number} options.maxDepth - Maximum recursion depth (default: Infinity)
 * @param {function} options.filter - Filter function (entry) => boolean
 * @param {string[]} options.exclude - Directory names to exclude
 * @param {boolean} options.filesOnly - Only return files, not directories
 * @param {boolean} options.dirsOnly - Only return directories, not files
 * @returns {Promise<string[]>} Array of absolute file/directory paths
 */
export async function readDirRecursive(dirPath, options = {}) {
  const {
    maxDepth = Infinity,
    filter = () => true,
    exclude = ['node_modules', '.git', '__pycache__', '.venv', 'dist', 'build', 'coverage'],
    filesOnly = false,
    dirsOnly = false
  } = options;

  const results = [];

  async function walk(currentPath, depth) {
    if (depth > maxDepth) return;

    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        // Skip excluded directories
        if (entry.isDirectory() && exclude.includes(entry.name)) {
          continue;
        }

        // Skip hidden files/directories (starting with .)
        if (entry.name.startsWith('.')) {
          continue;
        }

        const fullPath = path.join(currentPath, entry.name);

        // Apply custom filter
        if (!filter(entry)) {
          continue;
        }

        if (entry.isDirectory()) {
          if (!filesOnly) {
            results.push(fullPath);
          }
          await walk(fullPath, depth + 1);
        } else if (entry.isFile()) {
          if (!dirsOnly) {
            results.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Log but don't throw - allows partial results
      if (error.code !== 'ENOENT' && error.code !== 'EACCES') {
        console.debug(`[fs-helper] Error reading ${currentPath}:`, error.message);
      }
    }
  }

  await walk(dirPath, 0);
  return results;
}

/**
 * Ensure multiple directories exist (batch creation)
 *
 * @param {string[]} paths - Array of directory paths to create
 * @returns {Promise<void>}
 */
export async function ensureDirs(paths) {
  await Promise.all(paths.map(p => fs.ensureDir(p)));
}

/**
 * Find files matching a pattern with optional caching
 *
 * @param {string} dirPath - Directory to search
 * @param {string|RegExp} pattern - File name pattern (string with wildcards or RegExp)
 * @param {object} options - Options
 * @param {boolean} options.useCache - Whether to use caching (default: true)
 * @param {number} options.maxDepth - Maximum recursion depth
 * @returns {Promise<string[]>} Array of matching file paths
 */
export async function findFilesByPattern(dirPath, pattern, options = {}) {
  const { useCache = true, maxDepth = Infinity } = options;

  // Create cache key
  const cacheKey = `${dirPath}:${pattern}:${maxDepth}`;

  // Check cache validity
  if (useCache && cache.has(cacheKey)) {
    try {
      const currentMtime = (await fs.stat(dirPath)).mtimeMs;
      if (cacheMtimes.get(cacheKey) === currentMtime) {
        return cache.get(cacheKey);
      }
    } catch {
      // Directory doesn't exist or can't be accessed
    }
  }

  // Convert string pattern to regex
  let regex;
  if (typeof pattern === 'string') {
    // Convert glob-like pattern to regex
    // Supports: * (any chars), ? (single char), ** (recursive)
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*/g, '{{GLOBSTAR}}')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.')
      .replace(/\{\{GLOBSTAR\}\}/g, '.*');
    regex = new RegExp(`^${escaped}$`);
  } else {
    regex = pattern;
  }

  // Find matching files
  const allFiles = await readDirRecursive(dirPath, {
    maxDepth,
    filesOnly: true
  });

  const results = allFiles.filter(filePath => {
    const fileName = path.basename(filePath);
    return regex.test(fileName);
  });

  // Update cache
  if (useCache) {
    try {
      const mtime = (await fs.stat(dirPath)).mtimeMs;
      cache.set(cacheKey, results);
      cacheMtimes.set(cacheKey, mtime);
    } catch {
      // Ignore cache update errors
    }
  }

  return results;
}

/**
 * Safely read a JSON file with default value on error
 *
 * @param {string} filePath - Path to JSON file
 * @param {*} defaultValue - Default value if file doesn't exist or is invalid
 * @returns {Promise<*>} Parsed JSON or default value
 */
export async function safeReadJson(filePath, defaultValue = null) {
  try {
    if (await fs.pathExists(filePath)) {
      return await fs.readJson(filePath);
    }
  } catch (error) {
    console.debug(`[fs-helper] Error reading JSON ${filePath}:`, error.message);
  }
  return defaultValue;
}

/**
 * Safely read a text file with default value on error
 *
 * @param {string} filePath - Path to file
 * @param {string} defaultValue - Default value if file doesn't exist or is unreadable
 * @returns {Promise<string>} File contents or default value
 */
export async function safeReadFile(filePath, defaultValue = '') {
  try {
    if (await fs.pathExists(filePath)) {
      return await fs.readFile(filePath, 'utf-8');
    }
  } catch (error) {
    console.debug(`[fs-helper] Error reading file ${filePath}:`, error.message);
  }
  return defaultValue;
}

/**
 * Safely write a file with automatic directory creation
 *
 * @param {string} filePath - Path to write to
 * @param {string|Buffer} content - Content to write
 * @param {object} options - fs.writeFile options
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export async function safeWriteFile(filePath, content, options = {}) {
  try {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, options);
    return true;
  } catch (error) {
    console.error(`[fs-helper] Error writing file ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Safely write a JSON file with automatic directory creation
 *
 * @param {string} filePath - Path to write to
 * @param {*} data - Data to serialize to JSON
 * @param {object} options - Options (spaces: indentation level)
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export async function safeWriteJson(filePath, data, options = { spaces: 2 }) {
  try {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, data, options);
    return true;
  } catch (error) {
    console.error(`[fs-helper] Error writing JSON ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Check if a path exists (file or directory)
 *
 * @param {string} targetPath - Path to check
 * @returns {Promise<boolean>} True if exists
 */
export async function exists(targetPath) {
  return fs.pathExists(targetPath);
}

/**
 * Check if path is a directory
 *
 * @param {string} targetPath - Path to check
 * @returns {Promise<boolean>} True if directory
 */
export async function isDirectory(targetPath) {
  try {
    const stat = await fs.stat(targetPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if path is a file
 *
 * @param {string} targetPath - Path to check
 * @returns {Promise<boolean>} True if file
 */
export async function isFile(targetPath) {
  try {
    const stat = await fs.stat(targetPath);
    return stat.isFile();
  } catch {
    return false;
  }
}

/**
 * Get file extension (lowercase, without dot)
 *
 * @param {string} filePath - File path
 * @returns {string} Extension without dot (e.g., 'js', 'ts')
 */
export function getExtension(filePath) {
  const ext = path.extname(filePath);
  return ext ? ext.slice(1).toLowerCase() : '';
}

/**
 * Copy files matching a pattern from source to destination
 *
 * @param {string} srcDir - Source directory
 * @param {string} destDir - Destination directory
 * @param {string|RegExp} pattern - File pattern to match
 * @param {object} options - Options
 * @returns {Promise<string[]>} Array of copied file paths
 */
export async function copyByPattern(srcDir, destDir, pattern, options = {}) {
  const files = await findFilesByPattern(srcDir, pattern, options);
  const copied = [];

  await fs.ensureDir(destDir);

  for (const srcFile of files) {
    const relativePath = path.relative(srcDir, srcFile);
    const destFile = path.join(destDir, relativePath);

    try {
      await fs.ensureDir(path.dirname(destFile));
      await fs.copy(srcFile, destFile);
      copied.push(destFile);
    } catch (error) {
      console.error(`[fs-helper] Error copying ${srcFile}:`, error.message);
    }
  }

  return copied;
}

/**
 * Get directory size in bytes (recursive)
 *
 * @param {string} dirPath - Directory path
 * @returns {Promise<number>} Total size in bytes
 */
export async function getDirectorySize(dirPath) {
  let totalSize = 0;

  const files = await readDirRecursive(dirPath, { filesOnly: true });

  for (const file of files) {
    try {
      const stat = await fs.stat(file);
      totalSize += stat.size;
    } catch {
      // Ignore errors for individual files
    }
  }

  return totalSize;
}

/**
 * Format bytes to human-readable string
 *
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);

  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default {
  clearCache,
  readDirRecursive,
  ensureDirs,
  findFilesByPattern,
  safeReadJson,
  safeReadFile,
  safeWriteFile,
  safeWriteJson,
  exists,
  isDirectory,
  isFile,
  getExtension,
  copyByPattern,
  getDirectorySize,
  formatBytes
};
