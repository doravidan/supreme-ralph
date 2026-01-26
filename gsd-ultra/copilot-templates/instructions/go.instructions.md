---
applyTo: "**/*.go"
---

# Go Code Guidelines

## Naming
- Use mixedCaps or MixedCaps (no underscores)
- Exported names start with uppercase
- Keep names short but descriptive
- Acronyms should be all caps (HTTP, URL, ID)

```go
// Good
type HTTPClient struct {}
func (c *HTTPClient) GetUserID() string {}

// Avoid
type HttpClient struct {}
func (c *HttpClient) GetUserId() string {}
```

## Packages
- Package names are lowercase, single-word
- Avoid stuttering (http.HTTPServer -> http.Server)
- Import groups: standard library, external, internal

```go
import (
    "context"
    "fmt"

    "github.com/gorilla/mux"
    "go.uber.org/zap"

    "myapp/internal/config"
)
```

## Error Handling
- Always check errors immediately
- Return errors rather than panic
- Wrap errors with context using `fmt.Errorf`

```go
// Good
result, err := doSomething()
if err != nil {
    return nil, fmt.Errorf("failed to do something: %w", err)
}

// Avoid
result, _ := doSomething()  // Ignoring error
```

## Interfaces
- Accept interfaces, return concrete types
- Keep interfaces small (1-3 methods)
- Define interfaces where they're used, not implemented

```go
// Good - small, focused interface
type Reader interface {
    Read(p []byte) (n int, err error)
}

// Consumer defines the interface it needs
type UserService struct {
    store UserStore  // Interface
}
```

## Functions
- Return early for errors
- Use named return values sparingly
- Keep functions short and focused

## Concurrency
- Don't communicate by sharing memory; share by communicating
- Use channels for synchronization
- Start goroutines with clear ownership and cleanup

## Comments
- Write comments for exported functions (godoc style)
- Start comments with the name of the thing being described
- Don't comment obvious code
