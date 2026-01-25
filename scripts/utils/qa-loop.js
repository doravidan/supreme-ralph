/**
 * QA Validation Loop Module
 *
 * Implements iterative QA validation with max attempts and escalation.
 * Used by QA Reviewer and QA Fixer agents in the RALPH pipeline.
 *
 * @module qa-loop
 */

import fs from 'fs-extra';
import path from 'path';

// Configuration constants
const MAX_QA_ITERATIONS = 5;
const RECURRING_ISSUE_THRESHOLD = 3;
const QA_HISTORY_FILE = '.ralph/qa-history.json';

/**
 * Initialize QA history file if it doesn't exist
 * @param {string} projectRoot - Project root directory
 */
async function initQaHistory(projectRoot = process.cwd()) {
  const historyPath = path.join(projectRoot, QA_HISTORY_FILE);
  const ralphDir = path.dirname(historyPath);

  await fs.ensureDir(ralphDir);

  if (!await fs.pathExists(historyPath)) {
    await fs.writeJson(historyPath, {
      version: '1.0.0',
      sessions: [],
      recurringIssues: [],
      insights: []
    }, { spaces: 2 });
  }
}

/**
 * Load QA history
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Object>} QA history object
 */
async function loadQaHistory(projectRoot = process.cwd()) {
  const historyPath = path.join(projectRoot, QA_HISTORY_FILE);

  await initQaHistory(projectRoot);

  try {
    return await fs.readJson(historyPath);
  } catch (error) {
    return {
      version: '1.0.0',
      sessions: [],
      recurringIssues: [],
      insights: []
    };
  }
}

/**
 * Save QA history
 * @param {Object} history - QA history object
 * @param {string} projectRoot - Project root directory
 */
async function saveQaHistory(history, projectRoot = process.cwd()) {
  const historyPath = path.join(projectRoot, QA_HISTORY_FILE);
  await fs.writeJson(historyPath, history, { spaces: 2 });
}

/**
 * Run QA validation against acceptance criteria
 * @param {Object} subtask - Subtask object from implementation plan
 * @param {Object} implementation - Implementation details
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<{passed: boolean, issues: Array, report: Object}>}
 */
async function runQaValidation(subtask, implementation, projectRoot = process.cwd()) {
  const report = {
    subtaskId: subtask.id,
    timestamp: new Date().toISOString(),
    criteria: [],
    qualityGates: {},
    issues: [],
    status: 'pending'
  };

  // Validate each acceptance criterion
  for (const criterion of subtask.acceptance_criteria || []) {
    const result = {
      criterion,
      passed: false,
      evidence: null,
      issue: null
    };

    // Check if criterion is met based on implementation
    if (implementation.completedCriteria?.includes(criterion)) {
      result.passed = true;
      result.evidence = implementation.evidence?.[criterion] || 'Marked complete by coder';
    } else {
      result.passed = false;
      result.issue = `Criterion not satisfied: ${criterion}`;
      report.issues.push({
        severity: 'high',
        type: 'criterion_not_met',
        description: criterion,
        file: subtask.files_to_create?.[0] || subtask.files_to_modify?.[0],
        suggestion: `Implement: ${criterion}`
      });
    }

    report.criteria.push(result);
  }

  // Check quality gates from implementation
  report.qualityGates = {
    typecheck: implementation.qualityGates?.typecheck || 'unknown',
    lint: implementation.qualityGates?.lint || 'unknown',
    tests: implementation.qualityGates?.tests || 'unknown'
  };

  // Add quality gate failures as issues
  if (report.qualityGates.typecheck === 'failed') {
    report.issues.push({
      severity: 'high',
      type: 'typecheck_failed',
      description: 'TypeScript compilation errors',
      suggestion: 'Fix type errors before proceeding'
    });
  }

  if (report.qualityGates.lint === 'failed') {
    report.issues.push({
      severity: 'medium',
      type: 'lint_failed',
      description: 'Linting errors found',
      suggestion: 'Run npm run lint:fix'
    });
  }

  if (report.qualityGates.tests === 'failed') {
    report.issues.push({
      severity: 'high',
      type: 'tests_failed',
      description: 'Test failures detected',
      suggestion: 'Fix failing tests'
    });
  }

  // Determine overall status
  const allCriteriaPassed = report.criteria.every(c => c.passed);
  const allGatesPassed = Object.values(report.qualityGates).every(
    g => g === 'passed' || g === 'unknown'
  );

  report.status = (allCriteriaPassed && allGatesPassed) ? 'passed' : 'needs_fix';

  return {
    passed: report.status === 'passed',
    issues: report.issues,
    report
  };
}

