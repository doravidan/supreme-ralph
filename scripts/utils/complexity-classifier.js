/**
 * Complexity Classifier
 *
 * Analyzes PRD/spec to determine SIMPLE/STANDARD/COMPLEX pipeline adaptation.
 * Affects how RALPH orchestrates agents and resources.
 *
 * @module complexity-classifier
 */

import fs from 'fs-extra';
import path from 'path';

// Complexity levels
const COMPLEXITY = {
  SIMPLE: 'SIMPLE',
  STANDARD: 'STANDARD',
  COMPLEX: 'COMPLEX'
};

// Thresholds for classification
const THRESHOLDS = {
  SIMPLE: {
    maxStories: 2,
    maxFiles: 3,
    maxDependencies: 1,
    maxAcceptanceCriteria: 8
  },
  STANDARD: {
    maxStories: 6,
    maxFiles: 10,
    maxDependencies: 5,
    maxAcceptanceCriteria: 30
  }
  // COMPLEX: anything above STANDARD
};

// Complexity indicators (add points for each)
const COMPLEXITY_INDICATORS = {
  // Architectural complexity
  hasArchitecturalChanges: 10,
  hasNewDatabase: 8,
  hasNewService: 5,
  hasNewAPI: 4,
  hasAuthentication: 6,
  hasAuthorization: 5,

  // Integration complexity
  hasExternalAPIs: 7,
  hasThirdPartyLibs: 3,
  hasWebhooks: 5,
  hasRealtime: 8,

  // Testing complexity
  requiresIntegrationTests: 4,
  requiresE2ETests: 6,
  requiresPerformanceTests: 5,

  // Other
  hasMigrations: 5,
  hasBackwardsCompatibility: 6,
  hasSecurityRequirements: 7
};

/**
 * Load PRD from file
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Object|null>} PRD object or null
 */
async function loadPrd(projectRoot = process.cwd()) {
  const prdPath = path.join(projectRoot, 'prd.json');

  if (await fs.pathExists(prdPath)) {
    return await fs.readJson(prdPath);
  }

  return null;
}

/**
 * Count total files affected by a PRD
 * @param {Object} prd - PRD object
 * @returns {number} Total file count
 */
function countAffectedFiles(prd) {
  const files = new Set();

  for (const story of prd.userStories || []) {
    // Parse acceptance criteria for file mentions
    for (const criterion of story.acceptanceCriteria || []) {
      // Look for file patterns
      const fileMatches = criterion.match(/[\w\-]+\.\w+/g) || [];
      fileMatches.forEach(f => files.add(f));

      // Look for path patterns
      const pathMatches = criterion.match(/(?:src|lib|tests?)\/[\w\-\/]+/g) || [];
      pathMatches.forEach(p => files.add(p));
    }
  }

  return files.size;
}

/**
 * Count story dependencies
 * @param {Object} prd - PRD object
 * @returns {number} Dependency count
 */
function countDependencies(prd) {
  let deps = 0;

  for (const story of prd.userStories || []) {
    // Check if story mentions dependencies
    const desc = (story.description || '').toLowerCase();
    if (desc.includes('depends on') || desc.includes('requires')) {
      deps++;
    }

    // Check for blocked/blocking indicators
    if (story.blockedBy || story.blocks) {
      deps += (story.blockedBy?.length || 0) + (story.blocks?.length || 0);
    }
  }

  return deps;
}

/**
 * Count total acceptance criteria
 * @param {Object} prd - PRD object
 * @returns {number} Total criteria count
 */
function countAcceptanceCriteria(prd) {
  let count = 0;

  for (const story of prd.userStories || []) {
    count += (story.acceptanceCriteria || []).length;
  }

  return count;
}

/**
 * Detect complexity indicators in PRD
 * @param {Object} prd - PRD object
 * @returns {Object} Indicators found with scores
 */
