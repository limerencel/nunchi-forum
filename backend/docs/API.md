# Nunchi Forum API Documentation (Initial)

## Tech Stack
- Node.js, Fastify, TypeScript
- PostgreSQL

## API Overview
- Authentication: register, login, refresh
- Forums: CRUD on forums
- Threads/Posts: basic read/write (scaffold)

## Endpoints (v1)
- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- GET /forums
- POST /forums
- GET /forums/{id}
- PUT /forums/{id}
- DELETE /forums/{id}

## Models (DB)
- users(id, username, email, password_hash, created_at, updated_at)
- forums(id, name, slug, description, created_at, updated_at, is_public)
- threads(id, forum_id, author_id, title, content, created_at, updated_at)
- posts(id, thread_id, author_id, content, created_at, updated_at)

