# Coding Style (Python)

## Immutability (CRITICAL)

ALWAYS create new objects, NEVER mutate in place unless necessary for performance (e.g. strict constraints or massive datasets). Prefer `frozen=True` dataclasses or creating new dictionaries.

```python
# WRONG: Mutation
def update_user(user: dict, name: str) -> dict:
    user['name'] = name  # MUTATION!
    return user

# CORRECT: Immutability (Dicts)
def update_user(user: dict, name: str) -> dict:
    return {
        **user,
        "name": name
    }

# CORRECT: Immutability (Dataclasses)
from dataclasses import dataclass, replace

@dataclass(frozen=True)
class User:
    id: int
    name: str

def update_user_name(user: User, name: str) -> User:
    return replace(user, name=name)
```

## File Organization

MANY SMALL FILES > FEW LARGE FILES:

- High cohesion, low coupling
- 200-400 lines typical, 800 max
- Extract utilities from large modules
- Organize by feature/domain, not by technical layer (e.g. avoid a giant `utils.py` or `models.py` if splitting by specific domain makes more sense)

## Error Handling

ALWAYS handle errors comprehensively, use `logging` instead of `print`, and use separate exception types where appropriate.

```python
import logging

logger = logging.getLogger(__name__)

class OperationError(Exception):
    """Custom exception for operation failures."""
    pass

def perform_operation():
    try:
        result = risky_operation()
        return result
    except ConnectionError as e:
        logger.error(f"Connection failed: {e}", exc_info=True)
        raise OperationError("Detailed user-friendly message: Connection lost") from e
    except ValueError as e:
        logger.error(f"Invalid value encountered: {e}")
        # Handle specifically or re-raise
        raise
```

## Input Validation

ALWAYS validate user input. Use **Pydantic** for robust data validation.

```python
from pydantic import BaseModel, EmailStr, Field, ValidationError

class UserInput(BaseModel):
    email: EmailStr
    age: int = Field(..., ge=0, le=150)

# Validate raw dictionary input
try:
    validated_data = UserInput.model_validate(raw_input)
    print(validated_data.email)
except ValidationError as e:
    # Handle validation errors securely
    pass
```

## Code Quality Checklist

Before marking work complete:

- [ ] Code is readable and adheres to PEP 8 (snake_case for vars/funcs, PascalCase for classes)
- [ ] Functions are small (<50 lines)
- [ ] Files are focused (<800 lines)
- [ ] No deep nesting (>4 levels)
- [ ] Proper error handling (no bare `except:`)
- [ ] No `print` statements (use `logging`)
- [ ] No hardcoded values (use constants or environment variables)
- [ ] No mutation (immutable patterns used)
- [ ] Type hints are used throughout (`def func(a: int) -> str:`)
