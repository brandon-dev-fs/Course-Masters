---
id: cm-0031
title: Dockerize Development Environment — Backend Plan
stage: design
status: approve
---

# Dockerize Development Environment — Backend Plan

## Overview

This plan creates the Docker infrastructure to run the full Course Masters stack (client, server, PostgreSQL) in containers with a single `docker-compose up --build` command. No API routes, no Prisma schema changes. All artifacts are new infrastructure files (Dockerfiles, nginx config, compose file, entrypoint script, dockerignore) plus two minor modifications to existing files.

## Schema Changes

No schema changes. No new models, fields, enums, or migrations.

## Files to Create

### 1. `client/Dockerfile`

Multi-stage build: Node.js build stage produces static assets, nginx stage serves them.

```dockerfile
# Stage 1: Build the React SPA
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace manifests for npm workspace resolution
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install client dependencies only
RUN npm ci --workspace=client

# Copy source files needed for the build
COPY tsconfig.base.json ./
COPY client/ ./client/

# Build the client
RUN npm run build --workspace=client

# Stage 2: Serve with nginx
FROM nginx:alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static assets from builder
COPY --from=builder /app/client/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Key decisions:**

- `server/package.json` is copied even though we only build the client because npm workspaces requires all workspace manifests to be present for `npm ci` to resolve the dependency tree.
- The `postinstall` script in root `package.json` runs `prisma generate` (server workspace). This will fail in the client builder stage because `prisma` is a devDependency of the server and is not installed by `--workspace=client`. To handle this, the `npm ci --workspace=client` command only installs client workspace dependencies, which means the root `postinstall` does NOT run (workspace-scoped `npm ci` skips root lifecycle scripts). No workaround is needed.
- Actually, `npm ci --workspace=client` DOES run root lifecycle scripts in npm 10+. We need to skip the postinstall. Use `npm ci --workspace=client --ignore-scripts` followed by a separate step if needed. However, the client has no postinstall of its own, so `--ignore-scripts` is safe.

**Revised install step:**

```dockerfile
RUN npm ci --workspace=client --ignore-scripts
```

This avoids the root `postinstall` (`prisma generate`) which would fail without the server's dependencies installed.

**Final file content:**

```dockerfile
# Stage 1: Build the React SPA
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace manifests for npm workspace resolution
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install client dependencies (skip root postinstall which runs prisma generate)
RUN npm ci --workspace=client --ignore-scripts

# Copy source files needed for the build
COPY tsconfig.base.json ./
COPY client/ ./client/

# Build the client
RUN npm run build --workspace=client

# Stage 2: Serve with nginx
FROM nginx:alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static assets from builder
COPY --from=builder /app/client/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

### 2. `client/nginx.conf`

Nginx configuration for SPA routing and API reverse proxy.

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # API reverse proxy — replaces Vite dev proxy in Docker
    location /api/ {
        proxy_pass http://server:5002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Hashed static assets (Vite adds content hashes to filenames)
    # These are safe to cache indefinitely
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    # SPA fallback — all non-file requests serve index.html
    location / {
        # index.html must never be cached (it references hashed assets)
        add_header Cache-Control "no-cache";
        try_files $uri $uri/ /index.html;
    }
}
```

**Key decisions:**

- `proxy_pass http://server:5002` uses the Docker Compose service name `server` as the hostname. Docker's internal DNS resolves this to the server container's IP.
- The `/api/` location block includes a trailing slash on both the `location` and `proxy_pass` to ensure correct path forwarding without stripping.
- Vite places all hashed assets under `/assets/` by default, so the cache rule targets that path specifically.
- `index.html` gets `no-cache` to ensure browsers always fetch the latest version, which in turn references the current hashed asset filenames.

---

### 3. `server/Dockerfile`

Multi-stage build: full dependencies for build, production-only dependencies for runtime.

