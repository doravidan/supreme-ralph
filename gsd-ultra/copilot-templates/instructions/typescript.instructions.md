---
applyTo: "**/*.ts"
---

# TypeScript Code Guidelines

## Type Safety
- Enable strict mode in tsconfig.json
- Avoid `any` type - use `unknown` for truly unknown types
- Use explicit return types for public functions
- Prefer interfaces over type aliases for object shapes

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  // ...
}

// Avoid
function getUser(id: any): any {
  // ...
}
```

## Module System
- Use ES6 modules exclusively
- Import types with `import type` when only types are needed
- Use path aliases for cleaner imports

```typescript
// Good
import type { Config } from './types';
import { processData } from '@/utils/processor';

// Avoid
import { Config } from './types'; // When only type is needed
```

## Generics
- Use generics for reusable, type-safe code
- Provide meaningful generic names (T, K, V for simple cases; more descriptive for complex)

```typescript
// Good
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  // ...
}
```

## Null Handling
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Prefer `undefined` over `null` for optional values
- Use strict null checks

## Enums
- Prefer const enums or string literal unions over regular enums
- Use PascalCase for enum names and values

```typescript
// Preferred
type Status = 'pending' | 'active' | 'completed';

// Or
const Status = {
  Pending: 'pending',
  Active: 'active',
  Completed: 'completed'
} as const;
```
