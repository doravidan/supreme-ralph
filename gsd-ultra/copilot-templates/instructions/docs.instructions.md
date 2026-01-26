---
applyTo: "**/*.md,**/docs/**/*"
---

# Documentation Guidelines

## Markdown Style
- Use ATX-style headers (`#` not underlines)
- One sentence per line for easier diffs
- Use fenced code blocks with language identifiers

## README Structure
Follow this order for README files:
1. Title and brief description
2. Installation instructions
3. Quick start / Usage
4. Configuration options
5. API reference (if applicable)
6. Contributing guidelines
7. License

## Code Examples
- Include working, tested code examples
- Show common use cases first
- Add comments explaining non-obvious parts

```javascript
// Example of proper code documentation
import { createClient } from 'my-library';

// Initialize with API key from environment
const client = createClient({
  apiKey: process.env.API_KEY,
  timeout: 5000  // Optional: request timeout in ms
});

// Basic usage
const result = await client.fetch('/users');
```

## API Documentation
- Document all public functions/methods
- Include parameter types and descriptions
- Show return values and possible errors
- Provide usage examples

```markdown
### `fetchUser(id: string): Promise<User>`

Fetches a user by their unique identifier.

**Parameters:**
- `id` - The user's unique identifier

**Returns:**
- `Promise<User>` - The user object

**Throws:**
- `NotFoundError` - If user doesn't exist
- `NetworkError` - If request fails

**Example:**
\`\`\`javascript
const user = await fetchUser('usr_123');
console.log(user.name);
\`\`\`
```

## Changelog
- Follow Keep a Changelog format
- Group by: Added, Changed, Deprecated, Removed, Fixed, Security
- Include version numbers and dates

## Writing Style
- Use active voice
- Be concise but complete
- Use "you" to address the reader
- Avoid jargon; explain technical terms