```dockerfile
# Stage 1: Build the server
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace manifests for npm workspace resolution
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install all dependencies (dev deps needed for prisma generate + tsc)
# Skip root postinstall — we run prisma generate manually after copying schema
RUN npm ci --workspace=server --ignore-scripts

# Copy source files
COPY tsconfig.base.json ./
COPY server/ ./server/

# Generate Prisma client (needs schema.prisma)
RUN npx prisma generate --schema=./server/prisma/schema.prisma

# Compile TypeScript
RUN npm run build --workspace=server

# Stage 2: Production runtime
FROM node:22-alpine AS runtime

WORKDIR /app

# Copy root workspace manifests
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install production dependencies only
# Skip root postinstall — prisma client is copied from builder
RUN npm ci --workspace=server --omit=dev --ignore-scripts

# Copy compiled server output from builder
COPY --from=builder /app/server/dist ./server/dist

# Copy Prisma generated client from builder (platform-specific query engine)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy Prisma schema and migrations (needed for prisma migrate deploy)
COPY --from=builder /app/server/prisma ./server/prisma

# Copy seed script source (needed when SEED_DB=true)
# tsx is a production dependency so it can execute the seed TypeScript directly
COPY --from=builder /app/server/prisma/seed.ts ./server/prisma/seed.ts

# Copy entrypoint script
COPY server/docker-entrypoint.sh ./server/docker-entrypoint.sh
RUN chmod +x ./server/docker-entrypoint.sh

EXPOSE 5002

ENTRYPOINT ["./server/docker-entrypoint.sh"]
CMD ["node", "server/dist/index.js"]
```

**Key decisions:**

- `client/package.json` must be copied in both stages because npm workspaces requires all workspace manifests present, even when installing only the server workspace.
- `--ignore-scripts` prevents the root `postinstall` from running `prisma generate` prematurely (before the schema file is copied). We run `prisma generate` explicitly after copying the schema.
- The Prisma generated client lives in `node_modules/.prisma` and `node_modules/@prisma`. Both must be copied to the runtime stage because the generated client imports from `@prisma/client` which references the query engine binary in `.prisma`.
- The seed script (`server/prisma/seed.ts`) is already copied via the `COPY --from=builder /app/server/prisma ./server/prisma` line. The explicit seed.ts copy line above is redundant but included for clarity — it can be removed.
- `tsx` must be a production dependency (see Files to Modify section) so the seed script can execute at runtime when `SEED_DB=true`.

---

### 4. `server/docker-entrypoint.sh`

Shell script that runs migrations, optionally seeds, then starts the server.

```sh
#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy --schema=./server/prisma/schema.prisma

if [ "${SEED_DB}" = "true" ]; then
  echo "Seeding database..."
  node --import=tsx/esm server/prisma/seed.ts
fi

echo "Starting server..."
exec "$@"
```

**Key decisions:**

- `set -e` ensures the container exits with a non-zero code if migrations fail (FR-15, NFR-04).
- `prisma migrate deploy` is the production migration command. It applies pending migrations without generating new ones (unlike `prisma migrate dev`).
- The `--schema` flag points to the schema location in the container filesystem.
- `exec "$@"` replaces the shell process with the `CMD` argument (`node server/dist/index.js`), ensuring the Node process receives signals (SIGTERM, SIGINT) directly for graceful shutdown.
- The seed command matches the project convention: `node --import=tsx/esm server/prisma/seed.ts`. It does NOT use `--env-file=.env` because in Docker, environment variables are injected by Compose directly into the process environment — no `.env` file is needed.

---

### 5. `docker-compose.yml`

Root-level Compose file orchestrating all three services.

```yaml
services:
    db:
        image: postgres:17-alpine
        environment:
            POSTGRES_USER: coursemasters
            POSTGRES_PASSWORD: changeme
            POSTGRES_DB: coursemasters
        ports:
            - '5432:5432'
        volumes:
            - postgres_data:/var/lib/postgresql/data
        healthcheck:
            test: ['CMD-SHELL', 'pg_isready -U coursemasters']
            interval: 5s
            timeout: 5s
            retries: 5

    server:
        build:
            context: .
            dockerfile: server/Dockerfile
        depends_on:
            db:
                condition: service_healthy
        environment:
            DATABASE_URL: postgresql://coursemasters:changeme@db:5432/coursemasters
            BETTER_AUTH_SECRET: change-me-to-a-32-char-secret-key
            SERVER_PORT: '5002'
            NODE_ENV: production
            CLIENT_URL: http://localhost:5000
            LOG_LEVEL: info
            SEED_DB: 'false'
        ports:
            - '5002:5002'

    client:
        build:
            context: .
            dockerfile: client/Dockerfile
        depends_on:
            - server
        ports:
            - '5000:80'

volumes:
    postgres_data:
```

