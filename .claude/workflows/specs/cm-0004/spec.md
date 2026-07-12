---
id: cm-0004
title: Enforce Resource-Level Authorization on Mutations
stage: spec
status: approved
approver: human
approved_at: 2026-05-06T00:00:00Z
---

# Enforce Resource-Level Authorization on Mutations

## Problem Statement

The API currently relies on role-based middleware (`authenticate`, `authorize`) to gate endpoints by user role, but does not enforce ownership or resource-level permissions on mutation operations. Any authenticated teacher can update or delete another teacher's course, any student can delete another student's completion records, and student notes are not scoped to the requesting user. This creates a privilege escalation surface where authenticated users can modify resources they do not own. Resource-level authorization checks must be added to all mutation endpoints (and to student note reads) so that users can only modify their own data, with admins retaining full bypass access.

## Scope

### In Scope

- Ownership checks on all mutation endpoints (create, update, delete) for courses, units, lessons, resources, tools, student notes, assessments, completions, and resource completions
- Admin bypass: admins skip all ownership checks and can modify any resource
- Student note scoping: GET endpoints return only the requesting student's notes; create/update/delete restricted to the requesting student's own notes
- Assessment attempt creation restricted to students (not teachers or admins)
- Structuring authorization logic so that enrollment-based read restrictions can be layered in later without a full refactor

### Out of Scope

- Read-access restrictions (enrollment-based segmentation of GET endpoints for courses, units, lessons, resources, tools, assessments) — deferred to a future spec
- Teacher-initiated completion updates on behalf of students
- Changes to the authentication system itself (better-auth configuration, session handling)
- Authorization on assignment endpoints introduced in cm-0003 (will be addressed when that feature merges or in a follow-up)
- UI changes — this is a backend-only authorization hardening effort
- Rate limiting changes
- New database models, fields, or schema migrations

## Requirements

### Functional Requirements

- FR-01: `PUT /courses/:courseId` and `DELETE /courses/:courseId` shall reject requests from teachers who are not the course owner, returning a 403 status.
- FR-02: `POST /courses` shall set the authenticated teacher as the course owner. Any teacher may create a course.
- FR-03: `POST /courses/:courseId/units`, `PUT /courses/:courseId/units/:unitId`, and `DELETE /courses/:courseId/units/:unitId` shall reject requests from teachers who do not own the parent course, returning a 403 status.
- FR-04: `POST /units/:unitId/lessons`, `PUT /units/:unitId/lessons/:lessonId`, and `DELETE /units/:unitId/lessons/:lessonId` shall reject requests from teachers who do not own the course that contains the parent unit, returning a 403 status.
- FR-05: `POST /lessons/:lessonId/resources`, `PUT /resources/:resourceId`, and `DELETE /resources/:resourceId` shall reject requests from teachers who do not own the course that contains the resource's lesson, returning a 403 status.
- FR-06: `POST /lessons/:lessonId/tools`, `PUT /tools/:toolId`, and `DELETE /tools/:toolId` shall reject requests from teachers who do not own the course that contains the tool's lesson, returning a 403 status.
- FR-07: `GET /lessons/:lessonId/student-notes` shall return only the notes belonging to the authenticated student. Teachers and admins may see all notes for the lesson.
- FR-08: `POST /lessons/:lessonId/student-notes` shall create a note owned by the authenticated student. A student shall not be able to create a note attributed to another user.
- FR-09: `DELETE /student-notes/:studentNoteId` shall reject requests from students who do not own the note, returning a 403 status.
- FR-10: `POST /lessons/:lessonId/complete` and `DELETE /lessons/:lessonId/complete` shall only allow the authenticated student to create or remove their own completion record. A student shall not be able to modify another student's completion.
- FR-11: `POST /units/:unitId/complete` and `DELETE /units/:unitId/complete` shall only allow the authenticated student to create or remove their own completion record.
- FR-12: `POST /lessons/:lessonId/resource-completions` shall only allow the authenticated student to create their own resource completion records.
- FR-13: `POST /assessments/:assessmentId/attempts` shall verify that the submitting user has the student role. Teachers and admins shall not be able to create assessment attempts.
- FR-14: Assessment mutation endpoints (`POST /lessons/:lessonId/assessment`, `POST /units/:unitId/assessment`, `POST /courses/:courseId/assessment`, `PUT /assessments/:assessmentId`) shall reject requests from teachers who do not own the course that contains the assessment, returning a 403 status.
- FR-15: Admin users shall bypass all ownership checks on all mutation endpoints. An admin can create, update, or delete any resource regardless of ownership.
- FR-16: All 403 responses shall use a consistent error response shape with a machine-readable error code, consistent with the project's centralized error handling patterns.
- FR-17: The authorization logic shall be structured as composable middleware or utility functions that can be extended with enrollment checks in a future spec without requiring changes to individual route handlers.

### Non-Functional Requirements

- NFR-01: Ownership resolution (traversing from a child resource up to the course owner) shall add no more than one additional database query per request beyond the existing route handler queries.
- NFR-02: All authorization checks shall be covered by automated tests verifying both the rejection (403) and the allowed (200/201/204) cases.
- NFR-03: Authorization failures shall be logged with structured log entries including the requesting user ID, the target resource ID, and the action attempted, without exposing sensitive data.

