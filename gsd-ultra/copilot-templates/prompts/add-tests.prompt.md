---
agent: 'agent'
description: 'Generate comprehensive tests for selected code'
---

Generate comprehensive tests for the selected code using ${input:framework:the project's test framework}.

## Test Coverage Requirements

1. **Happy Path Tests**
   - Test normal/expected inputs
   - Verify correct outputs
   - Test common use cases

2. **Edge Cases**
   - Empty inputs (null, undefined, empty string, empty array)
   - Boundary values (min, max, zero)
   - Large inputs
   - Special characters

3. **Error Handling**
   - Invalid inputs
   - Missing required parameters
   - Network/IO failures (if applicable)
   - Permission errors

4. **Input Validation**
   - Type checking
   - Format validation
   - Range checking

## Output Format

Provide tests in the following structure:

```
describe('[Component/Function Name]', () => {
  describe('[method/scenario]', () => {
    it('should [expected behavior] when [condition]', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## Guidelines

- Use meaningful test descriptions
- Follow the Arrange-Act-Assert pattern
- Mock external dependencies
- Each test should verify ONE thing
- Tests should be independent and isolated
- Include setup and teardown where needed