**Key decisions:**

- Build context is `.` (repo root) for both client and server because npm workspaces require the root `package.json` and `package-lock.json`. The `dockerfile` field points to the workspace-specific Dockerfile.
- `db` uses `service_healthy` condition so the server waits for PostgreSQL to be ready before starting migrations.
- `client` depends on `server` but without a health condition — nginx starts quickly and will proxy to the server once it's up. If the server is still starting, nginx returns 502 which is acceptable during startup.
- `DATABASE_URL` uses `db` as the hostname (Docker internal DNS), not `localhost`.
- `BETTER_AUTH_SECRET` is set to a placeholder. For real usage, users should override this via a `.env` file or environment variable. The value here is 34 characters (meets the 32-char minimum).
- `CLIENT_URL` is `http://localhost:5000` — this is the externally accessible URL the browser uses, which is what CORS needs to allow. It is NOT the Docker internal hostname.
- Port `5432` is exposed to the host so developers can connect to the database directly with tools like Prisma Studio or pgAdmin during development.
- The named volume `postgres_data` persists across `docker-compose down` but is removed with `docker-compose down -v`.

**NFR-05 compliance (no hardcoded secrets):** The `BETTER_AUTH_SECRET` and `POSTGRES_PASSWORD` values in the Compose file are development defaults, not production secrets. The Compose file is committed to version control intentionally — it is the development environment definition. Production deployments would use a separate Compose file or override mechanism. This is standard practice for development Docker Compose files.

---

### 6. `.dockerignore`

Root-level file to reduce build context size and prevent leaking sensitive files.

```
# Dependencies (rebuilt inside container)
**/node_modules

# Build output (rebuilt inside container)
**/dist

# Environment files (secrets — never bake into images)
**/.env
**/.env.local
**/.env.production

# Test files (not needed in production images)
**/coverage
**/__tests__
**/*.test.ts
**/*.spec.ts
**/vitest.config.ts
**/vitest.setup.ts

# Git
.git
.gitignore

# Claude Code workflow artifacts
.claude
worktrees
plans

# IDE
.vscode
.idea

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
```

**Key decisions:**

- `.dockerignore` is placed at the repo root because both Dockerfiles use the repo root as build context (required for npm workspace resolution).
- `**/*.md` is NOT excluded because some `.md` files might be needed (though currently none are). Being conservative avoids surprises.
- `server/prisma/` is NOT excluded — it contains the schema and migrations needed for the server build.
- `**/.env` prevents any `.env` files from being copied into the build context, ensuring secrets are never baked into images.
- `__tests__` and test config files are excluded to reduce image size.

---

## Files to Modify

### 7. `server/package.json` — Move `tsx` to production dependencies

**Why:** The Docker entrypoint runs `node --import=tsx/esm server/prisma/seed.ts` when `SEED_DB=true`. The runtime stage installs only production dependencies (`--omit=dev`), so `tsx` must be a production dependency.

**Change:**

Remove from `devDependencies`:

```json
"tsx": "^4.19.3",
```

Add to `dependencies`:

```json
"tsx": "^4.19.3",
```

The resulting `dependencies` section:

```json
"dependencies": {
  "@prisma/client": "^6.5.0",
  "better-auth": "^1.5.5",
  "cors": "^2.8.5",
  "express": "^5.1.0",
  "express-rate-limit": "^8.3.1",
  "pino": "^10.3.1",
  "pino-http": "^11.0.0",
  "swagger-ui-express": "^5.0.1",
  "tsx": "^4.19.3",
  "zod": "^3.24.2"
}
```

