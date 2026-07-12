---
id: cm-0030
title: Add File Assignment Type with Object Storage
stage: design
status: approved
---

# Backend Plan: File Assignment Type with Object Storage

## 1. Prisma Schema Change

**Migration name**: `add_file_assignment_type`

### Enum change

Add `file` to the `AssignmentType` enum:

```
enum AssignmentType {
  note
  video
  reading
  vocab
  practice_problem
  file
}
```

### New model: `FileAssignment`

Following the existing pattern where each assignment type has its own relation table (`NoteAssignment`, `VideoAssignment`, etc.), add a `FileAssignment` model:

```
model FileAssignment {
  id           String @id @default(uuid())
  assignmentId String @unique
  filename     String
  mimeType     String
  sizeBytes    Int
  storageKey   String

  assignment Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)

  @@map("file_assignment")
}
```

Fields:
- `filename`: original file name as uploaded (e.g. `chapter-3-notes.pdf`)
- `mimeType`: validated MIME type string
- `sizeBytes`: file size in bytes (Int is sufficient -- 10MB max = 10,485,760, well within Int range)
- `storageKey`: S3 object key (e.g. `assignments/{assignmentId}/{uuid}-{filename}`)

### Assignment model update

Add the `fileAssignment` optional relation to the `Assignment` model, matching the pattern of existing relations:

```
model Assignment {
  ...existing fields...
  fileAssignment  FileAssignment?
  ...
}
```

### Post-migration

Run `npx prisma generate` to update client types.

---

## 2. New S3 Library: `server/src/lib/s3.ts`

Create a singleton S3 client module.

**Client**: Use `@aws-sdk/client-s3` `S3Client` configured from env vars. Export the client instance and the bucket name as named exports.

**Env vars consumed**:
- `S3_ENDPOINT` -- GarageHQ endpoint URL (e.g. `http://localhost:3900`)
- `S3_BUCKET` -- bucket name (e.g. `course-masters`)
- `S3_ACCESS_KEY_ID` -- access key
- `S3_SECRET_ACCESS_KEY` -- secret key
- `S3_REGION` -- region string (default `garage` for GarageHQ, override for AWS/R2)

**Client configuration**:
- `forcePathStyle: true` -- required for GarageHQ and most S3-compatible stores
- `region` from env
- `endpoint` from env
- `credentials` from env vars

The module exports:
- `s3Client`: the `S3Client` singleton
- `S3_BUCKET`: the bucket name string

---

## 3. Multer Integration

**Package**: `multer` (not `multer-s3` -- see rationale below)

**Rationale for `multer` with memory storage limited to 10MB instead of `multer-s3`**:

After reviewing the architecture, `multer-s3` streams directly to S3 during the multipart parse, which means the file is uploaded to S3 before any business logic runs (before the Assignment record is created). If the transaction to create the Assignment fails, an orphan file is left in S3. Using `multer` with a 10MB memory limit keeps the flow simple: parse the file into a buffer, run the transaction (create Assignment + FileAssignment + upload to S3), and roll back cleanly on failure. At 10MB max, memory pressure is negligible.

**Alternative**: If the team prefers streaming for larger future file sizes, switch to `multer-s3` and add a cleanup step on transaction failure. For the 10MB cap in this spec, memory storage is the simpler and safer choice.

**Configuration** (defined in the service or a utility, not as global middleware):
- `storage`: `multer.memoryStorage()`
- `limits.fileSize`: 10 * 1024 * 1024 (10MB)
- `fileFilter`: allow only `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`, `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation`

**Multer middleware instance**: Create and export from `server/src/middleware/upload.ts` so it can be applied in the route file. Export a configured `upload.single('file')` middleware.

**MIME type allowlist constant**: Define in the upload middleware file. The five allowed types:

| Extension | MIME type |
|-----------|-----------|
| .pdf | `application/pdf` |
| .docx | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| .txt | `text/plain` |
| .ppt | `application/vnd.ms-powerpoint` |
| .pptx | `application/vnd.openxmlformats-officedocument.presentationml.presentation` |

---

## 4. New Routes

All new routes are added to the existing `server/src/routes/assignment.routes.ts`.

### Upload route (create file assignment)

Added to `lessonAssignmentsRouter`:

```
POST /lessons/:lessonId/assignments/upload
```

Middleware chain: `authorize('teacher', 'admin')` -> `upload.single('file')` -> `assignmentController.uploadFile`

Note: `validate()` is not used here because the request is `multipart/form-data`, not JSON. The `title` field comes as a form-data text field. Validation of `title` and file presence happens in the controller/service layer.

### Download route

Added to `assignmentsRouter`:

