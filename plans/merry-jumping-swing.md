# CI: Build and Test Workflow

## Context

The project has no CI pipeline. Tests exist in both `client` (Vitest + jsdom, 70% coverage threshold) and `server` (Vitest + node, 70% threshold), but nothing runs them automatically. This adds a GitHub Actions workflow that type-checks and tests both packages on every push and PR, so failing tests block merges.

---

## New File: `.github/workflows/ci.yml`

### Trigger

Runs on every push (any branch) and every pull request (any target). This gives feedback on feature branches and blocks merges via required status checks.

```yaml
on:
  push:
    branches: ["**"]
  pull_request:
    branches: ["**"]
```

### Single job: `typecheck-and-test`

Runs on `ubuntu-latest`, Node 20 (LTS — not pinned in the project, but safe for the entire stack: React 19, Vite 6, Express 5, Prisma 6).

**Steps in order:**

| # | Step | Command / Action |
|---|---|---|
| 1 | Checkout | `actions/checkout@v4` |
| 2 | Setup Node 20 + cache npm | `actions/setup-node@v4` with `node-version: '20'`, `cache: 'npm'` |
| 3 | Install all deps | `npm ci` — installs both workspace packages; `postinstall` auto-runs `prisma generate` |
| 4 | Type-check client | `npx tsc -p client/tsconfig.json --noEmit` |
| 5 | Type-check server | `npx tsc -p server/tsconfig.json --noEmit` |
| 6 | Test client (coverage) | `npm run test:coverage -w client` |
| 7 | Test server (coverage) | `npm run test:coverage -w server` |

Steps 4–5 and 6–7 could be parallelized with matrix jobs, but sequential in one job keeps it simple and avoids extra runner cost for a small project.

**Why separate type-check from test:** Vitest uses esbuild/tsx for transpilation — it does not enforce TypeScript errors. Without an explicit `tsc --noEmit` step, type errors are invisible in CI.

**Why `--noEmit` on server:** The server tsconfig outputs to `dist/`. `--noEmit` gives us the type check without writing build artifacts.

**Why no `db:generate` step:** The root `postinstall` script (`"postinstall": "npm run db:generate -w server"`) runs `prisma generate` automatically after `npm ci`. No extra step needed.

**Why no database service:** Server tests mock the Prisma singleton (`src/__tests__/mocks/prisma.ts`). No real PostgreSQL connection is made during unit tests.

### Environment variables

Server's `config.ts` validates `DATABASE_URL` and `BETTER_AUTH_SECRET` with Zod at import time. Any test file that transitively imports `config.ts` will throw without these. Provide safe dummy values at the job level:

```yaml
env:
  DATABASE_URL: postgresql://ci:ci@localhost:5432/ci_db
  BETTER_AUTH_SECRET: ci-test-secret-key-at-least-32-chars-long
  NODE_ENV: test
```

---

## Blocking Merges

The workflow failing marks the `typecheck-and-test` status check as failed. To enforce it as a required merge gate (one-time manual setup):

1. GitHub repo → **Settings → Branches → Add branch protection rule** for `main`
2. Enable **"Require status checks to pass before merging"**
3. Search for and add: `typecheck-and-test`
4. Enable **"Require branches to be up to date before merging"**

This cannot be done via the workflow file itself — it's a repo settings configuration.

---

## Critical Files

| File | Action |
|---|---|
| `.github/workflows/ci.yml` | **Create** |
| `client/package.json` | Read — confirmed `test:coverage: vitest run --coverage` |
| `server/package.json` | Read — confirmed `test:coverage: vitest run --coverage`, `db:generate: prisma generate`, postinstall hook |

---

## Verification

1. Merge the workflow file to any branch and push.
2. Confirm the `typecheck-and-test` check appears in GitHub → Actions.
3. Open a PR to `main` and verify the check runs and shows green.
4. Introduce a deliberate TypeScript error or failing test → confirm the check goes red.
5. After configuring branch protection with the required status check, confirm that the PR cannot be merged while the check is red.
