---
applyTo: "**/tests/**/*,**/*.test.*,**/*.spec.*,**/test_*"
---

# Test Code Guidelines

## Structure
- Use `describe` blocks to group related tests
- Use clear, descriptive test names
- Follow Arrange-Act-Assert pattern

```javascript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a user with valid data', async () => {
      // Arrange
      const userData = { name: 'John', email: 'john@example.com' };

      // Act
      const user = await userService.createUser(userData);

      // Assert
      expect(user.id).toBeDefined();
      expect(user.name).toBe('John');
    });

    it('should throw error for invalid email', async () => {
      // Arrange
      const userData = { name: 'John', email: 'invalid' };

      // Act & Assert
      await expect(userService.createUser(userData))
        .rejects.toThrow('Invalid email');
    });
  });
});
```

## Naming
- Test names should describe the expected behavior
- Use "should" prefix: "should return null when user not found"
- Group by feature/method, not by test type

## Test Types
- **Unit tests**: Test single functions/classes in isolation
- **Integration tests**: Test multiple components together
- **E2E tests**: Test full user flows

## Mocking
- Mock external dependencies (APIs, databases)
- Don't mock the thing you're testing
- Prefer dependency injection for testability

```javascript
// Good - inject dependency
function createUserService(database) {
  return {
    async getUser(id) {
      return database.findById(id);
    }
  };
}

// Test with mock
const mockDb = { findById: vi.fn() };
const service = createUserService(mockDb);
```

## Best Practices
- One assertion concept per test
- Tests should be independent (no shared state)
- Tests should be deterministic (same input = same output)
- Use meaningful test data, not random values
- Clean up after tests (database records, files)

## Coverage
- Aim for meaningful coverage, not 100%
- Test edge cases and error paths
- Test public API, not implementation details
