---
applyTo: "**/*.js"
---

# JavaScript Code Guidelines

## Module System
- Use ES6 modules (`import`/`export`) exclusively
- Import order: Node built-ins, external packages, local modules
- Add `.js` extension to local imports

```javascript
// Good
import fs from 'fs';
import chalk from 'chalk';
import { helper } from './utils/helper.js';

// Bad - CommonJS
const fs = require('fs');
```

## Async Patterns
- Always use `async`/`await` over raw Promises
- Handle errors with try/catch blocks
- Provide user-friendly error messages

```javascript
// Good
async function fetchData() {
  try {
    const result = await fetch(url);
    return result.json();
  } catch (error) {
    console.error('Failed to fetch:', error.message);
    throw error;
  }
}

// Avoid
function fetchData() {
  return fetch(url).then(r => r.json()).catch(e => console.log(e));
}
```

## Variable Declarations
- Prefer `const` over `let`
- Never use `var`
- Use meaningful, descriptive names

## Functions
- Keep functions small and focused (max 30 lines recommended)
- Use early returns to reduce nesting
- Use arrow functions for callbacks

## Error Handling
- Always catch and handle errors
- Provide context in error messages
- Don't swallow errors silently
