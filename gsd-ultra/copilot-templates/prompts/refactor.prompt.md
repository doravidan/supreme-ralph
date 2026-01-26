---
agent: 'agent'
description: 'Refactor code for improved quality and maintainability'
---

Refactor the selected code to improve ${input:goal:readability, performance, maintainability, or all}.

## Refactoring Guidelines

1. **Preserve Behavior**
   - Refactoring must NOT change what the code does
   - All existing tests should still pass
   - External API should remain compatible (unless breaking change is approved)

2. **Improvements to Consider**
   - Extract complex logic into well-named functions
   - Reduce nesting with early returns
   - Replace magic numbers with named constants
   - Apply DRY principle (Don't Repeat Yourself)
   - Improve variable and function names
   - Simplify conditional logic
   - Remove dead code

3. **Code Smells to Address**
   - Long methods (>30 lines)
   - Deeply nested code (>3 levels)
   - Duplicate code
   - God objects/functions
   - Primitive obsession
   - Feature envy

4. **Modern Patterns**
   - Use modern language features
   - Apply appropriate design patterns
   - Consider async/await for promises
   - Use destructuring where appropriate

## Output Format

Provide:
1. **Summary of changes** - What was refactored and why
2. **Refactored code** - The improved implementation
3. **Before/After comparison** - Key differences highlighted
4. **Testing notes** - Any tests that should be added or updated

## Constraints

- Keep changes focused and minimal
- Don't add new features
- Don't change public interfaces without noting it
- Maintain or improve performance
