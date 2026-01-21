# TypeScript Project

A TypeScript application with modern best practices.

## Tech Stack

- **Language**: TypeScript 5.x
- **Runtime**: Node.js 20+
- **Package Manager**: npm/pnpm
- **Testing**: Vitest/Jest
- **Linting**: ESLint + Prettier

## Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript |
| `npm run dev` | Start development server |
| `npm test` | Run tests |
| `npm run lint` | Run linter |
| `npm run type-check` | Type checking |

## Code Style

### TypeScript Conventions
- Use strict mode (`"strict": true`)
- Prefer `const` over `let`
- Use interfaces for object shapes
- Avoid `any` - use `unknown` when needed
- Use enums for fixed sets of values
- Prefer `type` for unions/intersections

### Naming
- **Interfaces**: PascalCase with `I` prefix optional (`User` or `IUser`)
- **Types**: PascalCase (`UserData`, `ApiResponse`)
- **Functions**: camelCase (`getUserById`, `validateInput`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`, `API_URL`)
- **Files**: kebab-case or camelCase (`user-service.ts`, `userService.ts`)

### Best Practices
- Use type guards for runtime type checking
- Leverage utility types (`Partial`, `Required`, `Pick`, `Omit`)
- Use generics for reusable components
- Document public APIs with JSDoc

## Project Structure

```
src/
├── index.ts           # Entry point
├── types/             # Type definitions
├── utils/             # Utility functions
├── services/          # Business logic
└── __tests__/         # Test files
```

## Security

- Never commit `.env` files
- Use environment variables for secrets
- Validate all external input
- Use parameterized queries for databases
