# Python Project

A Python application following modern best practices.

## Tech Stack

- **Language**: Python 3.11+
- **Package Manager**: pip/poetry/uv
- **Testing**: pytest
- **Linting**: ruff
- **Type Checking**: mypy
- **Formatting**: black

## Commands

| Command | Description |
|---------|-------------|
| `python -m build` | Build package |
| `python -m pytest` | Run tests |
| `ruff check .` | Run linter |
| `mypy .` | Type checking |
| `black .` | Format code |

## Code Style

### Python Conventions (PEP 8)
- Use 4 spaces for indentation
- Maximum line length: 88 characters (black default)
- Use snake_case for functions and variables
- Use PascalCase for classes
- Use UPPER_SNAKE_CASE for constants

### Type Hints
- Use type hints for all function signatures
- Use `Optional[T]` for nullable values
- Use `Union[A, B]` or `A | B` for union types
- Use `TypedDict` for dictionary shapes

### Best Practices
- Use f-strings for formatting
- Prefer `pathlib.Path` over `os.path`
- Use context managers (`with` statement)
- Use dataclasses or Pydantic for data structures
- Use `logging` module, not `print`

## Project Structure

```
project/
├── src/
│   └── package_name/
│       ├── __init__.py
│       ├── main.py
│       └── utils.py
├── tests/
│   └── test_main.py
├── pyproject.toml
└── README.md
```

## Virtual Environment

```bash
# Create venv
python -m venv .venv

# Activate (Unix)
source .venv/bin/activate

# Activate (Windows)
.venv\Scripts\activate

# Install dependencies
pip install -e ".[dev]"
```

## Security

- Never commit `.env` files
- Use environment variables for secrets
- Keep dependencies updated
- Use `secrets` module for cryptographic operations
