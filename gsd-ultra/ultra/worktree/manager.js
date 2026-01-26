/**
 * Git Worktree Manager
 *
 * Provides isolated development environments per spec/PRD using git worktrees.
 * Each spec runs in its own worktree to prevent pollution of the main branch.
 *
 * @module worktree-manager
 */

import fs from 'fs-extra';
import path from 'path';
import { execSync, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const WORKTREES_DIR = '.worktrees';
const BRANCH_PREFIX = 'ralph';

/**
 * Execute a git command and return the output
 * @param {string} command - Git command to execute
 * @param {string} cwd - Working directory
 * @returns {Promise<string>} Command output
 */
async function gitCommand(command, cwd = process.cwd()) {
  try {
    const { stdout } = await execAsync(`git ${command}`, { cwd });
    return stdout.trim();
  } catch (error) {
    throw new Error(`Git command failed: git ${command}\n${error.message}`);
  }
}

/**
 * Slugify a spec name for use in branch names
 * @param {string} specName - Original spec name
 * @returns {string} Slugified name
 */
function slugify(specName) {
  return specName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

/**
 * Get the worktree directory path for a spec
 * @param {string} specName - Spec name
 * @param {string} projectRoot - Project root directory
 * @returns {string} Worktree directory path
 */
function getWorktreePath(specName, projectRoot = process.cwd()) {
  const slug = slugify(specName);
  return path.join(projectRoot, WORKTREES_DIR, slug);
}

/**
 * Get the branch name for a spec
 * @param {string} specName - Spec name
 * @returns {string} Branch name
 */
function getBranchName(specName) {
  const slug = slugify(specName);
  return `${BRANCH_PREFIX}/${slug}`;
}

/**
 * Check if a worktree exists for a spec
 * @param {string} specName - Spec name
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<boolean>} Whether worktree exists
 */
async function worktreeExists(specName, projectRoot = process.cwd()) {
  const worktreePath = getWorktreePath(specName, projectRoot);
  return fs.pathExists(worktreePath);
}

/**
 * Create a new worktree for a spec
 * @param {string} specName - Spec name
 * @param {string} projectRoot - Project root directory
 * @param {string} baseBranch - Base branch to create from (default: current branch)
 * @returns {Promise<{path: string, branch: string}>} Worktree info
 */
async function createWorktree(specName, projectRoot = process.cwd(), baseBranch = null) {
  const worktreePath = getWorktreePath(specName, projectRoot);
  const branchName = getBranchName(specName);

  // Check if worktree already exists
  if (await worktreeExists(specName, projectRoot)) {
    return {
      path: worktreePath,
      branch: branchName,
      existed: true
    };
  }

  // Ensure worktrees directory exists
  await fs.ensureDir(path.join(projectRoot, WORKTREES_DIR));

  // Get base branch if not specified
  if (!baseBranch) {
    baseBranch = await gitCommand('rev-parse --abbrev-ref HEAD', projectRoot);
  }

  // Create new branch and worktree
  try {
    // Create worktree with new branch
    await gitCommand(
      `worktree add -b ${branchName} "${worktreePath}" ${baseBranch}`,
      projectRoot
    );
  } catch (error) {
    // Branch might already exist, try without -b
    if (error.message.includes('already exists')) {
      await gitCommand(
        `worktree add "${worktreePath}" ${branchName}`,
        projectRoot
      );
    } else {
      throw error;
    }
  }

  return {
    path: worktreePath,
    branch: branchName,
    existed: false
  };
}

/**
 * List all worktrees
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Array<{path: string, branch: string, head: string}>>} List of worktrees
 */
async function listWorktrees(projectRoot = process.cwd()) {
  try {
    const output = await gitCommand('worktree list --porcelain', projectRoot);
    const worktrees = [];
    let current = {};

    for (const line of output.split('\n')) {
      if (line.startsWith('worktree ')) {
        if (current.path) worktrees.push(current);
        current = { path: line.substring(9) };
      } else if (line.startsWith('HEAD ')) {
        current.head = line.substring(5);
      } else if (line.startsWith('branch ')) {
        current.branch = line.substring(7).replace('refs/heads/', '');
      }
    }

    if (current.path) worktrees.push(current);

    // Filter to only RALPH worktrees
    return worktrees.filter(w =>
      w.branch && w.branch.startsWith(BRANCH_PREFIX + '/')
    );
  } catch (error) {
    return [];
  }
}

/**
 * Get the diff between a worktree and the main branch
 * @param {string} specName - Spec name
 * @param {string} projectRoot - Project root directory
 * @param {string} baseBranch - Base branch to compare against (default: main)
 * @returns {Promise<string>} Diff output
 */
async function getWorktreeDiff(specName, projectRoot = process.cwd(), baseBranch = 'main') {
  const branchName = getBranchName(specName);

  try {
    return await gitCommand(
      `diff ${baseBranch}...${branchName} --stat`,
      projectRoot
    );
  } catch (error) {
    return 'Unable to get diff';
  }
}

/**
 * Merge a worktree branch back to the target branch
 * @param {string} specName - Spec name
 * @param {string} projectRoot - Project root directory
 * @param {string} targetBranch - Branch to merge into (default: main)
 * @returns {Promise<{success: boolean, message: string}>} Merge result
 */
async function mergeWorktree(specName, projectRoot = process.cwd(), targetBranch = 'main') {
  const branchName = getBranchName(specName);
  const worktreePath = getWorktreePath(specName, projectRoot);

  try {
    // Save current branch
    const currentBranch = await gitCommand('rev-parse --abbrev-ref HEAD', projectRoot);

    // Checkout target branch
    await gitCommand(`checkout ${targetBranch}`, projectRoot);

    // Merge the worktree branch
    await gitCommand(`merge ${branchName} --no-ff -m "Merge ${branchName} into ${targetBranch}"`, projectRoot);

    // Remove the worktree
    await gitCommand(`worktree remove "${worktreePath}" --force`, projectRoot);

    // Delete the branch
    await gitCommand(`branch -d ${branchName}`, projectRoot);

    return {
      success: true,
      message: `Successfully merged ${branchName} into ${targetBranch}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Merge failed: ${error.message}`
    };
  }
}

/**
 * Discard a worktree without merging
 * @param {string} specName - Spec name
 * @param {string} projectRoot - Project root directory
 * @param {boolean} force - Force removal even with uncommitted changes
 * @returns {Promise<{success: boolean, message: string}>} Result
 */
async function discardWorktree(specName, projectRoot = process.cwd(), force = false) {
  const branchName = getBranchName(specName);
  const worktreePath = getWorktreePath(specName, projectRoot);

  try {
    // Check if worktree exists
    if (!await worktreeExists(specName, projectRoot)) {
      return {
        success: false,
        message: `Worktree for "${specName}" does not exist`
      };
    }

    // Remove the worktree
    const forceFlag = force ? '--force' : '';
    await gitCommand(`worktree remove "${worktreePath}" ${forceFlag}`, projectRoot);

    // Delete the branch (force delete since it wasn't merged)
    await gitCommand(`branch -D ${branchName}`, projectRoot);

    return {
      success: true,
      message: `Discarded worktree for "${specName}"`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to discard: ${error.message}`
    };
  }
}

/**
 * Get the status of a worktree
 * @param {string} specName - Spec name
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<{exists: boolean, path: string, branch: string, changes: number, commits: number}>}
 */
async function getWorktreeStatus(specName, projectRoot = process.cwd()) {
  const worktreePath = getWorktreePath(specName, projectRoot);
  const branchName = getBranchName(specName);

  if (!await worktreeExists(specName, projectRoot)) {
    return { exists: false };
  }

  try {
    // Get uncommitted changes count
    const status = await gitCommand('status --porcelain', worktreePath);
    const changes = status ? status.split('\n').length : 0;

    // Get commits ahead of main
    let commits = 0;
    try {
      const log = await gitCommand('rev-list --count main..HEAD', worktreePath);
      commits = parseInt(log) || 0;
    } catch {
      // main might not exist, that's ok
    }

    return {
      exists: true,
      path: worktreePath,
      branch: branchName,
      changes,
      commits
    };
  } catch (error) {
    return {
      exists: true,
      path: worktreePath,
      branch: branchName,
      error: error.message
    };
  }
}

/**
 * Add .worktrees to .gitignore if not already present
 * @param {string} projectRoot - Project root directory
 */
async function ensureGitignore(projectRoot = process.cwd()) {
  const gitignorePath = path.join(projectRoot, '.gitignore');

  try {
    let content = '';
    if (await fs.pathExists(gitignorePath)) {
      content = await fs.readFile(gitignorePath, 'utf-8');
    }

    if (!content.includes(WORKTREES_DIR)) {
      const addition = `\n# RALPH worktrees\n${WORKTREES_DIR}/\n`;
      await fs.appendFile(gitignorePath, addition);
    }
  } catch (error) {
    // Ignore errors updating .gitignore
  }
}

export {
  createWorktree,
  listWorktrees,
  mergeWorktree,
  discardWorktree,
  worktreeExists,
  getWorktreePath,
  getBranchName,
  getWorktreeDiff,
  getWorktreeStatus,
  ensureGitignore,
  WORKTREES_DIR,
  BRANCH_PREFIX
};