```
GET /assignments/:assignmentId/file
```

No additional middleware beyond `authenticate()` (already applied at router root). All authenticated users (students, teachers, admins) can download files.

Middleware chain: (none beyond authenticate) -> `assignmentController.downloadFile`

---

## 5. Controller Methods

Add to `server/src/controllers/assignment.controller.ts`:

### `uploadFile`

- Extract `lessonId` from params, `title` from `req.body` (form-data text field), `file` from `req.file` (multer)
- Validate `title` is present and non-empty; throw `ValidationError` if missing
- Validate `req.file` is present; throw `ValidationError` if missing
- Optionally extract `objective` from `req.body`
- Call `assignmentService.createFileAssignment(lessonId, { title, objective, file })`
- Respond with `201` and the created assignment

### `downloadFile`

- Extract `assignmentId` from params
- Call `assignmentService.getFileStream(assignmentId)`
- Service returns `{ stream, filename, mimeType, sizeBytes }`
- Set response headers: `Content-Type`, `Content-Disposition: attachment; filename="..."`, `Content-Length`
- Pipe the stream to `res`
- Handle stream errors by destroying the response

### Update to existing `remove`

No change needed to the controller. The service layer handles S3 deletion internally when the assignment type is `file`.

---

## 6. Service Methods

Add to `server/src/services/assignment.service.ts`:

### `createFileAssignment(lessonId, data)`

Input: `lessonId`, `{ title, objective?, file: Express.Multer.File }`

Logic:
1. Assert lesson exists
2. Generate storage key: `assignments/{newUUID}/{uuid}-{originalFilename}` (use `crypto.randomUUID()` for the key prefix)
3. In a transaction:
   a. Aggregate max order for the lesson
   b. Create `Assignment` record with `type: 'file'`
   c. Create `FileAssignment` record with filename, mimeType, sizeBytes, storageKey
4. Upload buffer to S3 using `PutObjectCommand` with the storage key, content type, and body
5. If S3 upload fails, the transaction has already committed -- log a warning and delete the Assignment record (compensating action). Alternatively, upload to S3 first, then run the transaction, and delete from S3 if the transaction fails. The latter is safer (orphan S3 objects are less harmful than orphan DB records) -- **upload to S3 first, then create DB records**.
6. Return the assignment via `findById`

**Recommended flow** (upload-first):
1. Assert lesson exists
2. Generate storage key
3. Upload buffer to S3 via `PutObjectCommand`
4. In a transaction: create Assignment + FileAssignment
5. If transaction fails, delete the S3 object via `DeleteObjectCommand` (fire-and-forget with error logging)
6. Return the assignment

### `getFileStream(assignmentId)`

Input: `assignmentId`

Logic:
1. Find the assignment with `fileAssignment` include
2. If not found or not a `file` type, throw `NotFoundError`
3. Issue `GetObjectCommand` for the storage key
4. Return `{ stream: response.Body, filename, mimeType, sizeBytes }`

The controller pipes the stream to the HTTP response.

### Update to existing `remove`

Before the existing delete transaction, check if the assignment is type `file`. If so:
1. Fetch the `fileAssignment` to get the `storageKey`
2. After the DB transaction completes, issue `DeleteObjectCommand` for the storage key
3. Log a warning if S3 deletion fails but do not throw -- the DB record is already deleted, and orphan S3 objects can be cleaned up by a future maintenance task

### Update to `buildAssignmentInclude`

Add `fileAssignment: true` to the include shape, matching the pattern of `noteAssignment: true`, `videoAssignment: true`, etc.

---

## 7. Config Changes: `server/src/config.ts`

Add new optional S3 env vars to the Zod schema. They are optional so the server can still start without S3 configured (existing functionality is unaffected). The S3 lib module will validate that they are present when it initializes, and log a warning if S3 is not configured.

New fields in `envSchema`:

- `S3_ENDPOINT`: `z.string().url().optional()`
- `S3_BUCKET`: `z.string().min(1).optional()`
- `S3_ACCESS_KEY_ID`: `z.string().min(1).optional()`
- `S3_SECRET_ACCESS_KEY`: `z.string().min(1).optional()`
- `S3_REGION`: `z.string().min(1).default('garage')`

The S3 lib checks at import time whether the required vars are present. If any are missing, it exports `null` for the client and bucket. The upload/download service methods check for `null` and throw `AppError('S3_NOT_CONFIGURED', 'Object storage is not configured', 500)` if S3 is unavailable.

---

## 8. Docker Compose Change

Add a `garage` service to `docker-compose.yml`:

