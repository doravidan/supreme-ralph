/**
 * Template Engine
 *
 * A robust template engine supporting:
 * - {{variable}} placeholder syntax
 * - {{#if condition}}...{{/if}} conditionals
 * - {{#each items}}...{{/each}} loops
 * - Validation and helpful error messages
 *
 * @module template-engine
 */

/**
 * Template Engine Class
 */
export class TemplateEngine {
  /**
   * Create a new TemplateEngine instance
   * @param {object} options - Configuration options
   * @param {boolean} options.strictMode - Throw on missing variables (default: false)
   * @param {boolean} options.warnOnMissing - Log warning on missing variables (default: true)
   * @param {string} options.undefinedValue - Value to use for undefined variables (default: '')
   */
  constructor(options = {}) {
    this.strictMode = options.strictMode || false;
    this.warnOnMissing = options.warnOnMissing !== false;
    this.undefinedValue = options.undefinedValue || '';
  }

  /**
   * Render a template with the given context
   *
   * @param {string} template - Template string
   * @param {object} context - Variables to substitute
   * @returns {string} Rendered template
   * @throws {Error} In strict mode, throws if variables are missing
   */
  render(template, context = {}) {
    if (!template || typeof template !== 'string') {
      return '';
    }

    let result = template;

    // Process conditionals first (they may contain variables)
    result = this._processConditionals(result, context);

    // Process loops
    result = this._processLoops(result, context);

    // Process simple variable substitutions
    result = this._processVariables(result, context);

    return result;
  }

  /**
   * Process {{#if condition}}...{{else}}...{{/if}} blocks
   */
  _processConditionals(template, context) {
    // Match {{#if condition}}...{{else}}...{{/if}} with optional else
    const ifRegex = /\{\{#if\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g;

    return template.replace(ifRegex, (match, condition, ifContent, elseContent = '') => {
      const value = this._getValue(context, condition);
      const isTruthy = this._isTruthy(value);

      if (isTruthy) {
        return ifContent;
      } else {
        return elseContent;
      }
    });
  }

  /**
   * Process {{#each items}}...{{/each}} blocks
   */
  _processLoops(template, context) {
    // Match {{#each items}}...{{/each}}
    const eachRegex = /\{\{#each\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/each\}\}/g;

    return template.replace(eachRegex, (match, arrayPath, loopContent) => {
      const items = this._getValue(context, arrayPath);

      if (!Array.isArray(items)) {
        if (this.warnOnMissing) {
          console.warn(`[template-engine] Expected array for {{#each ${arrayPath}}}, got ${typeof items}`);
        }
        return '';
      }

      return items.map((item, index) => {
        // Create loop context with item, index, and parent context
        const loopContext = {
          ...context,
          this: item,
          '@index': index,
          '@first': index === 0,
          '@last': index === items.length - 1
        };

        // If item is an object, spread its properties too
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          Object.assign(loopContext, item);
        }

        // Recursively process the loop content
        return this.render(loopContent, loopContext);
      }).join('');
    });
  }

  /**
   * Process {{variable}} substitutions
   */
  _processVariables(template, context) {
    // Match {{variable}} or {{variable.nested.path}}
    const varRegex = /\{\{(\w+(?:\.\w+)*)\}\}/g;
    const missingVars = [];

    const result = template.replace(varRegex, (match, varPath) => {
      // Handle special loop variables
      if (varPath === 'this') {
        return String(context.this !== undefined ? context.this : this.undefinedValue);
      }

      const value = this._getValue(context, varPath);

      if (value === undefined) {
        missingVars.push(varPath);
        return this.undefinedValue;
      }

      return String(value);
    });

    // Handle missing variables
    if (missingVars.length > 0) {
      if (this.strictMode) {
        throw new Error(`Missing template variables: ${missingVars.join(', ')}`);
      }
      if (this.warnOnMissing) {
        console.warn(`[template-engine] Missing variables: ${missingVars.join(', ')}`);
      }
    }

    return result;
  }

  /**
   * Get a value from context using dot notation path
   */
  _getValue(context, path) {
    const parts = path.split('.');
    let value = context;

    for (const part of parts) {
      if (value === undefined || value === null) {
        return undefined;
      }
      value = value[part];
    }

    return value;
  }

  /**
   * Check if a value is truthy for conditionals
   */
  _isTruthy(value) {
    if (value === undefined || value === null) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value.length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return Boolean(value);
  }

  /**
   * Validate a template and return list of required variables
   *
   * @param {string} template - Template to validate
   * @returns {object} Validation result with variables, conditionals, loops
   */
  validate(template) {
    const variables = new Set();
    const conditionals = new Set();
    const loops = new Set();
    const errors = [];

    // Find all variable references
    const varRegex = /\{\{(\w+(?:\.\w+)*)\}\}/g;
    let match;
    while ((match = varRegex.exec(template)) !== null) {
      const varName = match[1];
      if (!varName.startsWith('@')) {
        variables.add(varName.split('.')[0]);
      }
    }

    // Find conditionals
    const ifRegex = /\{\{#if\s+(\w+(?:\.\w+)*)\}\}/g;
    while ((match = ifRegex.exec(template)) !== null) {
      conditionals.add(match[1].split('.')[0]);
    }

    // Find loops
    const eachRegex = /\{\{#each\s+(\w+(?:\.\w+)*)\}\}/g;
    while ((match = eachRegex.exec(template)) !== null) {
      loops.add(match[1].split('.')[0]);
    }

    // Check for unmatched blocks
    const ifOpens = (template.match(/\{\{#if\s+/g) || []).length;
    const ifCloses = (template.match(/\{\{\/if\}\}/g) || []).length;
    if (ifOpens !== ifCloses) {
      errors.push(`Unmatched {{#if}}: ${ifOpens} opens, ${ifCloses} closes`);
    }

    const eachOpens = (template.match(/\{\{#each\s+/g) || []).length;
    const eachCloses = (template.match(/\{\{\/each\}\}/g) || []).length;
    if (eachOpens !== eachCloses) {
      errors.push(`Unmatched {{#each}}: ${eachOpens} opens, ${eachCloses} closes`);
    }

    return {
      valid: errors.length === 0,
      variables: Array.from(variables),
      conditionals: Array.from(conditionals),
      loops: Array.from(loops),
      errors
    };
  }
}

// Create default instance
const defaultEngine = new TemplateEngine();

/**
 * Render a template with the given context (using default engine)
 *
 * @param {string} template - Template string
 * @param {object} context - Variables to substitute
 * @returns {string} Rendered template
 */
export function render(template, context = {}) {
  return defaultEngine.render(template, context);
}

/**
 * Validate a template (using default engine)
 *
 * @param {string} template - Template to validate
 * @returns {object} Validation result
 */
export function validate(template) {
  return defaultEngine.validate(template);
}

/**
 * Create a new TemplateEngine instance with custom options
 *
 * @param {object} options - Configuration options
 * @returns {TemplateEngine} New engine instance
 */
export function createEngine(options = {}) {
  return new TemplateEngine(options);
}

/**
 * Legacy compatibility: Apply variables to a template string
 * Supports the existing {{variableName}} syntax used in the codebase
 *
 * @param {string} template - Template string with {{var}} placeholders
 * @param {object} variables - Key-value pairs for substitution
 * @returns {string} Template with variables replaced
 */
export function applyVariables(template, variables = {}) {
  return render(template, variables);
}

export default {
  TemplateEngine,
  render,
  validate,
  createEngine,
  applyVariables
};
