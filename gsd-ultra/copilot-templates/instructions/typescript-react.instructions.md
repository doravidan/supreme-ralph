---
applyTo: "**/*.tsx"
---

# TypeScript React Guidelines

## Component Structure
- Use functional components with hooks
- One component per file (except small helper components)
- Export component as default, types as named exports

```tsx
// Good
import type { FC } from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const Button: FC<ButtonProps> = ({ label, onClick, disabled = false }) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
};

export default Button;
export type { ButtonProps };
```

## Hooks
- Follow Rules of Hooks (only call at top level)
- Use custom hooks to extract reusable logic
- Prefix custom hooks with `use`

```tsx
// Good
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
```

## Props
- Define prop interfaces explicitly
- Use destructuring in function parameters
- Provide default values for optional props

## State Management
- Use `useState` for local component state
- Use `useReducer` for complex state logic
- Lift state up when multiple components need it

## Event Handlers
- Prefix event handler props with `on` (onClick, onChange)
- Prefix handler functions with `handle` (handleClick, handleChange)

## Performance
- Memoize expensive computations with `useMemo`
- Memoize callbacks with `useCallback` when passed to children
- Use `React.memo` for components that render often with same props
