# Full Stack Project

A full-stack application with frontend, backend, and database.

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Query

### Backend
- Node.js/Express or Python/FastAPI
- TypeScript/Python
- REST API

### Database
- PostgreSQL
- Prisma ORM / SQLAlchemy

### Infrastructure
- Docker
- Docker Compose

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all services |
| `npm run dev:frontend` | Start frontend only |
| `npm run dev:backend` | Start backend only |
| `npm run build` | Build all |
| `npm test` | Run all tests |
| `docker-compose up` | Start with Docker |

## Project Structure

```
project/
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── database/
│   ├── migrations/
│   └── schema.prisma
├── docker/
│   ├── Dockerfile.frontend
│   └── Dockerfile.backend
├── docker-compose.yml
└── package.json
```

## API Design

### REST Conventions
- Use nouns for resources (`/users`, `/posts`)
- Use HTTP methods correctly (GET, POST, PUT, DELETE)
- Return appropriate status codes
- Use JSON for request/response bodies

### Authentication
- JWT tokens for API auth
- Refresh token rotation
- Secure cookie storage

## Database

### Migrations
```bash
# Create migration
npx prisma migrate dev --name add_users

# Apply migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset
```

### Best Practices
- Use migrations for schema changes
- Index frequently queried columns
- Use transactions for related operations
- Never store plaintext passwords

## Docker

```bash
# Development
docker-compose up -d

# Production build
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f
```

## Environment Variables

```bash
# Frontend (.env)
VITE_API_URL=http://localhost:3000

# Backend (.env)
DATABASE_URL=postgresql://user:pass@localhost:5432/db
JWT_SECRET=your-secret-key
```

## Security

- Use HTTPS in production
- Implement rate limiting
- Validate all inputs
- Sanitize database queries
- Keep dependencies updated
- Regular security audits
