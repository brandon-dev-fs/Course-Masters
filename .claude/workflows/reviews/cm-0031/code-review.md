---
id: cm-0031
title: Code Review — Dockerize Development Environment
stage: review
status: approved
approver: agent
---

# Code Review: cm-0031

## Summary

Docker infrastructure additions for cm-0031: client and server Dockerfiles, nginx reverse proxy config, docker-entrypoint.sh, docker-compose.yml, .dockerignore, .gitattributes, and supporting changes to server/package.json and .env.example. No application code changed. All findings are low or info severity.

## Scope

- Branch: cm-0031-backend
- Base: refactor/lesson-activities
- Commits: 3 (cm-0031: add Docker infrastructure files, cm-0031: move tsx to production dependencies for Docker seed support, cm-0031: fix CLIENT_URL in .env.example and add Docker docs)
- Files changed: .dockerignore, .env.example, .gitattributes, client/Dockerfile, client/nginx.conf, docker-compose.yml, server/Dockerfile, server/docker-entrypoint.sh, server/package.json, package-lock.json

## Issues

### [LOW] client service has no health check dependency on server — docker-compose.yml

- **Severity**: low
- **Location**: `docker-compose.yml` (client.depends_on)
- **Description**: `client` depends on `server` with start-order only. nginx will start immediately and return 502 until the server finishes migrations. Not harmful but can be confusing during first `docker-compose up`.
- **Suggested Fix**: Add a health check on the server service (`wget -qO- http://localhost:5002/health || exit 1`) and use `condition: service_healthy` for the client dependency. Advisory for dev.

### [LOW] NODE_ENV: production in dev docker-compose — docker-compose.yml

- **Severity**: low
- **Location**: `docker-compose.yml` (server.environment.NODE_ENV)
- **Description**: `NODE_ENV: production` means dev-mode behaviors (verbose errors, pino pretty-print) are disabled. Intentional since containers run compiled dist output, not tsx watch mode, but could surprise developers expecting dev behaviors.
- **Suggested Fix**: Add a comment explaining `production` is intentional (compiled dist, not tsx watch). Consider a `docker-compose.override.yml` pattern for dev vs prod differentiation.

### [INFO] Commented-out EXPOSE in client/Dockerfile — client/Dockerfile:31

- **Severity**: info
- **Location**: `client/Dockerfile` line 31
- **Description**: `# EXPOSE 80` comment artifact immediately before the active `EXPOSE 80`.
- **Suggested Fix**: Remove the commented-out line.

### [INFO] Prisma CLI copy path should be commented — server/Dockerfile

- **Severity**: info
- **Location**: `server/Dockerfile` runtime stage
- **Description**: `COPY --from=builder /app/node_modules/prisma` is required because `prisma` is a devDependency not installed by `--omit=dev`. If this copy is removed, the failure is silent until runtime.
- **Suggested Fix**: Add comment: `# prisma is a devDep — copy from builder so migrate deploy works at runtime without reinstalling dev deps`.

### [INFO] nginx:alpine not pinned to minor version — client/Dockerfile

- **Severity**: info
- **Location**: `client/Dockerfile:21`
- **Description**: `FROM nginx:alpine` floats to latest nginx alpine. Breaking nginx config changes could silently affect the container on next pull.
- **Suggested Fix**: Pin to `nginx:1.27-alpine` or similar for reproducible builds.

## Verdict

**Status: APPROVED**

Zero issues at medium or above. Multi-stage builds are correct, `.dockerignore` is comprehensive, `--ignore-scripts` / explicit `prisma generate` sequencing is sound, `.gitattributes` LF enforcement for shell scripts correctly prevents CRLF issues on Windows.

## Files Reviewed

- `.dockerignore`
- `.env.example`
- `.gitattributes`
- `client/Dockerfile`
- `client/nginx.conf`
- `docker-compose.yml`
- `server/Dockerfile`
- `server/docker-entrypoint.sh`
- `server/package.json`
- `package-lock.json`