function detectComplexityIndicators(prd) {
  const found = {};
  const content = JSON.stringify(prd).toLowerCase();

  // Check for architectural changes
  if (content.includes('architecture') || content.includes('refactor') || content.includes('redesign')) {
    found.hasArchitecturalChanges = COMPLEXITY_INDICATORS.hasArchitecturalChanges;
  }

  // Check for database work
  if (content.includes('database') || content.includes('migration') || content.includes('schema')) {
    found.hasNewDatabase = COMPLEXITY_INDICATORS.hasNewDatabase;
  }

  // Check for new service
  if (content.includes('service') || content.includes('microservice')) {
    found.hasNewService = COMPLEXITY_INDICATORS.hasNewService;
  }

  // Check for API work
  if (content.includes('api') || content.includes('endpoint') || content.includes('rest')) {
    found.hasNewAPI = COMPLEXITY_INDICATORS.hasNewAPI;
  }

  // Check for authentication
  if (content.includes('auth') || content.includes('login') || content.includes('password')) {
    found.hasAuthentication = COMPLEXITY_INDICATORS.hasAuthentication;
  }

  // Check for authorization
  if (content.includes('permission') || content.includes('role') || content.includes('access control')) {
    found.hasAuthorization = COMPLEXITY_INDICATORS.hasAuthorization;
  }

  // Check for external APIs
  if (content.includes('external api') || content.includes('third-party') || content.includes('integration')) {
    found.hasExternalAPIs = COMPLEXITY_INDICATORS.hasExternalAPIs;
  }

  // Check for webhooks
  if (content.includes('webhook') || content.includes('callback')) {
    found.hasWebhooks = COMPLEXITY_INDICATORS.hasWebhooks;
  }

  // Check for realtime
  if (content.includes('realtime') || content.includes('websocket') || content.includes('socket')) {
    found.hasRealtime = COMPLEXITY_INDICATORS.hasRealtime;
  }

  // Check for integration tests
  if (content.includes('integration test')) {
    found.requiresIntegrationTests = COMPLEXITY_INDICATORS.requiresIntegrationTests;
  }

  // Check for E2E tests
  if (content.includes('e2e') || content.includes('end-to-end')) {
    found.requiresE2ETests = COMPLEXITY_INDICATORS.requiresE2ETests;
  }

  // Check for migrations
  if (content.includes('migration')) {
    found.hasMigrations = COMPLEXITY_INDICATORS.hasMigrations;
  }

  // Check for backwards compatibility
  if (content.includes('backwards compat') || content.includes('backward compat') || content.includes('breaking change')) {
    found.hasBackwardsCompatibility = COMPLEXITY_INDICATORS.hasBackwardsCompatibility;
  }

  // Check for security requirements
  if (content.includes('security') || content.includes('vulnerability') || content.includes('owasp')) {
    found.hasSecurityRequirements = COMPLEXITY_INDICATORS.hasSecurityRequirements;
  }

  return found;
}

/**
 * Calculate complexity score
 * @param {Object} metrics - Metrics object
 * @param {Object} indicators - Indicators found
 * @returns {number} Complexity score
 */
function calculateScore(metrics, indicators) {
  let score = 0;

  // Base score from metrics
  score += metrics.storyCount * 2;
  score += metrics.fileCount * 1.5;
  score += metrics.dependencyCount * 3;
  score += metrics.criteriaCount * 0.5;

  // Add indicator scores
  for (const value of Object.values(indicators)) {
    score += value;
  }

  return Math.round(score);
}

/**
 * Determine complexity level from score
 * @param {number} score - Complexity score
 * @param {Object} metrics - Metrics object
 * @returns {string} SIMPLE, STANDARD, or COMPLEX
 */
function determineLevel(score, metrics) {
  // Quick checks for SIMPLE
  if (
    metrics.storyCount <= THRESHOLDS.SIMPLE.maxStories &&
    metrics.fileCount <= THRESHOLDS.SIMPLE.maxFiles &&
    metrics.dependencyCount <= THRESHOLDS.SIMPLE.maxDependencies &&
    score < 15
  ) {
    return COMPLEXITY.SIMPLE;
  }

  // Check for STANDARD
  if (
    metrics.storyCount <= THRESHOLDS.STANDARD.maxStories &&
    metrics.fileCount <= THRESHOLDS.STANDARD.maxFiles &&
    metrics.dependencyCount <= THRESHOLDS.STANDARD.maxDependencies &&
    score < 40
  ) {
    return COMPLEXITY.STANDARD;
  }

  // Everything else is COMPLEX
  return COMPLEXITY.COMPLEX;
}

/**
 * Classify PRD complexity
 * @param {Object} prd - PRD object
 * @returns {Object} Classification result
 */
