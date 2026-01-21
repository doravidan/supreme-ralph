# React Project

A React application with TypeScript and modern tooling.

## Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State**: Zustand / React Query
- **Testing**: Vitest + React Testing Library

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm test` | Run tests |
| `npm run lint` | Run linter |
| `npm run preview` | Preview build |

## Code Style

### Component Conventions
- Use functional components with hooks
- One component per file
- PascalCase for component names
- Match filename to component name

### File Organization
```typescript
// 1. Imports (external, then internal)
import { useState } from 'react';
import { Button } from '@/components/ui';

// 2. Types
interface Props {
  title: string;
  onSubmit: () => void;
}

// 3. Component
export function MyComponent({ title, onSubmit }: Props) {
  // Hooks first
  const [state, setState] = useState('');
  
  // Handlers
  const handleClick = () => { ... };
  
  // Render
  return <div>...</div>;
}
```

### Best Practices
- Use `React.memo` for expensive renders
- Extract custom hooks for reusable logic
- Co-locate tests with components
- Use absolute imports (`@/`)

## Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   └── features/     # Feature-specific components
├── hooks/            # Custom hooks
├── lib/              # Utilities
├── pages/            # Route pages
├── services/         # API services
├── state/            # State management
└── types/            # Type definitions
```

## State Management

- **Local**: `useState`, `useReducer`
- **Shared**: Zustand store
- **Server**: React Query

## Performance

- Use `useMemo` and `useCallback` appropriately
- Implement code splitting with `React.lazy`
- Optimize images and assets
- Monitor bundle size

## Security

- Sanitize user input
- Use HTTPS
- Validate props with TypeScript
- Escape dynamic content in JSX
