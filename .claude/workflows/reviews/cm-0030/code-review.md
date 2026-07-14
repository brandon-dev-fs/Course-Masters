---
id: cm-0030
title: Add File Assignment Type with Object Storage
stage: review
status: approved
---

# Code Review — cm-0030

## Files Reviewed

<!-- Updated mechanically after each task -->

## Findings

<!-- Findings appended after each task commit -->

## Backend Track — cm-0030-backend

### Task: Add file assignment type with object storage

#### Findings

| # | Severity | Location | Description | Status |
|---|---|---|---|---|
| 1 | high | errorHandler.ts — MulterError block | LIMIT_UNEXPECTED_FILE sent raw code string as user-facing message | FIXED in commit cc56af2 |
| 2 | medium | assignment.service.ts — createFileAssignment catch | Compensating S3 delete was fire-and-forget (no await) | FIXED in commit cc56af2 |
| 3 | low | assignment.controller.ts — downloadFile | Stream error silently destroyed connection with no log entry | FIXED in commit cc56af2 |
| 4 | false-positive | assignment.service.ts | Reviewer claimed buildAssignmentInclude not updated — it was in the diff | N/A |
| 5 | false-positive | config.ts | Reviewer claimed S3 env vars missing from Zod schema — they were in the diff | N/A |
| 6 | false-positive | assignment.routes.ts | Reviewer flagged missing requireCourseOwnership on upload route — existing POST / also omits it, consistent with project pattern | N/A |
| 7 | design-decision | assignment.routes.ts | Reviewer flagged no enrollment check on download endpoint — per approved API contract | N/A |

#### Result: APPROVED (all medium+ issues resolved)

## Files Reviewed

- server/src/lib/s3.ts
- server/src/middleware/upload.ts
- server/src/middleware/errorHandler.ts
- server/src/controllers/assignment.controller.ts
- server/src/routes/assignment.routes.ts
- server/src/services/assignment.service.ts
- server/prisma/schema.prisma
- server/prisma/migrations/20260615000000_add_file_assignment_type/migration.sql
- docker-compose.yml
- scripts/garage-init.sh
- server/.env.example
- server/package.json