And the resulting `devDependencies` section (without `tsx`):

```json
"devDependencies": {
  "@types/cors": "^2.8.17",
  "@types/express": "^5.0.1",
  "@types/node": "^22.13.10",
  "@types/swagger-ui-express": "^4.1.8",
  "@vitest/coverage-v8": "^4.1.6",
  "prisma": "^6.5.0",
  "typescript": "^5.8.2",
  "vitest": "^4.1.6"
}
```

**Note:** `tsx` is already used in the `dev` script (`tsx watch --env-file=.env src/index.ts`) and the `db:seed` script. Moving it to `dependencies` has no effect on local development — it remains available in both contexts.

---

### 8. `.env.example` — Fix CLIENT_URL and add Docker documentation

**Current content:**

```
DATABASE_URL=postgresql://coursemasters:changeme@localhost:5432/coursemasters
SERVER_PORT=5002
NODE_ENV=development
BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters-long
CLIENT_URL=http://localhost:5001
```

**New content:**

```
# ============================================================================
# Course Masters — Environment Variables
# ============================================================================
# Copy this file to server/.env and fill in the values.
#
# Local development (no Docker):
#   DATABASE_URL uses localhost
#   CLIENT_URL matches Vite dev server port (5000)
#
# Docker development (docker-compose up):
#   Variables are set in docker-compose.yml — no .env file needed.
#   DATABASE_URL uses "db" hostname (Docker internal DNS).
#   CLIENT_URL is http://localhost:5000 (host-mapped port).
# ============================================================================

DATABASE_URL=postgresql://coursemasters:changeme@localhost:5432/coursemasters
SERVER_PORT=5002
NODE_ENV=development
BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters-long
CLIENT_URL=http://localhost:5000
```

**Changes:**

- Fixed `CLIENT_URL` from `http://localhost:5001` to `http://localhost:5000` (matches Vite dev port and CLAUDE.md documentation).
- Added comment block explaining the difference between local and Docker environment variable configuration.

---

## Error Handling

Not applicable. This plan creates infrastructure files, not application code. Error handling for the Docker setup is covered by:

- `set -e` in `docker-entrypoint.sh` — exits on migration failure.
- Docker Compose `healthcheck` on the `db` service — server waits for a healthy database.
- `depends_on` with `condition: service_healthy` — prevents premature startup.

## Validation

Not applicable. No API routes or request validation changes.

## Implementation Notes

### Ordering

1. Create `.dockerignore` first (used by all Docker builds).
2. Create `client/nginx.conf` (referenced by `client/Dockerfile`).
3. Create `client/Dockerfile`.
4. Create `server/docker-entrypoint.sh` (referenced by `server/Dockerfile`).
5. Create `server/Dockerfile`.
6. Modify `server/package.json` (move `tsx` to dependencies).
7. Create `docker-compose.yml`.
8. Update `.env.example`.
9. Run `npm install` at the repo root to update `package-lock.json` after the `tsx` dependency move.

### Gotchas

1. **npm workspace `--ignore-scripts`**: Both Dockerfiles must use `--ignore-scripts` during `npm ci` to prevent the root `postinstall` (`prisma generate`) from running before the schema file is available. The server Dockerfile runs `prisma generate` explicitly after copying the schema.

2. **Prisma query engine platform**: `prisma generate` inside the Alpine-based builder stage produces a Linux-musl query engine binary. This binary is copied to the runtime stage. Both stages must use the same base image family (`node:22-alpine`) to ensure binary compatibility.

3. **No `--env-file` in Docker**: The seed command in `docker-entrypoint.sh` omits `--env-file=.env` (unlike the local `db:seed` script). Docker Compose injects environment variables directly into the process, so `.env` file loading is unnecessary and would fail (no `.env` file exists in the container).

4. **Seed script `prisma` dependency**: The seed script (`seed.ts`) imports from `@prisma/client`, which is a production dependency. It also uses `tsx` for TypeScript execution. Both are available in the runtime stage after the changes in this plan.

