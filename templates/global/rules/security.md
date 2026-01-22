# Security Rules

## Sensitive Data Protection
- NEVER commit secrets, API keys, or credentials to version control
- Use environment variables for all sensitive configuration
- Never log sensitive information (passwords, tokens, PII)
- Sanitize data before including in error messages

## Input Validation
- Validate ALL user input on the server side
- Use allowlists rather than denylists for validation
- Sanitize inputs before use in SQL, HTML, or shell commands
- Implement proper encoding for output contexts

## Authentication & Authorization
- Use strong, salted password hashing (bcrypt, argon2)
- Implement proper session management
- Use secure, HTTP-only cookies
- Apply principle of least privilege

## Database Security
- Use parameterized queries (prepared statements)
- Never concatenate user input into SQL strings
- Limit database user permissions
- Encrypt sensitive data at rest

## API Security
- Use HTTPS for all endpoints
- Implement rate limiting
- Validate JWT tokens properly
- Use CORS appropriately

## Dependency Security
- Keep dependencies updated
- Review security advisories regularly
- Use lock files for reproducible builds
- Audit dependencies periodically

## Error Handling
- Don't expose stack traces to users
- Log errors securely for debugging
- Return generic error messages to clients
- Handle all error cases explicitly
