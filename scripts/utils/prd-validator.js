/**
 * PRD Validator
 *
 * Validates prd.json structure before RALPH runs.
 *
 * @module prd-validator
 */

/**
 * PRD Schema definition
 */
const PRD_SCHEMA = {
  required: ['project', 'branchName', 'userStories'],
  optional: ['description', 'createdAt', 'projectContext', 'techStack'],
  userStoryRequired: ['id', 'title', 'acceptanceCriteria', 'priority'],
  userStoryOptional: ['description', 'passes', 'notes']
};

/**
 * Validate a PRD object
 * @param {object} prd - The PRD object to validate
 * @returns {object} Validation result with valid boolean, errors, and warnings
 */
export function validatePrd(prd) {
  const errors = [];
  const warnings = [];

  if (!prd || typeof prd !== 'object') {
    return {
      valid: false,
      errors: ['PRD must be a valid JSON object'],
      warnings: []
    };
  }

  // Check required fields
  for (const field of PRD_SCHEMA.required) {
    if (prd[field] === undefined || prd[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate project name
  if (prd.project && typeof prd.project !== 'string') {
    errors.push('project must be a string');
  }

  // Validate branch name
  if (prd.branchName) {
    if (typeof prd.branchName !== 'string') {
      errors.push('branchName must be a string');
    } else if (!prd.branchName.startsWith('ralph/')) {
      warnings.push('branchName should start with "ralph/" for consistency');
    }
  }

  // Validate user stories
  if (prd.userStories) {
    if (!Array.isArray(prd.userStories)) {
      errors.push('userStories must be an array');
    } else if (prd.userStories.length === 0) {
      errors.push('userStories cannot be empty');
    } else {
      prd.userStories.forEach((story, index) => {
        const storyErrors = validateUserStory(story, index);
        errors.push(...storyErrors.errors);
        warnings.push(...storyErrors.warnings);
      });
    }
  }

  // Check for duplicate story IDs
  if (prd.userStories && Array.isArray(prd.userStories)) {
    const ids = prd.userStories.map(s => s.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (duplicates.length > 0) {
      errors.push(`Duplicate story IDs found: ${[...new Set(duplicates)].join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate a single user story
 * @param {object} story - The user story to validate
 * @param {number} index - Story index for error messages
 * @returns {object} Validation result with errors and warnings
 */
function validateUserStory(story, index) {
  const errors = [];
  const warnings = [];
  const prefix = `Story [${index}]`;

  if (!story || typeof story !== 'object') {
    errors.push(`${prefix}: must be an object`);
    return { errors, warnings };
  }

  // Check required fields
  for (const field of PRD_SCHEMA.userStoryRequired) {
    if (story[field] === undefined || story[field] === null) {
      errors.push(`${prefix}: missing required field '${field}'`);
    }
  }

  // Validate ID format
  if (story.id && typeof story.id === 'string') {
    if (!story.id.match(/^US-\d+$/)) {
      warnings.push(`${prefix}: ID '${story.id}' should follow format 'US-NNN'`);
    }
  }

  // Validate title
  if (story.title && typeof story.title !== 'string') {
    errors.push(`${prefix}: title must be a string`);
  }

  // Validate acceptance criteria
  if (story.acceptanceCriteria) {
    if (!Array.isArray(story.acceptanceCriteria)) {
      errors.push(`${prefix}: acceptanceCriteria must be an array`);
    } else if (story.acceptanceCriteria.length === 0) {
      errors.push(`${prefix}: acceptanceCriteria cannot be empty`);
    } else {
      // Check for typecheck criteria
      const hasTypecheck = story.acceptanceCriteria.some(c =>
        typeof c === 'string' && c.toLowerCase().includes('typecheck')
      );
      if (!hasTypecheck) {
        warnings.push(`${prefix}: Consider adding 'Typecheck passes' to acceptance criteria`);
      }
    }
  }

  // Validate priority
  if (story.priority !== undefined) {
    if (typeof story.priority !== 'number' || story.priority < 1) {
      errors.push(`${prefix}: priority must be a positive number`);
    }
  }

  // Validate passes flag
  if (story.passes !== undefined && typeof story.passes !== 'boolean') {
    warnings.push(`${prefix}: passes should be a boolean (true/false)`);
  }

  return { errors, warnings };
}

/**
 * Get PRD statistics
 * @param {object} prd - The PRD object
 * @returns {object} Statistics about the PRD
 */
export function getPrdStats(prd) {
  if (!prd || !prd.userStories || !Array.isArray(prd.userStories)) {
    return {
      total: 0,
      complete: 0,
      remaining: 0,
      percentComplete: 0,
      nextStory: null
    };
  }

  const total = prd.userStories.length;
  const complete = prd.userStories.filter(s => s.passes).length;
  const remaining = total - complete;
  const percentComplete = total > 0 ? Math.round((complete / total) * 100) : 0;

  // Find next incomplete story
  const nextStory = prd.userStories.find(s => !s.passes) || null;

  return {
    total,
    complete,
    remaining,
    percentComplete,
    nextStory
  };
}

/**
 * Format validation result for display
 * @param {object} result - Validation result
 * @returns {string} Formatted output
 */
export function formatValidationResult(result) {
  const lines = [];

  if (result.valid) {
    lines.push('✓ PRD validation passed');
  } else {
    lines.push('✗ PRD validation failed');
  }

  if (result.errors.length > 0) {
    lines.push('\nErrors:');
    result.errors.forEach(e => lines.push(`  - ${e}`));
  }

  if (result.warnings.length > 0) {
    lines.push('\nWarnings:');
    result.warnings.forEach(w => lines.push(`  ⚠ ${w}`));
  }

  return lines.join('\n');
}

export default {
  validatePrd,
  getPrdStats,
  formatValidationResult
};
