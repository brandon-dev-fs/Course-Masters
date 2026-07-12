---
id: cm-0030
title: Add File Assignment Type with Object Storage
stage: spec
status: approved
---

# Add File Assignment Type with Object Storage

## Problem Statement

Teachers currently have no way to attach downloadable or viewable files (PDFs, Word documents, presentations, text files) to lessons. Course content that exists as static documents must be linked externally or converted to notes, which loses formatting and fidelity. Adding a `file` assignment type with S3-compatible object storage enables teachers to upload files directly into the lesson editor and have students view or download them inline.

## Proposed Solution

Introduce a new `file` value to the `AssignmentType` enum. Teachers upload files through the lesson editor, which stores the binary in a GarageHQ-backed object storage service (S3-compatible) and persists metadata (filename, size, MIME type, storage key) in the existing `Assignment.content` JSON column. Students view file assignments inline within the assignment stepper: PDFs render via an embedded viewer, TXT files display as formatted text, and DOCX/PPTX files present a download button. Completion uses the existing manual "Mark as complete" pattern via `AssignmentCompletion`.

GarageHQ is chosen for local development because it is S3-compatible and runs in Docker. In production, the same S3 client code migrates to Cloudflare R2, AWS S3, or any S3-compatible provider by changing three environment variables (endpoint, access key, secret key). Docker setup is a prerequisite for this feature and will be handled as a separate task.

## Scope

### In Scope

- New `file` value added to the `AssignmentType` enum
- Server-side file upload endpoint (multipart form data) for teachers and admins
- Server-side file download/streaming endpoint for authenticated users
- S3-compatible object storage integration via the AWS SDK S3 client
- GarageHQ as the local development object storage provider (runs in Docker)
- File metadata stored in `Assignment.content` JSON column (filename, file size in bytes, MIME type, storage key)
- Supported file types: PDF, DOCX, TXT, PPT, PPTX
- 10 MB maximum file size enforced server-side
- `FileAssignmentView` component for inline display in the assignment stepper
- In-browser rendering for PDF (iframe or PDF.js) and TXT (text display)
- Download-only presentation for DOCX and PPTX
- Manual "Mark as complete" button (existing completion pattern)
- File deletion from object storage when an assignment is deleted
- Docker Compose configuration for GarageHQ with a named volume for data persistence
- New environment variables for S3 connection (endpoint, bucket, access key, secret key)

### Out of Scope

- Student file uploads (students are consumers only)
- Image file types (PNG, JPG, GIF, SVG) — may be added in a future iteration
- File versioning or revision history
- Virus/malware scanning of uploaded files
- File preview generation (thumbnails, document previews)
- Bulk file upload (one file per assignment)
- Docker setup for the application itself (separate prerequisite task)
- Production object storage provisioning (Cloudflare R2, AWS S3, etc.)
- Drag-and-drop upload UI
- File search or indexing

## Required Design Artifacts

- [x] Backend plan (`backend-plan.md`)
- [x] API contract (`api-contract.md`)
- [x] Frontend plan (`frontend-plan.md`)
- [x] UI wireframe (`wireframe.md`)

## Requirements

### Functional Requirements

- FR-01: The system adds a `file` value to the `AssignmentType` enum via a Prisma migration.
- FR-02: Teachers and admins can upload a file when creating a `file`-type assignment through the lesson editor. Students cannot upload files.
- FR-03: The upload endpoint accepts multipart form data and stores the file binary in S3-compatible object storage (GarageHQ locally).
- FR-04: The upload endpoint rejects files exceeding 10 MB with a 400 error and a human-readable message indicating the size limit.
- FR-05: The upload endpoint rejects files whose MIME type is not in the allowed list (PDF, DOCX, TXT, PPT, PPTX) with a 400 error.
- FR-06: On successful upload, the server stores metadata in the `Assignment.content` JSON column: original filename, file size in bytes, MIME type, and the object storage key.
- FR-07: Authenticated users can request a file download via a dedicated endpoint that streams the file from object storage.
- FR-08: The download endpoint sets appropriate `Content-Type` and `Content-Disposition` headers based on the stored MIME type and filename.
- FR-09: The `AssignmentStepper` component renders a `FileAssignmentView` when the assignment type is `file`.
- FR-10: `FileAssignmentView` renders PDF files inline using an iframe or PDF.js embedded viewer, without opening a new tab.
- FR-11: `FileAssignmentView` renders TXT files inline as formatted text within the assignment frame.
- FR-12: `FileAssignmentView` renders DOCX and PPTX files as a download button with the filename displayed. Clicking the button downloads the file.
- FR-13: File assignments use the existing manual "Mark as complete" button and `AssignmentCompletion` model for completion tracking.
- FR-14: When a `file`-type assignment is deleted, the server deletes the corresponding file from object storage within the same operation.
- FR-15: The GarageHQ service is defined in a Docker Compose file with a named volume so that stored files persist across container restarts and disposals.
- FR-16: The S3 client configuration reads connection details (endpoint URL, bucket name, access key ID, secret access key) from environment variables, enabling a production switch to any S3-compatible provider by changing only these values.
- FR-17: The upload endpoint enforces the same authorization rules as other assignment write operations: `authorize('teacher')` and `requireCourseOwnership()`.

### Non-Functional Requirements

- NFR-01: File upload and download operations must not block the Express event loop. File streaming must use Node.js streams, not buffering entire files in memory.
- NFR-02: The S3 client module must be a singleton instantiated once at server startup, not per-request.
- NFR-03: The object storage key format must include a unique identifier (UUID) to prevent filename collisions across assignments.
- NFR-04: Environment variables for S3 configuration must be validated at server startup via the existing Zod-based config validation, with clear error messages for missing values.
- NFR-05: The Docker Compose configuration for GarageHQ must use a named volume (not a bind mount) for portability across development environments.
- NFR-06: The inline PDF viewer must be usable at the assignment frame width without horizontal scrolling.

## Open Questions

- OQ-01: Should the Docker setup (Docker Compose for the full development environment) be tracked as a formal spec (cm-0031) or handled as an informal prerequisite task? This blocks cm-0030 implementation.