5. **Port mapping**: The client maps host port 5000 to container port 80 (nginx). The server maps host port 5002 to container port 5002. These match the project's existing port conventions so bookmarks and muscle memory work unchanged.

6. **CORS configuration**: `CLIENT_URL` in docker-compose.yml is `http://localhost:5000`, which is the URL the browser uses. Even though nginx proxies API requests internally, the browser's `Origin` header will be `http://localhost:5000`, so CORS must allow this origin.

7. **`prisma` CLI in runtime stage**: `npx prisma migrate deploy` in the entrypoint needs the `prisma` CLI package. Currently `prisma` is a devDependency of the server. However, `npx` will find and execute it from the builder's cached npm store, or download it on the fly. To avoid a runtime download, we should verify that `npx prisma` works in the runtime stage. If not, `prisma` may also need to move to production dependencies. **Resolution:** The `prisma` CLI is needed at runtime for `migrate deploy`. It should be copied from the builder stage or moved to dependencies. The safest approach is to copy the `prisma` binary from the builder:

    Add this line to the server Dockerfile runtime stage, after copying `node_modules/.prisma`:

    ```dockerfile
    COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
    COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
    ```

    This avoids moving `prisma` to production dependencies (which would increase the local `node_modules` size for no benefit) while ensuring the CLI is available in the container.

    **Updated server Dockerfile runtime stage** (add after the `@prisma` copy line):

    ```dockerfile
    # Copy Prisma CLI from builder (needed for migrate deploy in entrypoint)
    COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
    ```

### Verification Steps

After implementation, verify the setup works:

1. **Build images**: `docker-compose build` — all three images build without errors.
2. **Start stack**: `docker-compose up` — all services start, server logs show "Running database migrations..." then "Starting server...".
3. **Access client**: Open `http://localhost:5000` in a browser — the React SPA loads.
4. **API proxy**: The SPA can reach the API (login page works, or hit `http://localhost:5000/api/health` directly).
5. **Direct API**: `curl http://localhost:5002/api/health` returns a health check response.
6. **Database persistence**: `docker-compose down` then `docker-compose up` — data persists. `docker-compose down -v` destroys the volume.
7. **Seeding**: `docker-compose up` with `SEED_DB=true` set on the server service — seed data appears in the database.
8. **Direct DB access**: Connect to `localhost:5432` with `coursemasters/changeme` credentials using any PostgreSQL client.

### Final Server Dockerfile (consolidated)

For clarity, here is the complete server Dockerfile with the Prisma CLI copy fix applied:

```dockerfile
# Stage 1: Build the server
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace manifests for npm workspace resolution
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install all dependencies (dev deps needed for prisma generate + tsc)
# Skip root postinstall — we run prisma generate manually after copying schema
RUN npm ci --workspace=server --ignore-scripts

# Copy source files
COPY tsconfig.base.json ./
COPY server/ ./server/

# Generate Prisma client (needs schema.prisma)
RUN npx prisma generate --schema=./server/prisma/schema.prisma

# Compile TypeScript
RUN npm run build --workspace=server

# Stage 2: Production runtime
FROM node:22-alpine AS runtime

WORKDIR /app

# Copy root workspace manifests
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install production dependencies only
RUN npm ci --workspace=server --omit=dev --ignore-scripts

# Copy compiled server output from builder
COPY --from=builder /app/server/dist ./server/dist

# Copy Prisma generated client from builder (platform-specific query engine)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy Prisma CLI from builder (needed for migrate deploy in entrypoint)
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Copy Prisma schema and migrations (needed for prisma migrate deploy)
COPY --from=builder /app/server/prisma ./server/prisma

# Copy entrypoint script
COPY server/docker-entrypoint.sh ./server/docker-entrypoint.sh
RUN chmod +x ./server/docker-entrypoint.sh

EXPOSE 5002

ENTRYPOINT ["./server/docker-entrypoint.sh"]
CMD ["node", "server/dist/index.js"]
```