## Systems-Level Architecture

### Components Involved

**Existing components (modified):**
- Course routes (server) — add ownership checks to PUT, DELETE
- Unit routes (server) — add ownership checks to POST, PUT, DELETE
- Lesson routes (server) — add ownership checks to POST, PUT, DELETE
- Resource routes (server) — add ownership checks to POST, PUT, DELETE
- Tool routes (server) — add ownership checks to POST, PUT, DELETE
- Student note routes (server) — scope GET to requesting student; add ownership checks to POST, DELETE
- Assessment routes (server) — add ownership checks to mutation endpoints; add role check on attempt creation
- Completion routes (server) — add self-only checks to POST, DELETE for lesson and unit completions
- Resource completion routes (server) — add self-only check to POST
- Authentication/authorization middleware (server) — potentially extended with new helper utilities

**New components:**
- Resource-level authorization middleware or utility functions (server) — composable functions for ownership resolution and enforcement, designed for future enrollment extension

### Data Model Changes

No new models, fields, or schema changes are required. All ownership can be resolved by traversing existing foreign key relationships:
- Course ownership: `Course.userId` matches the authenticated user
- Unit ownership: resolved via `Unit.courseId` then `Course.userId`
- Lesson ownership: resolved via `Lesson.unitId` then `Unit.courseId` then `Course.userId`
- Resource/tool ownership: resolved via the parent lesson's course ownership chain
- Student note ownership: `StudentNote.userId` matches the authenticated user
- Completion ownership: completion records are created with the authenticated user's ID; ownership is verified by matching `userId`
- Assessment ownership: resolved via the parent entity (lesson, unit, or course) up to `Course.userId`

### API Changes

No new endpoints are introduced. Existing endpoints gain authorization enforcement:

- **Course mutations** (PUT, DELETE `/courses/:courseId`): add course ownership check
- **Unit mutations** (POST, PUT, DELETE under `/courses/:courseId/units`): add course ownership check
- **Lesson mutations** (POST, PUT, DELETE under `/units/:unitId/lessons`): add course ownership check via unit traversal
- **Resource mutations** (POST `/lessons/:lessonId/resources`, PUT/DELETE `/resources/:resourceId`): add course ownership check via lesson/unit traversal
- **Tool mutations** (POST `/lessons/:lessonId/tools`, PUT/DELETE `/tools/:toolId`): add course ownership check via lesson/unit traversal
- **Student note endpoints** (GET, POST `/lessons/:lessonId/student-notes`, DELETE `/student-notes/:studentNoteId`): scope to authenticated student (GET returns only own notes for students; POST creates under own user ID; DELETE checks note ownership)
- **Assessment mutations** (POST assessment creation, PUT `/assessments/:assessmentId`): add course ownership check via parent entity traversal
- **Assessment attempts** (POST `/assessments/:assessmentId/attempts`): add student-role verification
- **Completion mutations** (POST/DELETE lesson and unit completions): add self-only verification
- **Resource completion mutations** (POST `/lessons/:lessonId/resource-completions`): add self-only verification

### Data Flow

**Teacher updates a lesson resource (ownership enforced):**
1. Teacher sends `PUT /resources/:resourceId` with updated content.
2. Server authenticates the request via session cookie.
3. Authorization middleware loads the resource, traverses to its parent lesson, then to the parent unit, then to the parent course.
4. Middleware compares `Course.userId` to the authenticated user's ID. If the user is an admin, the check is skipped entirely.
5. If ownership matches (or admin), the request proceeds to the route handler.
6. If ownership does not match, the server returns a 403 response with a structured error body and logs the authorization failure.

**Student creates a completion record (self-only enforced):**
1. Student sends `POST /lessons/:lessonId/complete`.
2. Server authenticates the request.
3. Authorization logic ensures the completion record will be created with the authenticated user's ID — there is no mechanism to specify a different user.
4. If a completion already exists for this user and lesson, the server returns the appropriate error.

**Admin modifies another teacher's course:**
1. Admin sends `PUT /courses/:courseId` with changes.
2. Server authenticates the request and identifies the user as an admin.
3. Authorization middleware detects the admin role and bypasses the ownership check entirely.
4. The request proceeds to the route handler normally.

### Integration Points

- **Authentication middleware (`authenticate`):** All mutation endpoints already require authentication. No changes to the authentication layer itself.
- **Role-based middleware (`authorize`):** Existing role checks remain in place. Resource-level checks layer on top of (not replace) role-based checks.
- **Prisma client:** Ownership resolution queries use the existing Prisma client and model relationships. The traversal from child resource to course owner follows the established foreign key chain.
- **Centralized error handling:** 403 responses use the project's existing error response shape and structured error codes.
- **Structured logging:** Authorization failures are logged using the existing logging infrastructure with contextual fields (user ID, resource ID, action).

## Required Design Artifacts

- [x] Backend plan (`backend-plan.md`)
- [x] API contract (`api-contract.md`)
- [ ] Frontend plan (`frontend-plan.md`)
- [ ] UI wireframe (`wireframe.md`)