```yaml
garage:
  image: dxflrs/garage:v1.1.0
  ports:
    - '3900:3900'   # S3 API
    - '3902:3902'   # Admin API
  volumes:
    - garage_data:/var/lib/garage/data
    - garage_meta:/var/lib/garage/meta
  environment:
    GARAGE_ALLOW_WORLD_READABLE_SECRETS: '1'
  command: /garage server
```

Add to `volumes`:
```yaml
garage_data:
garage_meta:
```

Add S3 env vars to the `server` service environment block:
```yaml
S3_ENDPOINT: http://garage:3900
S3_BUCKET: course-masters
S3_ACCESS_KEY_ID: ${S3_ACCESS_KEY_ID}
S3_SECRET_ACCESS_KEY: ${S3_SECRET_ACCESS_KEY}
S3_REGION: garage
```

**GarageHQ initialization**: GarageHQ requires a one-time setup (layout configuration, key creation, bucket creation) after the container first starts. Document this in a `scripts/garage-init.sh` script that:
1. Waits for the admin API to be ready
2. Configures the node layout
3. Creates an API key
4. Creates the `course-masters` bucket
5. Grants the key read/write access to the bucket

This script runs once manually or as part of a `docker compose up` post-start hook. It outputs the access key ID and secret key for use in `.env`.

---

## 9. Env Example Updates

Add to `server/.env.example`:

```
# Object Storage (S3-compatible — GarageHQ local, R2/S3 in production)
S3_ENDPOINT=http://localhost:3900
S3_BUCKET=course-masters
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_REGION=garage
```

---

## 10. Dependencies

Add to `server/package.json` (pinned exact versions):

| Package | Purpose |
|---------|---------|
| `@aws-sdk/client-s3` | S3 operations (PutObject, GetObject, DeleteObject) |
| `multer` | Multipart form-data parsing for file uploads |
| `@types/multer` | TypeScript types for multer (dev dependency) |

**Not needed**:
- `multer-s3`: not using streaming-to-S3 during parse (see Section 3 rationale)
- `@aws-sdk/s3-request-presigner`: not using presigned URLs (streaming server-side instead)

---

## 11. Error Handling

New error cases specific to this feature:

| Scenario | Error class | Code | Status |
|----------|-------------|------|--------|
| No file in upload request | `ValidationError` | `VALIDATION_ERROR` | 400 |
| File exceeds 10MB | Multer `LIMIT_FILE_SIZE` caught in error handler | `FILE_TOO_LARGE` | 400 |
| Disallowed MIME type | `ValidationError` (from multer fileFilter) | `VALIDATION_ERROR` | 400 |
| Missing title in upload | `ValidationError` | `VALIDATION_ERROR` | 400 |
| Assignment not found (download) | `NotFoundError` | `NOT_FOUND` | 404 |
| Assignment is not file type (download) | `NotFoundError` | `NOT_FOUND` | 404 |
| S3 not configured | `AppError` | `S3_NOT_CONFIGURED` | 500 |
| S3 upload failure | `AppError` | `UPLOAD_FAILED` | 500 |
| S3 download failure | `AppError` | `DOWNLOAD_FAILED` | 500 |

**Multer error handling**: Multer throws `MulterError` for size limit violations. Add a case to `errorHandler.ts` to catch `MulterError` with code `LIMIT_FILE_SIZE` and return a `400` with code `FILE_TOO_LARGE`. Other `MulterError` codes should map to `400` with code `VALIDATION_ERROR`.

---

## 12. Validation

Since the upload endpoint uses `multipart/form-data` (not JSON), the standard `validate()` middleware cannot be used. Instead:

- **File presence and type**: validated by multer's `fileFilter` callback
- **File size**: enforced by multer's `limits.fileSize`
- **Title field**: validated in the controller before calling the service -- throw `ValidationError` if missing or empty
- **Objective field**: optional, validated in the controller if present

---

## 13. Express Type Augmentation

Add `file?: Express.Multer.File` to the Express `Request` type. Multer's `@types/multer` package handles this automatically via its global type augmentation -- no manual changes to `express.d.ts` needed.

---

## 14. Storage Key Format

Format: `assignments/{assignmentId}/{uuid}-{originalFilename}`

- `assignmentId` groups files by assignment for easy cleanup
- `uuid` prefix (via `crypto.randomUUID()`) prevents filename collisions
- Original filename preserved for human-readable S3 browsing

Note: Since the assignment ID is not known before the transaction, and the recommended flow uploads to S3 first, use a generated UUID as the directory prefix instead of the assignmentId:

Revised format: `assignments/{uuid}/{originalFilename}`

The UUID is generated before upload and stored in `FileAssignment.storageKey`.