function classifyPrd(prd) {
  // Gather metrics
  const metrics = {
    storyCount: (prd.userStories || []).length,
    fileCount: countAffectedFiles(prd),
    dependencyCount: countDependencies(prd),
    criteriaCount: countAcceptanceCriteria(prd)
  };

  // Detect indicators
  const indicators = detectComplexityIndicators(prd);

  // Calculate score
  const score = calculateScore(metrics, indicators);

  // Determine level
  const level = determineLevel(score, metrics);

  return {
    level,
    score,
    metrics,
    indicators,
    thresholds: THRESHOLDS,
    recommendation: getRecommendation(level)
  };
}

/**
 * Get pipeline recommendation based on complexity
 * @param {string} level - Complexity level
 * @returns {Object} Pipeline recommendation
 */
function getRecommendation(level) {
  switch (level) {
    case COMPLEXITY.SIMPLE:
      return {
        usePlanner: false,
        qaDepth: 'light',
        parallelAgents: false,
        researchPhase: false,
        selfCritique: false,
        description: 'Direct implementation by Coder with light QA validation'
      };

    case COMPLEXITY.STANDARD:
      return {
        usePlanner: true,
        qaDepth: 'standard',
        parallelAgents: true,
        researchPhase: false,
        selfCritique: false,
        description: 'Full Planner → Coder → QA pipeline with parallel execution'
      };

    case COMPLEXITY.COMPLEX:
      return {
        usePlanner: true,
        qaDepth: 'extensive',
        parallelAgents: true,
        researchPhase: true,
        selfCritique: true,
        description: 'Research phase + extended planning + extensive QA with self-critique'
      };

    default:
      return {
        usePlanner: true,
        qaDepth: 'standard',
        parallelAgents: false,
        researchPhase: false,
        selfCritique: false,
        description: 'Default standard pipeline'
      };
  }
}

/**
 * Classify complexity and update PRD file
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Object>} Classification result
 */
async function classifyAndUpdatePrd(projectRoot = process.cwd()) {
  const prd = await loadPrd(projectRoot);

  if (!prd) {
    throw new Error('No prd.json found in project');
  }

  const classification = classifyPrd(prd);

  // Update PRD with complexity field
  prd.complexity = classification.level;
  prd.complexityDetails = {
    score: classification.score,
    metrics: classification.metrics,
    indicators: Object.keys(classification.indicators),
    classifiedAt: new Date().toISOString()
  };

  // Save updated PRD
  const prdPath = path.join(projectRoot, 'prd.json');
  await fs.writeJson(prdPath, prd, { spaces: 2 });

  return classification;
}

/**
 * Get complexity summary string
 * @param {Object} classification - Classification result
 * @returns {string} Formatted summary
 */
function formatClassification(classification) {
  const { level, score, metrics, indicators, recommendation } = classification;

  let output = `
╔════════════════════════════════════════════════════════════════╗
║                 Complexity Classification                       ║
╚════════════════════════════════════════════════════════════════╝

Level: ${level}
Score: ${score}

Metrics:
  Stories: ${metrics.storyCount}
  Files affected: ${metrics.fileCount}
  Dependencies: ${metrics.dependencyCount}
  Acceptance criteria: ${metrics.criteriaCount}

`;

  if (Object.keys(indicators).length > 0) {
    output += `Complexity Indicators:\n`;
    for (const [key, value] of Object.entries(indicators)) {
      output += `  - ${key}: +${value} points\n`;
    }
    output += '\n';
  }

  output += `Pipeline Recommendation:
  ${recommendation.description}

  Settings:
    Use Planner: ${recommendation.usePlanner}
    QA Depth: ${recommendation.qaDepth}
    Parallel Agents: ${recommendation.parallelAgents}
    Research Phase: ${recommendation.researchPhase}
    Self-Critique: ${recommendation.selfCritique}
`;

  return output;
}

export {
  COMPLEXITY,
  THRESHOLDS,
  COMPLEXITY_INDICATORS,
  classifyPrd,
  classifyAndUpdatePrd,
  loadPrd,
  countAffectedFiles,
  countDependencies,
  countAcceptanceCriteria,
  detectComplexityIndicators,
  calculateScore,
  determineLevel,
  getRecommendation,
  formatClassification
};
