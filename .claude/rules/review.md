# Review Rules

Loaded by: `code-reviewer`, `security-reviewer`.

## General

- Reviews diff `feature/<id>` against the default branch (`develop`).
- Each issue includes: `severity`, `location` (file:line), `description`, `suggested_fix`.
- Security reviews additionally include `hand_back_to: implement | design | spec` per issue.
- Auto-approve only if zero issues at severity `medium` or above.
- Severity scale defined in global `rules.md`.

## Code review checks

The code-reviewer flags violations of the project's stack-specific rules. Cross-reference `backend.md`, `frontend.md`, `data.md`, `api.md` as needed for the files in the diff.

### Always check

- **Direct error responses**: any call to `res.json({ error: ... })` or `res.status(4xx)` outside `errorHandler` middleware → `medium`.
- **Missing `asyncHandler`**: any async route handler not wrapped in `asyncHandler` → `medium`.
- **Hardcoded error codes**: any string literal used as an error code instead of the `ERROR_CODES` enum → `medium`.
- **Direct `fetch` on frontend**: any `fetch` call outside `ApiClient` → `medium`.
- **Hardcoded design values**: any hex color, arbitrary pixel value, or arbitrary font size in JSX → `low`.
- **`console.log`** in committed code → `low` (backend should use Pino; frontend should remove debug logs before commit).
- **`any` type without comment** in TypeScript → `low`.
- **Type assertions (`as`)** outside boundaries → `low`.
- **New dependencies**: any addition to `package.json` not justified in the implementation plan → `medium`.
- **Cross-feature imports** on frontend (one feature folder importing from another) → `medium`.
- **Migration drops or renames** combined with code changes in the same PR → `high` (violates expand-contract pattern in `data.md`).
- **Missing Zod validation** on a new request body, query param, or route param → `high`.
- **Test coverage**: new code without unit tests → `medium` (note: unit tests not yet bootstrapped; downgrade to `info` until project test framework is in place).

### Style and consistency

- Naming conventions per `backend.md` and `frontend.md` → `low`.
- Folder placement: code in the wrong layer (business logic in controllers, Express types in services, etc.) → `medium`.
- Commit message format `<id>: <imperative summary>` → `low`.

## Security review checks

The security-reviewer focuses on attack surface and data exposure. Each issue includes `hand_back_to` to route the rejection.

### Always check

- **Unvalidated input**: any path where user input reaches a database query, file system call, shell command, or external API without Zod validation → `critical`, `hand_back_to: implement`.
- **SQL injection**: any `$queryRaw` with string interpolation of user input → `critical`, `hand_back_to: implement`.
- **Secrets in code**: any API key, password, token, or connection string committed to the repo → `critical`, `hand_back_to: implement`.
- **Secrets in logs**: log statements that may emit tokens, passwords, full request bodies, or PII → `high`, `hand_back_to: implement`.
- **Missing auth**: any new route that handles user data without auth middleware → `critical`, `hand_back_to: design` (architectural decision) or `implement` (oversight).
- **Authorization gaps**: a route checks authentication but not authorization (e.g., user A can access user B's resource) → `high`, `hand_back_to: design`.
- **PII exposure in responses**: returning fields that should not be exposed (password hashes, internal IDs, audit fields) → `high`, `hand_back_to: implement`.
- **Stack traces in error responses**: any path where a 500 response includes the raw error message or stack → `high`, `hand_back_to: implement`.
- **CORS misconfiguration**: wildcard origins on routes that handle credentials → `high`, `hand_back_to: implement`.
- **Rate limiting**: new public-facing endpoints without rate limiting → `medium`, `hand_back_to: design`.
- **Dependency vulnerabilities**: new dependencies with known CVEs → `high`, `hand_back_to: implement`.
- **Insecure direct object references**: routes that take an ID and return a resource without verifying the caller has access → `high`, `hand_back_to: design`.

### Migration-specific

- **Destructive migration in the same PR as code change** that depends on the destruction → `high`, `hand_back_to: implement` (violates expand-contract).
- **Migration that drops or modifies a column referenced by code in `develop`** → `critical`, `hand_back_to: design`.

## Hand-back routing

The security review doc's top-level `hand_back_to` is the **earliest** stage among all issues in the doc. If any issue is `hand_back_to: design`, the doc-level value is `design`.

The user re-runs the appropriate command with the review doc as argument:

- `/design <id> .claude/reviews/<id>-security-review.md` for design-level issues
- `/implement <id> .claude/reviews/<id>-security-review.md` for implementation-level issues

The receiving command treats the review as primary input and overwrites the prior artifacts.

## What reviewers do not do

- Reviewers never edit code. They produce a review doc only.
- Reviewers never modify spec, design, or plan artifacts. Hand-back is via the review doc.
- Reviewers never approve their own past reviews; each review is independent.
