---
id: cm-0018
title: Add Soft Delete to Core Models
stage: spec
status: approved
approver: human
approved_at: 2026-05-13T00:00:00Z
---

# Add Soft Delete to Core Models

## Problem Statement

The application currently performs hard deletes on core entities (User, Course, Unit, Lesson, Assessment), permanently removing data from the database. This makes it impossible to audit what was deleted, when, or by whom. Replacing hard deletes with soft deletes preserves deleted records for audit purposes while hiding them from normal application queries.

## Scope

### In Scope

- Adding a `deletedAt` timestamp field to: User, Course, Unit, Lesson, and Assessment models
- Replacing all existing hard-delete endpoints for these models with soft-delete behavior (setting `deletedAt` instead of destroying the row)
- Cascading soft deletes down the ownership hierarchy: User -> Course -> Unit -> Lesson -> Assessment
- Filtering out soft-deleted records from all read queries (lists, detail fetches, and relationship includes)
- Updating authorization and ownership checks to treat soft-deleted records as non-existent

### Out of Scope

- **Assignment model soft delete**: The application has no `Assignment` model. If an Assignment model is introduced in the future, soft delete should be added at that time.
- **Restore/undelete functionality**: Soft delete is permanent and audit-only. No undelete endpoint or capability will be built.
- **Admin UI for viewing soft-deleted records**: This is a backend-only change. No admin interface changes are included.
- **Purge/hard-delete endpoint**: No endpoint to permanently remove soft-deleted records will be provided.
- **Soft delete on completion and attempt models**: LessonCompletion, UnitCompletion, and AssessmentAttempt are preserved as-is with no soft-delete behavior. These records remain even if their parent entity is soft-deleted.
- **Soft delete on lesson content models**: LessonResource, LessonTool, and StudentNote are not in scope. Their parent Lesson's existing cascade-delete behavior from the database foreign key remains unchanged for now; when a Lesson is soft-deleted (not hard-deleted), these child rows simply become orphaned from visible queries but remain in the database.

## Requirements

### Functional Requirements

