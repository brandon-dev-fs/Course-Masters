---
id: cm-0031
title: Security Review — Dockerize Development Environment
stage: review
status: approved
hand_back_to: null
approver: agent
---

# Security Review: Dockerize Development Environment

## Summary

This review covers the Docker infrastructure additions for cm-0031: client and server Dockerfiles, an nginx reverse proxy config, a docker-entrypoint.sh shell script, docker-compose.yml, .dockerignore, and supporting changes. The scope is explicitly a local development environment — not production. All findings are evaluated in that context. No blocking security issues were identified; all findings are low or info severity.

## Scope

- Branch: refactor/lesson-activities
- Base: develop
- Files changed: 9 (docker-compose.yml, client/Dockerfile, client/nginx.conf, server/Dockerfile, server/docker-entrypoint.sh, .dockerignore, .gitattributes, .env.example, server/package.json)
- Spec: cm-0031

## Issues

### [LOW] Hardcoded credentials in docker-compose.yml — sensitive-data-exposure

- **Severity**: low
- **Location**: `docker-compose.yml` (POSTGRES_PASSWORD, BETTER_AUTH_SECRET env values)
- **Category**: sensitive-data-exposure
- **Hand back to**: backend
- **Description**: The committed docker-compose.yml contains `POSTGRES_PASSWORD: changeme` and `BETTER_AUTH_SECRET: change-me-to-a-32-char-secret-key` as literal values. For a dev-only setup this is a known and intentional tradeoff — but it creates a risk that developers copy these values into real deployments, and it trains habit patterns where secrets live in committed files. The `BETTER_AUTH_SECRET` value is exactly 32 characters, meaning it technically satisfies the server's Zod length check, so the server will start without complaint even if a developer forgets to override it in a non-dev context.
- **Suggested Fix**: Replace the inline values with variable references that fall back to the insecure defaults: `POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme}`. Add a comment above each variable explicitly marking it as a dev-only default that must be changed before any shared or production use. Consider adding a `docker-compose.override.yml.example` showing how to override secrets locally without modifying the committed file.

### [LOW] Server container port 5002 directly exposed to host — api-security

- **Severity**: low
- **Location**: `docker-compose.yml` (server service, `ports: - '5002:5002'`)
- **Category**: api-security
- **Hand back to**: backend
- **Description**: The server is reachable on host port 5002 directly, bypassing the nginx proxy. This means `X-Forwarded-For` / `X-Forwarded-Proto` headers set by nginx are not present for direct connections, and any future IP-based rate limiting or trusted-proxy logic could be circumvented by calling port 5002 directly. For local dev this is intentionally documented as a debugging aid. The risk is that the pattern is copied to a staging or production compose file where a directly exposed API port would be a real exposure.
- **Suggested Fix**: Add a comment to the docker-compose.yml explaining that the port 5002 mapping is for local debugging only and should be removed or restricted in any shared environment. Binding to loopback — `ports: - '127.0.0.1:5002:5002'` — prevents LAN-level access on developer machines while preserving direct local access.

### [LOW] Server runtime stage runs as root — other

- **Severity**: low
- **Location**: `server/Dockerfile` (runtime stage, no USER directive)
- **Category**: other
- **Hand back to**: backend
- **Description**: The server Dockerfile's runtime stage uses `node:22-alpine` without a `USER` directive, so the Node process runs as root inside the container. If there is a container escape or a path traversal vulnerability in the application, the attacker has root access to the container filesystem. This is low risk for local dev; it becomes high risk if this Dockerfile is reused as-is for production.
- **Suggested Fix**: Add `USER node` to the runtime stage after copying the built artifacts. The `node:22-alpine` image ships a built-in `node` user (uid 1000). Set ownership during the build stage copy: `COPY --chown=node:node --from=builder ...`.

### [INFO] nginx config does not set security response headers — api-security

- **Severity**: info
- **Location**: `client/nginx.conf`
- **Category**: api-security
- **Hand back to**: frontend
- **Description**: The nginx config serves the SPA without `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, or `Content-Security-Policy` headers. Inconsequential for a local dev setup. These headers become important if this nginx.conf is used as the basis for an internet-facing deployment.
- **Suggested Fix**: No action required for dev. If this config is intended to serve as a production template in a future spec, add a `add_header` block in the root `server {}` block. Add a comment marking the config as dev-only and not production-hardened.

### [INFO] .dockerignore .env exclusion pattern may not cover all dotenv variants — sensitive-data-exposure

- **Severity**: info
- **Location**: `.dockerignore`
- **Category**: sensitive-data-exposure
- **Hand back to**: backend
- **Description**: The `.dockerignore` correctly excludes `**/.env` from the build context, preventing `server/.env` from being baked into images. This is the right approach. Flagging as info to confirm the pattern also covers `.env.local`, `.env.production`, and similar variants that developers may create.
- **Suggested Fix**: Verify the `.dockerignore` includes a pattern for dotenv variants, e.g. `**/.env*`, to cover `.env.local`, `.env.production`, `.env.staging`, etc. without relying solely on the exact `.env` filename match.

### [INFO] SEED_DB path requires tsx in the production runtime image — other

- **Severity**: info
- **Location**: `server/docker-entrypoint.sh` (lines 5-7), `server/package.json` (tsx moved to dependencies)
- **Category**: other
- **Hand back to**: backend
- **Description**: When `SEED_DB=true`, the entrypoint runs `node --import=tsx/esm server/prisma/seed.ts` inside the runtime image. This requires `tsx` to be present at runtime (hence the package.json change moving it to dependencies). This is not a security issue for dev. It is flagged because having a TypeScript transpiler in a production runtime image slightly increases attack surface and prevents using a minimal runtime base in the future.
- **Suggested Fix**: No action required for this spec's dev scope. For a future production hardening spec, consider compiling `seed.ts` to JS in the build stage and executing the compiled output in the entrypoint, allowing `tsx` to revert to a devDependency.

## Checklist Coverage

| Category | Result |
|---|---|
| Input validation | n/a — no application code changed |
| Injection | pass — entrypoint.sh uses `set -e`; no user-controlled values interpolated into shell commands |
| Authentication | pass — auth middleware unchanged; BETTER_AUTH_SECRET passed via env var, not baked into image |
| Authorization | n/a — no route or middleware changes |
| Sensitive data exposure | issues found (low, info) — dev credentials committed; .dockerignore pattern reviewed |
| Rate limiting | pass — rate limiting unchanged; nginx proxy does not bypass existing Express rate limiters |
| Dependency vulnerabilities | pass — only tsx promoted from devDeps to deps; no new third-party packages introduced |
| Data layer | pass — entrypoint uses `prisma migrate deploy` (official CLI, parameterized); no raw query changes |
| API security | issues found (low, info) — direct server port exposed on host; nginx missing security headers |
| CORS | pass — CORS config unchanged; CLIENT_URL env var continues to control allowed origins |

## Verdict

APPROVED — No issues at medium severity or above. All findings are low or info, scoped to dev environment tradeoffs that are explicitly in-scope per the spec. The .dockerignore correctly excludes .env files from the build context, the entrypoint uses `exec "$@"` for proper signal forwarding, and nginx correctly forwards client IP headers to the backend.
