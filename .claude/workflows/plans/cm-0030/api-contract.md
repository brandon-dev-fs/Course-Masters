---
id: cm-0030
title: Add File Assignment Type with Object Storage
stage: design
status: approved
---

# API Contract: File Assignment Type with Object Storage

---

## POST /lessons/:lessonId/assignments/upload

Upload a file and create a file-type assignment in one request.

### Auth

- `authenticate()` (applied at router root)
- `authorize('teacher', 'admin')`

### Request

**Headers**:
- `Content-Type: multipart/form-data`

**Path params**:
- `lessonId` (string, UUID) -- the lesson to attach the file assignment to

**Form-data fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | yes | The file to upload. Max 10MB. Allowed types: PDF, DOCX, TXT, PPT, PPTX |
| `title` | string | yes | Assignment title (min 1 character) |
| `objective` | string | no | Assignment objective |

### Response

**201 Created**

```json
{
  "data": {
    "id": "uuid",
    "lessonId": "uuid",
    "order": 3,
    "title": "Chapter 3 Notes",
    "objective": "Review the key concepts",
    "type": "file",
    "createdAt": "2026-06-14T10:00:00.000Z",
    "updatedAt": "2026-06-14T10:00:00.000Z",
    "noteAssignment": null,
    "videoAssignment": null,
    "readingAssignment": null,
    "vocabAssignment": null,
    "practiceProblemAssignment": null,
    "fileAssignment": {
      "id": "uuid",
      "assignmentId": "uuid",
      "filename": "chapter-3-notes.pdf",
      "mimeType": "application/pdf",
      "sizeBytes": 245760
    },
    "completed": false,
    "bookmark": null
  }
}
```

Note: The `storageKey` field is NOT included in the response -- it is internal.

### Error Cases

| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | Missing `title` field |
| 400 | `VALIDATION_ERROR` | Missing file in request |
| 400 | `VALIDATION_ERROR` | Disallowed MIME type |
| 400 | `FILE_TOO_LARGE` | File exceeds 10MB |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | User is a student |
| 404 | `NOT_FOUND` | Lesson does not exist |
| 500 | `S3_NOT_CONFIGURED` | Object storage not configured |
| 500 | `UPLOAD_FAILED` | S3 upload failure |

### Notes

- The file is held in memory during upload (max 10MB buffer) and uploaded to S3 before the database transaction.
- If the database transaction fails after S3 upload, the S3 object is deleted as a compensating action.
- The `order` field is auto-assigned as the next integer in the lesson's assignment sequence.
- The response shape matches the existing assignment response structure with all type-specific relations included (null for non-matching types).

---

## GET /assignments/:assignmentId/file

Download a file from a file-type assignment. Streams the file from S3 to the client.

### Auth

- `authenticate()` (applied at router root)
- No role restriction -- all authenticated users (students, teachers, admins) can download files

### Request

**Path params**:
- `assignmentId` (string, UUID) -- the assignment whose file to download

### Response

**200 OK**

Binary file stream with the following headers:

| Header | Value |
|--------|-------|
| `Content-Type` | The file's MIME type (e.g. `application/pdf`) |
| `Content-Disposition` | `attachment; filename="original-filename.pdf"` |
| `Content-Length` | File size in bytes |

The response body is the raw file content streamed from S3. No JSON envelope.

### Error Cases

| Status | Code | Condition |
|--------|------|-----------|
| 401 | `UNAUTHENTICATED` | No valid session |
| 404 | `NOT_FOUND` | Assignment does not exist |
| 404 | `NOT_FOUND` | Assignment exists but is not type `file` |
| 500 | `S3_NOT_CONFIGURED` | Object storage not configured |
| 500 | `DOWNLOAD_FAILED` | S3 download failure |

### Notes

- The file is streamed directly from S3 to the HTTP response -- the server does not buffer the entire file in memory.
- The `Content-Disposition: attachment` header prompts browsers to download the file. The frontend can override this for inline viewing of PDFs and text files by using appropriate rendering (iframe for PDF, fetch + text display for TXT).
- The envelope middleware is bypassed for this endpoint because `res.json()` is never called -- the response is piped directly.

---

## DELETE /assignments/:assignmentId (existing -- modified behavior)

The existing delete endpoint gains additional behavior for file-type assignments.

### Auth

- `authenticate()` (applied at router root)
- `authorize('teacher', 'admin')`

### Request

**Path params**:
- `assignmentId` (string, UUID)

### Response

**204 No Content** (unchanged)

### Modified Behavior

When the deleted assignment has `type: 'file'`:
1. The database transaction deletes the `Assignment` record (cascade deletes `FileAssignment`, `AssignmentCompletion`, `ActivityBookmark`)
2. After the transaction commits, the service issues a `DeleteObjectCommand` to S3 using the `storageKey` from the `FileAssignment` record (fetched before deletion)
3. If S3 deletion fails, a warning is logged but the endpoint still returns 204. Orphan S3 objects do not affect correctness and can be cleaned up by a maintenance task.

### Error Cases

| Status | Code | Condition |
|--------|------|-----------|
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | User is a student |
| 404 | `NOT_FOUND` | Assignment does not exist |

---

## GET /lessons/:lessonId/assignments (existing -- extended response)

The existing list endpoint response shape is extended to include `fileAssignment` data.

### Modified Response Shape

Each assignment in the array now includes a `fileAssignment` field:

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "file",
      "fileAssignment": {
        "id": "uuid",
        "assignmentId": "uuid",
        "filename": "chapter-3-notes.pdf",
        "mimeType": "application/pdf",
        "sizeBytes": 245760
      },
      "...other fields..."
    },
    {
      "id": "uuid",
      "type": "note",
      "fileAssignment": null,
      "...other fields..."
    }
  ]
}
```

The `storageKey` is excluded from the response via explicit `select` in the Prisma include, or by omitting it in the response transformation.

---

## GET /assignments/:assignmentId (existing -- extended response)

Same extension as the list endpoint. The single assignment response now includes `fileAssignment` data with the same shape.

---

## PUT /assignments/:assignmentId (existing -- file type behavior)

For `file` type assignments, the update endpoint supports updating only the shared fields (`title`, `objective`). The file itself cannot be replaced via update -- delete and re-upload instead.

No changes to the request schema are needed. The existing `updateAssignmentSchema` already accepts `title` and `objective` as optional fields. The service ignores type-specific fields that do not apply to the `file` type.