- FR-01: The User, Course, Unit, Lesson, and Assessment models each gain a nullable `deletedAt` datetime field, defaulting to null (not deleted).
- FR-02: The DELETE endpoint for Course (`DELETE /courses/:courseId`) sets `deletedAt` to the current timestamp on the target Course and cascades soft delete to all of that Course's Units, Lessons, and Assessments.
- FR-03: The DELETE endpoint for Unit (`DELETE /courses/:courseId/units/:unitId`) sets `deletedAt` on the target Unit and cascades soft delete to all of that Unit's Lessons and Assessments.
- FR-04: The DELETE endpoint for Lesson (`DELETE /units/:unitId/lessons/:lessonId`) sets `deletedAt` on the target Lesson and cascades soft delete to the Lesson's Assessment (if any).
- FR-05: The DELETE endpoint for Assessment (`PUT /assessments/:assessmentId` is unaffected; the assessment-level delete is handled through its parent Lesson or Unit or Course cascade) — if a standalone assessment delete endpoint exists, it sets `deletedAt` on that Assessment only.
- FR-06: Soft-deleting a User (through the admin user management flow or the `DELETE` user endpoint if one exists) sets `deletedAt` on the User and cascades soft delete to all of that User's Courses, and transitively to their Units, Lessons, and Assessments.
- FR-07: All GET list endpoints for Course, Unit, Lesson, and Assessment exclude records where `deletedAt` is not null.
- FR-08: All GET detail endpoints for Course, Unit, Lesson, and Assessment return 404 if the requested record has a non-null `deletedAt`.
- FR-09: All PUT/update endpoints for Course, Unit, Lesson, and Assessment return 404 if the target record has a non-null `deletedAt`, preventing edits to soft-deleted records.
- FR-10: Relationship includes and nested queries (e.g., fetching a Course's Units) exclude soft-deleted child records.
- FR-11: Progress and completion endpoints treat soft-deleted Lessons and Units as non-existent when calculating progress totals and percentages.
- FR-12: Assessment attempt creation (`POST /assessments/:assessmentId/attempts`) returns 404 if the Assessment is soft-deleted.
- FR-13: The cascade soft delete is performed in a single database transaction per delete request to ensure atomicity.

### Non-Functional Requirements

- NFR-01: Cascade soft-delete operations (e.g., deleting a User with many Courses) must complete within 5 seconds under normal load.
- NFR-02: Adding the `deletedAt` column must not degrade query performance on list endpoints. An index on `deletedAt` (or a partial index on non-null values) should be considered in the backend plan.
- NFR-03: The migration adding `deletedAt` fields must be non-destructive and backward-compatible — no existing data is lost or altered.

## Systems-Level Architecture

### Components Involved

**Existing components modified:**

- Prisma schema: User, Course, Unit, Lesson, and Assessment model definitions
- Express routers: course router, unit router, lesson router, assessment router, and (if applicable) user/admin router
- Prisma query layer: all findMany, findUnique, and relationship-include calls for the affected models
- Progress calculation logic in the progress routes
- Middleware or shared query utilities (a reusable soft-delete filter may be introduced)

**Potentially new components:**

- A shared Prisma middleware or utility function that automatically applies `deletedAt IS NULL` filters to queries on soft-deletable models
- A shared cascade-soft-delete utility that accepts a model and ID and recursively soft-deletes descendants in a transaction

### Data Model Changes

Five models gain a new field:

- **User**: Add a nullable `deletedAt` datetime field, default null.
- **Course**: Add a nullable `deletedAt` datetime field, default null.
- **Unit**: Add a nullable `deletedAt` datetime field, default null.
- **Lesson**: Add a nullable `deletedAt` datetime field, default null.
- **Assessment**: Add a nullable `deletedAt` datetime field, default null.

No new models, relationships, or enum values are required. Existing foreign key cascade-delete constraints on the database level remain unchanged (they serve as a safety net but will not fire during normal operation since rows are no longer hard-deleted).

### API Changes

No new endpoints are added. Existing endpoints are modified:

- **DELETE endpoints** (Course, Unit, Lesson, and User if applicable): Change from hard delete to soft delete (set `deletedAt`). Response shape and status codes remain the same.
- **GET list endpoints** (Courses, Units, Lessons, Assessments): Add automatic filtering to exclude soft-deleted records. No change to request/response shape.
- **GET detail endpoints**: Return 404 for soft-deleted records. No change to request/response shape for non-deleted records.
- **PUT endpoints**: Return 404 for soft-deleted records.
- **POST assessment attempt**: Return 404 if the parent Assessment is soft-deleted.
- **Progress endpoints**: Calculations exclude soft-deleted entities.

### Data Flow

**Primary use case — deleting a Course:**

1. Authenticated user sends DELETE to `/api/courses/:courseId`.
2. Server authenticates and authorizes the request (existing middleware).
3. Server looks up the Course by ID, confirming it exists and `deletedAt` is null. Returns 404 if not found or already soft-deleted.
4. Server begins a database transaction.
5. Server sets `deletedAt = now()` on the Course.
6. Server queries all Units belonging to that Course where `deletedAt` is null, and sets `deletedAt = now()` on each.
7. Server queries all Lessons belonging to those Units where `deletedAt` is null, and sets `deletedAt = now()` on each.
8. Server queries all Assessments belonging to those Lessons (and the Unit-level and Course-level Assessments) where `deletedAt` is null, and sets `deletedAt = now()` on each.
9. Server commits the transaction.
10. Server returns success response.

**Primary use case — listing Courses:**

1. Authenticated user sends GET to `/api/courses`.
2. Server queries Courses with an additional `deletedAt: null` filter condition.
3. Server returns only non-deleted Courses.

### Integration Points

- **Authentication/Authorization (better-auth, middleware)**: Existing `authenticate` and `authorize` middleware are unchanged. Soft-delete filtering happens after auth checks at the query level.
- **Admin plugin (better-auth)**: If User deletion is handled through the better-auth admin plugin, the soft-delete logic must hook into or replace that deletion path.
- **Completion models (LessonCompletion, UnitCompletion)**: These are not soft-deleted but their parent lookup queries must account for soft-deleted parents when calculating progress.
- **AssessmentAttempt**: Not soft-deleted, but attempts cannot be created against soft-deleted Assessments.
- **Client-side hooks**: No client changes are needed since the API contract (request/response shapes) does not change. The client already handles 404 responses.

## Required Design Artifacts

- [x] Backend plan (`backend-plan.md`)
- [x] API contract (`api-contract.md`)
- [ ] Frontend plan (`frontend-plan.md`)
- [ ] UI wireframe (`wireframe.md`)
