---
id: cm-0031
title: Dockerize Development Environment
stage: spec
status: approved
---

# Dockerize Development Environment

## Problem Statement

Course Masters currently requires manual setup of PostgreSQL and Node.js on each developer's machine. There is no standardized way to run the full stack in a reproducible, isolated environment. This blocks infrastructure features like object storage (cm-0030) that depend on Docker Compose for local service orchestration. Dockerizing the application ensures consistent environments across machines, simplifies onboarding, and establishes the foundation for adding containerized services in future specs.

## Scope

### In Scope

- Dockerfile for the client (multi-stage build: Node.js build stage, nginx serving stage)
- Dockerfile for the server (multi-stage build: Node.js build stage, production runtime stage)
- Docker Compose configuration orchestrating client, server, and PostgreSQL containers
- Named Docker volume for PostgreSQL data persistence across container restarts and teardowns
- Automatic Prisma migration execution on server container startup
- Optional database seeding triggered by an environment variable
- `.dockerignore` files to exclude unnecessary files from build context
- Environment variable configuration for containerized deployment
- Documentation of Docker commands in existing project files

### Out of Scope

- Hot-reload or development watch mode inside containers (production-like builds only)
- CI/CD pipeline Docker integration (may be added later as easy wins are identified)
- Object storage services such as GarageHQ (handled in cm-0030)
- Production deployment configuration (cloud providers, orchestration platforms)
- SSL/TLS termination or HTTPS configuration
- Container health checks beyond basic liveness
- Docker image publishing to a registry
- Multi-architecture image builds (ARM, x86 cross-compilation)

## Required Design Artifacts

- [x] Backend plan (`backend-plan.md`)
- [ ] API contract (`api-contract.md`)
- [ ] Frontend plan (`frontend-plan.md`)
- [ ] UI wireframe (`wireframe.md`)

## Requirements

### Functional Requirements

- FR-01: A `Dockerfile` in the `client/` directory produces a production image using a multi-stage build. The first stage installs dependencies and runs the Vite build. The second stage copies the built static assets into an nginx image that serves them.
- FR-02: A `Dockerfile` in the `server/` directory produces a production image using a multi-stage build. The first stage installs all dependencies (including dev dependencies for Prisma generation and TypeScript compilation) and builds the server. The second stage copies only the compiled output, production dependencies, and Prisma artifacts into a minimal Node.js runtime image.
- FR-03: Both Dockerfiles use the latest stable Node.js version (Node 22.x LTS) as the base image for build stages.
- FR-04: The client nginx container serves the React SPA with a fallback configuration that routes all non-file requests to `index.html` to support client-side routing.
- FR-05: The client nginx container proxies requests matching `/api` to the server container, replacing the Vite dev proxy.
- FR-06: A `docker-compose.yml` at the repository root defines three services: `client`, `server`, and `db` (PostgreSQL).
- FR-07: The PostgreSQL service uses a named Docker volume (not a bind mount) to persist database data. Stopping or removing containers with `docker-compose down` does not destroy database data. Only an explicit `docker-compose down -v` removes the volume.
- FR-08: The server container runs Prisma migrations automatically on startup before the Express server begins accepting connections. This ensures the database schema is up to date whenever a new image build is deployed.
- FR-09: The server container optionally runs the database seed script on startup when an environment variable (e.g., `SEED_DB=true`) is set. Seeding is skipped by default.
- FR-10: The `docker-compose.yml` configures environment variables for all three services. The server receives `DATABASE_URL` pointing to the `db` service hostname, `BETTER_AUTH_SECRET`, `CLIENT_URL`, and other required variables. The PostgreSQL service receives credentials via `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB`.
- FR-11: The `DATABASE_URL` in the Docker Compose configuration uses the `db` service name as the hostname (Docker networking), not `localhost`.
- FR-12: `.dockerignore` files exist for both `client/` and `server/` directories, excluding `node_modules`, `.env` files, test files, build output, and other non-essential files from the Docker build context.
- FR-13: The client container exposes port 80 (nginx) mapped to a configurable host port. The server container exposes port 5002. The PostgreSQL container exposes port 5432, optionally mapped to a host port for direct database access during development.
- FR-14: Running `docker-compose up --build` from the repository root builds all images and starts the full stack with no manual steps beyond having Docker installed.
- FR-15: A server startup script (entrypoint or command) orchestrates the migration, optional seeding, and server start sequence, ensuring migrations complete before the server process starts.

