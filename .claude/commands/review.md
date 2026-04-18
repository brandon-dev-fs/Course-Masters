# Review Rules

Loaded by: `code-reviewer`, `security-reviewer`.
Read `CLAUDE.md` and other scoped rules for project-specific patterns to check.

## General

- Reviews diff current branch against the default branch (`git diff <default_branch>..HEAD`).
- Each issue: `severity`, `location`, `description`, `suggested_fix`.
- Security reviews additionally include `hand_back_to` per issue.
- Auto-approve only if zero issues at severity `medium` or above.

## Scoped review (token optimization)

Code review is split by file scope to reduce context:

- **Backend files**: load `backend.md`, `data.md`, `api.md` only.
- **Frontend files**: load `frontend.md`, `api.md`, `design.md` only.
- Determine which directories are backend vs frontend from `CLAUDE.md`.

Security review runs as a single pass (security concerns cross boundaries).

## Code review checks

Check all conventions defined in the project's scoped rules files and `CLAUDE.md`. Additionally always check:

- Centralized error handling bypassed (errors formatted directly in handlers) → `medium`
- Unvalidated external input past the boundary layer → `high`
- Hardcoded values that should be config or tokens → `low`
- Debug/print logging in committed code → `low`
- Type system escape hatches without justification → `low`
- New unjustified dependencies → `medium`
- Destructive schema changes combined with code changes → `high`
- New code without tests → `info` (flip to `medium` once test framework exists)
- Code in the wrong architectural layer → `medium`

## Security review checks

- Unvalidated input reaching database/filesystem/shell → `critical`, `implement`
- Query injection (interpolated user input in queries) → `critical`, `implement`
- Secrets in code → `critical`, `implement`
- Secrets in logs → `high`, `implement`
- Missing auth on user data routes → `critical`, `design` or `implement`
- Authorization gaps (user A accesses user B's data) → `high`, `design`
- Sensitive data exposure in responses → `high`, `implement`
- Internal details in error responses (stack traces, paths) → `high`, `implement`
- Missing rate limiting on public endpoints → `medium`, `design`
- Dependency vulnerabilities → `high`, `implement`
- Insecure direct object references → `high`, `design`
- Destructive migration against shared data → `high`, `implement`

## Hand-back routing

Doc-level `hand_back_to` is the earliest stage among all issues.

<!-- 
  USER: Add project-specific review checks below.
  Examples: "flag any use of ORM X's raw query without justification",
  "flag missing JSDoc on exported functions", "flag any new API endpoint 
  without rate limiting middleware"
-->

## Project-Specific Checks
