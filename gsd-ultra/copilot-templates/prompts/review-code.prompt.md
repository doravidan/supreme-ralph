---
description: 'Review code for quality, security, and best practices'
---

Review the selected code thoroughly for:

1. **Code Quality**
   - Readability and maintainability
   - Proper naming conventions
   - Code organization and structure
   - DRY principle (Don't Repeat Yourself)

2. **Potential Bugs**
   - Edge cases not handled
   - Null/undefined checks
   - Off-by-one errors
   - Race conditions

3. **Security Vulnerabilities**
   - Input validation
   - SQL injection risks
   - XSS vulnerabilities
   - Sensitive data exposure

4. **Performance**
   - Unnecessary iterations
   - Memory leaks
   - Inefficient algorithms
   - Missing caching opportunities

5. **Error Handling**
   - Proper try/catch blocks
   - Meaningful error messages
   - Error recovery strategies

Focus area: ${input:focus:all areas or specific concern}

Provide findings in order of severity:
- **Critical**: Security or data loss risks (fix immediately)
- **Major**: Bugs or significant issues (should fix)
- **Minor**: Style or minor improvements (nice to fix)
- **Suggestions**: Enhancements (consider fixing)

Include code examples for suggested improvements.