### Non-Functional Requirements

- NFR-01: Docker image sizes must be minimized through multi-stage builds. Final images must not contain build tooling, dev dependencies, or source TypeScript files.
- NFR-02: Docker build steps must be ordered to maximize layer caching. Dependency installation (package.json and lockfile copy) must precede source code copy so that source changes do not invalidate the dependency cache layer.
- NFR-03: The PostgreSQL named volume must survive `docker-compose down` (without `-v` flag) and `docker-compose stop` so developers do not lose seeded or manually created data during normal development cycles.
- NFR-04: The server container must not start accepting HTTP requests until Prisma migrations have completed successfully. If migrations fail, the container must exit with a non-zero status code.
- NFR-05: No secrets (passwords, auth secrets, database credentials) may be hardcoded in Dockerfiles or committed to version control. All secrets must be supplied via environment variables or a `.env` file excluded by `.gitignore`.
- NFR-06: The nginx configuration must set appropriate cache headers for static assets (hashed filenames from Vite get long-lived cache, `index.html` gets no-cache).

## Systems-Level Architecture

### Components Involved

**New files:**

- `client/Dockerfile` -- multi-stage build for the React SPA (Node.js build, nginx serve)
- `client/.dockerignore` -- excludes node_modules, tests, build artifacts from build context
- `client/nginx.conf` -- nginx configuration for SPA routing and API reverse proxy
- `server/Dockerfile` -- multi-stage build for the Express API (Node.js build, Node.js runtime)
- `server/.dockerignore` -- excludes node_modules, tests, .env from build context
- `server/docker-entrypoint.sh` -- startup script that runs migrations, optional seed, then starts the server
- `docker-compose.yml` -- orchestrates client, server, and PostgreSQL services

**Modified files:**

- `.env.example` -- updated with Docker-specific variable documentation and defaults
- `.gitignore` -- ensure Docker-related generated files are not committed if applicable

### Data Model Changes

None. This spec introduces no changes to the Prisma schema, database models, or migrations. The existing schema and migrations are applied automatically by the server container on startup.

### API Changes

None. No new or modified endpoints. The Express API runs identically inside or outside of Docker.

### Data Flow

1. Developer runs `docker-compose up --build` from the repository root.
2. Docker Compose builds three images in parallel: client (Vite build into nginx), server (TypeScript compile into Node.js), and pulls the PostgreSQL image.
3. Docker Compose starts the `db` service first. PostgreSQL initializes using the named volume for data storage.
4. The `server` container starts after `db` is healthy. The entrypoint script runs `prisma migrate deploy` against the database. If `SEED_DB=true`, it then runs the seed script. Finally, it starts the Express server on port 5002.
5. The `client` container starts and nginx begins serving the built React SPA on port 80. Requests to `/api/*` are reverse-proxied to the `server` container on port 5002.
6. The developer accesses the application at `http://localhost:<host-port>` in their browser. All client-side routes are handled by nginx's SPA fallback. API requests flow through nginx to the Express server, which queries PostgreSQL via Prisma.
7. On `docker-compose down`, containers stop but the named PostgreSQL volume persists. On next `docker-compose up`, the database retains all previous data.

### Integration Points

- **Prisma CLI**: The server Dockerfile must include the Prisma CLI and generated client. The entrypoint uses `npx prisma migrate deploy` (production migration command, not `migrate dev`) to apply pending migrations.
- **npm workspaces**: The monorepo uses npm workspaces. Each Dockerfile builds its respective package independently, copying only the relevant workspace files and the root `package.json` / lockfile.
- **Environment variables**: The server's Zod-validated config (`server/src/config.ts`) expects `DATABASE_URL` and `BETTER_AUTH_SECRET` at minimum. Docker Compose must supply these. The `CLIENT_URL` variable must point to the client container's externally accessible URL for CORS configuration.
- **Vite build output**: The client Dockerfile depends on Vite producing static files in `client/dist/`. The nginx stage copies from this path.
- **Express trust proxy**: The server already sets `trust proxy` to 1 in `app.ts`, which is required when running behind nginx for correct IP resolution and secure cookie handling.
