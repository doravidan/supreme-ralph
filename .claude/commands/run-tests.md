---
description: Run tests and analyze results
allowed-tools: Bash(node:*), Bash(npm:*), Read, Edit
---

# Run Tests

Execute the test suite and analyze any failures.

## Steps

1. **Run the test suite**
   ```bash
   npm test
   ```

2. **If tests fail**, analyze the output:
   - Identify which tests failed
   - Read the relevant test file
   - Read the source file being tested
   - Determine root cause

3. **For each failure**, provide:
   - Test name and file location
   - Expected vs actual behavior
   - Root cause analysis
   - Proposed fix

## Test File Locations

Tests are typically located:
- Adjacent to source: `scripts/utils/template-generator.test.js`
- In tests directory: `tests/`

## Common Test Patterns

### Template Generation Tests
```javascript
describe('generateClaudeMd', () => {
  it('should include project name', async () => {
    const result = await generateClaudeMd({ projectName: 'test' });
    expect(result).toContain('# Project: test');
  });
});
```

### File Operation Tests
```javascript
describe('setup', () => {
  it('should create .claude directory', async () => {
    await setup({ target: testDir });
    expect(await fs.pathExists(path.join(testDir, '.claude'))).toBe(true);
  });
});
```

## Fix Implementation

When fixing a test failure:
1. Understand what the test expects
2. Identify why the actual behavior differs
3. Fix the source code (not the test, unless the test is wrong)
4. Re-run tests to verify the fix