/**
 * Run QA fix attempt
 * @param {Array} issues - Array of issues to fix
 * @param {Object} context - Context for fixing (subtask, files, etc.)
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<{fixed: Array, remaining: Array, actions: Array}>}
 */
async function runQaFix(issues, context, projectRoot = process.cwd()) {
  const fixed = [];
  const remaining = [];
  const actions = [];

  for (const issue of issues) {
    // Determine fix action based on issue type
    const fixAction = determineFixAction(issue, context);

    if (fixAction.canAutoFix) {
      actions.push({
        issue,
        action: fixAction.action,
        file: fixAction.file,
        suggestion: fixAction.suggestion
      });
      fixed.push(issue);
    } else {
      remaining.push(issue);
    }
  }

  return { fixed, remaining, actions };
}

/**
 * Determine the fix action for an issue
 * @param {Object} issue - Issue to fix
 * @param {Object} context - Context for fixing
 * @returns {Object} Fix action details
 */
function determineFixAction(issue, context) {
  switch (issue.type) {
    case 'lint_failed':
      return {
        canAutoFix: true,
        action: 'run_lint_fix',
        command: 'npm run lint:fix',
        suggestion: issue.suggestion
      };

    case 'missing_export':
      return {
        canAutoFix: true,
        action: 'add_export',
        file: issue.file,
        suggestion: issue.suggestion
      };

    case 'typecheck_failed':
      return {
        canAutoFix: false,
        action: 'manual_fix',
        suggestion: 'Type errors require manual intervention'
      };

    case 'tests_failed':
      return {
        canAutoFix: false,
        action: 'manual_fix',
        suggestion: 'Failing tests require investigation'
      };

    case 'criterion_not_met':
      return {
        canAutoFix: false,
        action: 'implement',
        suggestion: issue.suggestion
      };

    default:
      return {
        canAutoFix: false,
        action: 'unknown',
        suggestion: 'Unknown issue type - requires manual review'
      };
  }
}

/**
 * Escalate issues to human when max iterations reached
 * @param {Array} issues - Remaining issues after max attempts
 * @param {Object} subtask - Subtask that failed QA
 * @param {number} attempts - Number of attempts made
 * @param {string} projectRoot - Project root directory
 * @returns {Object} Escalation report
 */
async function escalateToHuman(issues, subtask, attempts, projectRoot = process.cwd()) {
  const escalation = {
    timestamp: new Date().toISOString(),
    subtaskId: subtask.id,
    title: subtask.title,
    attempts,
    maxAttempts: MAX_QA_ITERATIONS,
    issues: issues.map(issue => ({
      ...issue,
      triedFixes: [] // Would be populated with actual fix attempts
    })),
    recommendation: generateRecommendation(issues),
    options: [
      { id: 'guidance', label: 'Provide guidance to continue' },
      { id: 'skip', label: 'Skip this subtask for now' },
      { id: 'abort', label: 'Abort RALPH run' }
    ]
  };

  // Log escalation to history
  const history = await loadQaHistory(projectRoot);
  history.sessions.push({
    type: 'escalation',
    ...escalation
  });
  await saveQaHistory(history, projectRoot);

  return escalation;
}

/**
 * Generate recommendation based on issues
 * @param {Array} issues - Array of issues
 * @returns {string} Recommendation text
 */
function generateRecommendation(issues) {
  const highSeverity = issues.filter(i => i.severity === 'high');

  if (highSeverity.some(i => i.type === 'typecheck_failed')) {
    return 'Type errors suggest architectural changes may be needed. Consider reviewing the type definitions.';
  }

  if (highSeverity.some(i => i.type === 'tests_failed')) {
    return 'Test failures may indicate logic errors or missing edge cases. Review test output carefully.';
  }

  if (highSeverity.some(i => i.type === 'criterion_not_met')) {
    return 'Some acceptance criteria could not be met automatically. The requirements may need clarification.';
  }

  return 'Multiple fix attempts failed. Human review recommended to determine the best path forward.';
}

/**
 * Track recurring issues across sessions
 * @param {Object} issue - Issue to track
 * @param {string} projectRoot - Project root directory
 */
