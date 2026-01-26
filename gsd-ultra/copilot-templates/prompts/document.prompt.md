---
description: 'Generate documentation for the selected code'
---

Generate ${input:type:JSDoc/docstring/README/API} documentation for the selected code.

## Documentation Requirements

### For Functions/Methods
```javascript
/**
 * Brief description of what the function does.
 *
 * More detailed description if needed, explaining:
 * - When to use this function
 * - Important behavior notes
 * - Side effects
 *
 * @param {Type} paramName - Description of parameter
 * @param {Type} [optionalParam] - Description (optional)
 * @param {Type} [paramWithDefault=defaultValue] - Description
 * @returns {Type} Description of return value
 * @throws {ErrorType} When this error occurs
 * @example
 * // Example usage
 * const result = functionName(arg1, arg2);
 */
```

### For Classes
```javascript
/**
 * Brief description of the class.
 *
 * @class
 * @example
 * const instance = new ClassName(config);
 * instance.method();
 */
```

### For Modules/Files
```javascript
/**
 * @fileoverview Brief description of what this file/module does.
 *
 * This module provides:
 * - Feature 1
 * - Feature 2
 *
 * @module moduleName
 */
```

## Guidelines

- Be concise but complete
- Use active voice
- Include practical examples
- Document edge cases and error conditions
- Keep examples simple and focused
- Update documentation when code changes

## Output

Provide complete documentation that can be directly inserted into the code.
