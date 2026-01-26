---
applyTo: "**/*.py"
---

# Python Code Guidelines

## Style
- Follow PEP 8 style guide
- Use 4 spaces for indentation
- Maximum line length: 88 characters (Black default)
- Use snake_case for functions and variables
- Use PascalCase for classes

## Type Hints
- Use type hints for function signatures
- Use `typing` module for complex types
- Use `Optional` for nullable parameters

```python
# Good
from typing import Optional, List, Dict

def process_items(
    items: List[str],
    config: Optional[Dict[str, any]] = None
) -> List[str]:
    """Process a list of items with optional configuration."""
    if config is None:
        config = {}
    return [item.upper() for item in items]

# Avoid
def process_items(items, config=None):
    return [item.upper() for item in items]
```

## Imports
- Group imports: standard library, third-party, local
- Use absolute imports
- Avoid wildcard imports

```python
# Good
import os
from pathlib import Path

import requests
from pydantic import BaseModel

from myapp.utils import helper
from myapp.models import User

# Avoid
from myapp.utils import *
```

## Functions
- Use docstrings for public functions (Google style)
- Use early returns
- Keep functions focused (single responsibility)

```python
def fetch_user(user_id: str) -> Optional[User]:
    """Fetch a user by ID.

    Args:
        user_id: The unique identifier of the user.

    Returns:
        The User object if found, None otherwise.

    Raises:
        ValueError: If user_id is empty.
    """
    if not user_id:
        raise ValueError("user_id cannot be empty")

    return User.get(user_id)
```

## Error Handling
- Use specific exception types
- Don't catch bare `Exception` unless re-raising
- Provide context in error messages

## Classes
- Use dataclasses or Pydantic for data structures
- Use `@property` for computed attributes
- Keep classes focused and small