async function trackRecurringIssue(issue, projectRoot = process.cwd()) {
  const history = await loadQaHistory(projectRoot);

  // Find or create recurring issue entry
  let recurring = history.recurringIssues.find(
    r => r.type === issue.type && r.file === issue.file
  );

  if (!recurring) {
    recurring = {
      type: issue.type,
      file: issue.file,
      occurrences: 0,
      firstSeen: new Date().toISOString(),
      lastSeen: null,
      resolutions: []
    };
    history.recurringIssues.push(recurring);
  }

  recurring.occurrences++;
  recurring.lastSeen = new Date().toISOString();

  // Flag if threshold reached
  if (recurring.occurrences >= RECURRING_ISSUE_THRESHOLD) {
    recurring.flaggedForReview = true;
  }

  await saveQaHistory(history, projectRoot);

  return recurring;
}

/**
 * Check if an issue is a known recurring issue
 * @param {Object} issue - Issue to check
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Object|null>} Recurring issue info or null
 */
async function checkRecurringIssue(issue, projectRoot = process.cwd()) {
  const history = await loadQaHistory(projectRoot);

  return history.recurringIssues.find(
    r => r.type === issue.type && r.file === issue.file
  ) || null;
}

/**
 * Log an insight from QA process
 * @param {string} context - Context of the insight
 * @param {string} learning - What was learned
 * @param {Array} tags - Tags for categorization
 * @param {string} projectRoot - Project root directory
 */
async function logQaInsight(context, learning, tags, projectRoot = process.cwd()) {
  const history = await loadQaHistory(projectRoot);

  history.insights.push({
    context,
    learning,
    tags,
    timestamp: new Date().toISOString()
  });

  await saveQaHistory(history, projectRoot);
}

/**
 * Get QA statistics
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Object>} QA statistics
 */
async function getQaStats(projectRoot = process.cwd()) {
  const history = await loadQaHistory(projectRoot);

  const sessions = history.sessions || [];
  const escalations = sessions.filter(s => s.type === 'escalation');
  const validations = sessions.filter(s => s.type === 'validation');

  return {
    totalSessions: sessions.length,
    escalations: escalations.length,
    successRate: validations.length > 0
      ? ((validations.filter(v => v.status === 'passed').length / validations.length) * 100).toFixed(1)
      : 'N/A',
    recurringIssues: history.recurringIssues.filter(r => r.flaggedForReview).length,
    insights: history.insights.length
  };
}

/**
 * Create a QA session
 * @param {string} subtaskId - Subtask being validated
 * @param {string} projectRoot - Project root directory
 * @returns {Object} Session object with methods
 */
function createQaSession(subtaskId, projectRoot = process.cwd()) {
  const session = {
    subtaskId,
    startTime: new Date().toISOString(),
    iterations: [],
    currentIteration: 0,
    maxIterations: MAX_QA_ITERATIONS,

    async runIteration(subtask, implementation) {
      if (this.currentIteration >= this.maxIterations) {
        return {
          shouldEscalate: true,
          issues: this.iterations[this.iterations.length - 1]?.remaining || []
        };
      }

      this.currentIteration++;

      const validation = await runQaValidation(subtask, implementation, projectRoot);

      if (validation.passed) {
        this.iterations.push({
          number: this.currentIteration,
          status: 'passed',
          timestamp: new Date().toISOString()
        });

        return { passed: true };
      }

      const fix = await runQaFix(validation.issues, { subtask }, projectRoot);

      this.iterations.push({
        number: this.currentIteration,
        status: 'needs_fix',
        issues: validation.issues,
        fixed: fix.fixed,
        remaining: fix.remaining,
        timestamp: new Date().toISOString()
      });

      // Track recurring issues
      for (const issue of validation.issues) {
        await trackRecurringIssue(issue, projectRoot);
      }

      return {
        passed: false,
        fixed: fix.fixed,
        remaining: fix.remaining,
        actions: fix.actions,
        shouldEscalate: fix.remaining.length > 0 && this.currentIteration >= this.maxIterations
      };
    },

    async complete(status) {
      const history = await loadQaHistory(projectRoot);

      history.sessions.push({
        type: 'validation',
        subtaskId: this.subtaskId,
        startTime: this.startTime,
        endTime: new Date().toISOString(),
        status,
        iterations: this.iterations,
        totalIterations: this.currentIteration
      });

      await saveQaHistory(history, projectRoot);
    }
  };

  return session;
}

export {
  MAX_QA_ITERATIONS,
  RECURRING_ISSUE_THRESHOLD,
  runQaValidation,
  runQaFix,
  escalateToHuman,
  trackRecurringIssue,
  checkRecurringIssue,
  logQaInsight,
  getQaStats,
  createQaSession,
  loadQaHistory,
  saveQaHistory,
  initQaHistory
};
