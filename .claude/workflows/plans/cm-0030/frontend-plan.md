---
id: cm-0030
title: Add File Assignment Type with Object Storage
stage: design
status: approved
---

# Frontend Plan: Add File Assignment Type with Object Storage

## 1. Overview

This plan covers the frontend changes required to support a new `file` assignment type. Teachers upload files (PDF, DOCX, TXT, PPT, PPTX) through the existing `AssignmentFormModal` flow. Students view files inline (PDF via iframe, TXT as formatted text) or download them (DOCX, PPTX). Completion uses the existing manual "Mark as complete" pattern.

Acceptance criteria addressed:
- FR-02: Teacher upload via lesson editor
- FR-04/FR-05: Client-side validation for size (10 MB) and MIME type before upload
- FR-09: `AssignmentStepper` renders file assignments
- FR-10: PDF inline viewer (iframe)
- FR-11: TXT inline text display
- FR-12: DOCX/PPTX download button
- FR-13: Existing "Mark as complete" pattern (no changes needed)

## 2. Folder Structure

New files to create:

```
client/src/features/assignments/FileAssignmentView.tsx    # Student-facing file viewer
client/src/features/assignments/FileAssignmentForm.tsx     # Teacher-facing upload form (MetaFields sub-form)
```

Modified files:

```
client/src/api/types.ts                                    # Add FileAssignmentData, update AssignmentType and Assignment
client/src/api/assignments.ts                              # Add uploadFileAssignment, getFileDownloadUrl
client/src/features/assignments/AssignmentFormModal.tsx     # Add 'file' to TYPE_CONFIG, handle file upload flow
client/src/features/lessons/AssignmentStepper.tsx           # Add 'file' case to getStepIcon and getStepLabel
client/src/features/lessons/LessonAssignmentContent.tsx     # Add 'file' branch rendering FileAssignmentView
```

## 3. Component Tree

### FileAssignmentForm (new)

- **File path:** `client/src/features/assignments/FileAssignmentForm.tsx`
- **Type:** UI component (MetaFields sub-form rendered inside AssignmentFormModal)
- **Purpose:** Provides the file picker, displays selected file info (name, size), shows upload progress bar during submission, and validates file type and size client-side before upload.
- **Props interface:**
  ```
  interface FileAssignmentFormProps {
    file: File | null;
    onFileChange: (file: File | null) => void;
    uploadProgress: number | null;       // 0-100 during upload, null when idle
    existingFile: FileAssignmentData | null;  // populated in edit mode
    error: string;
    onErrorChange: (error: string) => void;
  }
  ```
- **Note:** This component does NOT extend `SubFormProps`. The file assignment requires a fundamentally different form flow (multipart upload instead of JSON POST), so `AssignmentFormModal` will handle it with dedicated state rather than the shared `TypeFormState` pattern. See Section 9 for the detailed submission flow.

### FileAssignmentView (new)

- **File path:** `client/src/features/assignments/FileAssignmentView.tsx`
- **Type:** UI component (rendered inside `LessonAssignmentContent`)
- **Purpose:** Renders file content based on MIME type -- PDF in an iframe, TXT as preformatted text, DOCX/PPTX as a download card.
- **Props interface:**
  ```
  interface FileAssignmentViewProps {
    assignmentId: string;
    fileAssignment: FileAssignmentData;
  }
  ```

### AssignmentFormModal (modified)

- **File path:** `client/src/features/assignments/AssignmentFormModal.tsx`
- **Changes:**
  - Add `file` entry to `TYPE_CONFIG` with `FileUp` icon, label `'File'`, and `MetaFields: FileAssignmentForm`
  - Add file-specific state: `selectedFile: File | null`, `uploadProgress: number | null`, `fileError: string`
  - Override the standard `handleSubmit` for `file` type to use `assignmentsApi.uploadFileAssignment` (multipart) instead of `onSubmit` (JSON)
  - In edit mode for `file` type, only title/objective are editable via the standard `onSubmit(updatePayload)` -- the file itself cannot be replaced (delete and re-create instead, per api-contract)

### LessonAssignmentContent (modified)

- **File path:** `client/src/features/lessons/LessonAssignmentContent.tsx`
- **Changes:** Add `else if (assignment.type === 'file' && assignment.fileAssignment)` branch that renders `<FileAssignmentView assignmentId={assignment.id} fileAssignment={assignment.fileAssignment} />`

### AssignmentStepper (modified)

- **File path:** `client/src/features/lessons/AssignmentStepper.tsx`
- **Changes:**
  - Import `FileUp` from `lucide-react`
  - Add `if (item.assignmentType === 'file') return FileUp;` in `getStepIcon`
  - Add `if (item.assignmentType === 'file') return 'File';` in `getStepLabel`

## 4. Client Routes

No new routes. All changes occur within the existing `LessonDetailPage` at `/courses/:courseId/units/:unitId/lessons/:lessonId`.

## 5. Hooks and Data Fetching

### No new hooks required

- `FileAssignmentView` uses inline `useState` + `useEffect` for TXT content fetching (simple one-off fetch pattern, not worth a hook).
- PDF rendering uses an iframe with `src` pointing directly to the download endpoint -- no fetch needed.
- File upload uses `XMLHttpRequest` directly in the API module for progress tracking (see Section 6).

### Existing hooks used

- `useCanEdit()` -- already used in `LessonDetailPage` to conditionally show the Add button and edit/delete controls.
- `useAuth()` -- already used for authentication gating.

## 6. API Integration

### Action: Teacher uploads a file assignment (CREATE)

```
Action: Click "Save assignment" in FileAssignmentForm
Method: POST
Path: /lessons/:lessonId/assignments/upload
Request: multipart/form-data with fields: file (File), title (string), objective (string, optional)
Response: 201 { data: Assignment }  (includes fileAssignment relation)
```

This endpoint cannot use `apiClient.post` because `apiClient` always sets `Content-Type: application/json`. A new `assignmentsApi.uploadFileAssignment` function will use `XMLHttpRequest` to support upload progress tracking. It must:
- Include `credentials: 'include'` (withCredentials = true)
- NOT set a Content-Type header (let the browser set the multipart boundary)
- Parse the response JSON and unwrap the `{ data: ... }` envelope
- Handle 401 by dispatching `window.CustomEvent('auth:unauthorized')`
- Throw `ApiClientError` on non-2xx responses

### Action: Student/teacher views or downloads a file

```
Action: Render FileAssignmentView or click download button
Method: GET
Path: /assignments/:assignmentId/file
Request: (none)
Response: 200, binary stream with Content-Type, Content-Disposition, Content-Length headers
```

For PDF: The iframe `src` is set to `/api/assignments/:assignmentId/file`. The browser handles the request with the session cookie (same-origin, credentials included automatically for iframes).

For TXT: A `fetch` call to `/api/assignments/:assignmentId/file` with `credentials: 'include'` reads the response as text via `response.text()`. This uses a direct `fetch` call (not `apiClient`) because the response is not JSON-enveloped.

For DOCX/PPTX: An `<a>` element with `href="/api/assignments/:assignmentId/file"` and `download` attribute triggers browser download. The session cookie is sent automatically for same-origin anchor downloads.

A helper function `assignmentsApi.getFileDownloadUrl(assignmentId: string): string` returns the URL string `/api/assignments/${assignmentId}/file` for use in iframe `src` and anchor `href`.

### Action: Teacher edits file assignment metadata (UPDATE)

```
Action: Click "Save assignment" in edit mode
Method: PUT
Path: /assignments/:assignmentId
Request: { title?: string, objective?: string }
Response: 200 { data: Assignment }
```

Uses the existing `assignmentsApi.update` -- no changes needed.

### Action: Teacher deletes file assignment (DELETE)

```
Action: Confirm delete dialog
Method: DELETE
Path: /assignments/:assignmentId
Response: 204 No Content
```

Uses the existing `assignmentsApi.delete` -- no changes needed.

### Action: List assignments (already includes file data)

```
Action: LessonDetailPage mounts and fetches assignments
Method: GET
Path: /lessons/:lessonId/assignments
Response: 200 { data: Assignment[] }  (each now includes fileAssignment field)
```

Uses the existing `assignmentsApi.getAll` -- no changes needed. The response shape extension (new `fileAssignment` field) is handled by the type update.

## 7. State Management

### FileAssignmentForm state (local to AssignmentFormModal)

| State | Type | Location | Purpose |
|---|---|---|---|
| `selectedFile` | `File \| null` | `AssignmentFormModal` useState | The file chosen by the teacher via the file picker |
| `uploadProgress` | `number \| null` | `AssignmentFormModal` useState | Upload percentage (0-100) during multipart upload, null when idle |
| `fileError` | `string` | `AssignmentFormModal` useState | Client-side file validation error (too large, wrong type) |

These are passed down to `FileAssignmentForm` as props. They live in `AssignmentFormModal` because the modal controls the submission flow and needs access to the file for the multipart upload.

### FileAssignmentView state (local)

| State | Type | Location | Purpose |
|---|---|---|---|
| `textContent` | `string \| null` | `FileAssignmentView` useState | Fetched TXT file content for inline display |
| `textLoading` | `boolean` | `FileAssignmentView` useState | Whether TXT content is being fetched |
| `textError` | `string` | `FileAssignmentView` useState | Error message if TXT fetch fails |
| `iframeStatus` | `'loading' \| 'loaded' \| 'failed'` | `FileAssignmentView` useState | PDF iframe load state (same pattern as ExternalLinkAssignmentView) |

### Derived state

- `isPdf`: derived from `fileAssignment.mimeType === 'application/pdf'`
- `isTxt`: derived from `fileAssignment.mimeType === 'text/plain'`
- `isDownloadOnly`: derived from `!isPdf && !isTxt`
- `formattedSize`: derived from `fileAssignment.sizeBytes` (format as KB/MB)

## 8. Authentication and Authorization

- **Upload (POST /lessons/:lessonId/assignments/upload):** Server enforces `authorize('teacher', 'admin')` and `requireCourseOwnership()`. Client-side, the "Add" button in `AssignmentStepper` is only rendered when `canEdit` is true (via `useCanEdit()` hook). No additional client auth checks needed.
- **Download (GET /assignments/:assignmentId/file):** Server requires authentication only (no role restriction). The session cookie is sent automatically for same-origin requests (iframe src, anchor href, fetch with credentials).
- **Edit/Delete:** Same authorization pattern as other assignment types -- already handled by existing code.
- **401 handling:** For the `uploadFileAssignment` function using `XMLHttpRequest`, a 401 response must dispatch `window.CustomEvent('auth:unauthorized')` to trigger the global auth state clear (matching `apiClient` behavior).

## 9. Pseudocode for Complex Logic

### File upload submission flow (in AssignmentFormModal)

```
function handleFileSubmit():
  if selectedType !== 'file':
    // use standard handleSubmit flow
    return

  // Client-side validation
  if !assignmentTitle.trim():
    setTitleError('Title is required')
    return
  if !selectedFile:
    setFileError('Please select a file')
    return

  setSubmitting(true)
  setApiError('')

  try:
    newAssignment = await assignmentsApi.uploadFileAssignment(
      lessonId,
      { title: assignmentTitle.trim(), objective: objective.trim() || undefined },
      selectedFile,
      (progress) => setUploadProgress(progress)
    )
    // Call the parent's onCreated callback with the new assignment
    onFileCreated(newAssignment)
  catch err:
    if err instanceof ApiClientError:
      setApiError(classifyError(err))
    else:
      setApiError(err.message || 'Upload failed')
  finally:
    setSubmitting(false)
    setUploadProgress(null)
```

### uploadFileAssignment API function (using XMLHttpRequest for progress)

```
function uploadFileAssignment(
  lessonId: string,
  meta: { title: string; objective?: string },
  file: File,
  onProgress?: (percent: number) => void
): Promise<Assignment>
  return new Promise((resolve, reject) => {
    formData = new FormData()
    formData.append('file', file)
    formData.append('title', meta.title)
    if meta.objective:
      formData.append('objective', meta.objective)

    xhr = new XMLHttpRequest()
    xhr.open('POST', `/api/lessons/${lessonId}/assignments/upload`)
    xhr.withCredentials = true
    // Do NOT set Content-Type -- browser sets multipart boundary automatically

    xhr.upload.onprogress = (event) => {
      if event.lengthComputable && onProgress:
        onProgress(Math.round((event.loaded / event.total) * 100))
    }

    xhr.onload = () => {
      if xhr.status === 401:
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
        reject(new ApiClientError('UNAUTHENTICATED', 'Session expired', undefined, 'client'))
        return

      body = JSON.parse(xhr.responseText)

      if xhr.status === 201:
        resolve(body.data as Assignment)
      else:
        error = body.error
        errorClass = xhr.status >= 400 && xhr.status < 500 ? 'client' : 'server'
        reject(new ApiClientError(error.code, error.message, error.details, errorClass))
    }

    xhr.onerror = () => {
      reject(new ApiClientError('NETWORK_ERROR', 'Upload failed', undefined, 'network'))
    }

    xhr.send(formData)
  })
```

### Client-side file validation (in FileAssignmentForm)

```
ALLOWED_TYPES = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'text/plain': 'TXT',
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
}
MAX_SIZE_BYTES = 10 * 1024 * 1024  // 10 MB

function handleFileSelected(file: File):
  onErrorChange('')

  if file.type not in ALLOWED_TYPES:
    onErrorChange('File type not supported. Accepted: PDF, DOCX, TXT, PPT, PPTX')
    return

  if file.size > MAX_SIZE_BYTES:
    onErrorChange('File exceeds the 10 MB limit')
    return

  onFileChange(file)
```

### TXT content fetching (in FileAssignmentView)

```
useEffect(() => {
  if mimeType !== 'text/plain':
    return

  setTextLoading(true)
  setTextError('')

  fetch(`/api/assignments/${assignmentId}/file`, { credentials: 'include' })
    .then(res => {
      if !res.ok:
        if res.status === 401:
          window.dispatchEvent(new CustomEvent('auth:unauthorized'))
        throw new Error('Failed to load file')
      return res.text()
    })
    .then(text => {
      setTextContent(text)
    })
    .catch(err => {
      setTextError(err.message || 'Failed to load file')
    })
    .finally(() => {
      setTextLoading(false)
    })

  // No cleanup/cancellation needed -- this is a one-shot fetch
  // and the component won't re-render with a different assignmentId
  // within the same stepper step
}, [assignmentId, mimeType])
```

### PDF iframe load handling (in FileAssignmentView)

```
// Same pattern as ExternalLinkAssignmentView
const [iframeStatus, setIframeStatus] = useState<'loading' | 'loaded' | 'failed'>('loading')
const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

useEffect(() => {
  if mimeType !== 'application/pdf':
    return

  // 10-second timeout for PDF load (longer than ExternalLink's 5s since PDFs can be large)
  timeoutRef.current = setTimeout(() => {
    setIframeStatus('failed')
  }, 10000)

  return () => {
    if timeoutRef.current:
      clearTimeout(timeoutRef.current)
  }
}, [mimeType])

function handleIframeLoad():
  if timeoutRef.current:
    clearTimeout(timeoutRef.current)
  setIframeStatus('loaded')

function handleIframeError():
  if timeoutRef.current:
    clearTimeout(timeoutRef.current)
  setIframeStatus('failed')
```

### File size formatting utility (inline in FileAssignmentView and FileAssignmentForm)

```
function formatFileSize(bytes: number): string
  if bytes < 1024:
    return `${bytes} B`
  if bytes < 1024 * 1024:
    return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
```

This is a simple pure function. Define it in each component file rather than creating a shared utility, since it is only 5 lines and used in exactly two components.

## 10. Styling Notes

### FileAssignmentForm

| Element | Tailwind Classes |
|---|---|
| Container | `rounded-lg border border-border p-4 bg-surface` |
| File constraints hint | `text-xs text-muted-foreground` |
| File info name | `text-sm text-foreground font-medium` |
| File info size | `text-xs text-muted-foreground` |
| File icon | `w-5 h-5 text-accent` (lucide `FileText`) |
| Progress bar track | `h-2 w-full rounded-full bg-border` |
| Progress bar fill | `h-2 rounded-full bg-primary transition-all` (width set via inline style as percentage) |
| Upload status text | `text-xs text-muted-foreground` |
| Choose file button | `Button variant="secondary"` |
| Change file button | `Button variant="ghost" size="sm"` |
| Hidden file input | `sr-only` (visually hidden, accessible via button trigger) |

### FileAssignmentView

| Element | Tailwind Classes |
|---|---|
| File info row | `flex items-center gap-2` |
| File icon | `w-5 h-5 text-accent shrink-0` (lucide `FileText`) |
| Filename | `text-sm text-foreground font-medium` |
| File size | `text-xs text-muted-foreground` |
| Separator between name and size | `text-muted-foreground` (pipe character) |
| PDF iframe container | `relative w-full rounded-lg overflow-hidden border border-border` with `min-h-[500px]` (desktop), responsive `min-h-[300px]` below `lg` breakpoint |
| PDF iframe | `w-full border-0` with `min-h-[500px]` / `min-h-[300px]` |
| TXT content container | `whitespace-pre-wrap font-mono text-sm text-foreground p-4 bg-surface rounded-lg border border-border max-h-[500px] overflow-y-auto` with `tabindex="0"` |
| Download-only card | `rounded-lg border border-border bg-surface p-6 flex flex-col items-center gap-4 text-center` |
| Download-only message | `text-sm text-muted-foreground` |
| Download CTA button | `Button variant="primary"` (uses `bg-green-button text-green-button-text`) |
| Secondary download link (PDF/TXT) | `Button variant="ghost" size="sm"` |
| Loading overlay (PDF) | `absolute inset-0 flex items-center justify-center bg-surface` |

## 11. Edge Cases and Error Handling

### File Selection (Client-side)

| Edge Case | Handling |
|---|---|
| File exceeds 10 MB | Inline error below file input: "File exceeds the 10 MB limit". File is not set. |
| Unsupported MIME type | Inline error: "File type not supported. Accepted: PDF, DOCX, TXT, PPT, PPTX". File is not set. |
| No file selected on submit | Inline error: "Please select a file". Submit blocked. |
| User changes file after initial selection | Previous file state is replaced. Any previous validation error is cleared. |

### Upload (Server-side errors)

| Error | Code | UI Handling |
|---|---|---|
| File too large (server-side double check) | `FILE_TOO_LARGE` | `ErrorMessage` displayed in modal. Buttons re-enabled. |
| Invalid MIME type (server-side double check) | `VALIDATION_ERROR` | `ErrorMessage` displayed in modal. Buttons re-enabled. |
| S3 not configured | `S3_NOT_CONFIGURED` | `ErrorMessage`: "A server error occurred. Please try again later." (via `classifyError`) |
| S3 upload failure | `UPLOAD_FAILED` | Same as above. |
| Network error during upload | `NETWORK_ERROR` | `ErrorMessage`: "Could not connect to the server." Progress bar hidden. Buttons re-enabled. |
| 401 during upload | `UNAUTHENTICATED` | Dispatches `auth:unauthorized` event. AuthContext clears user. User is redirected to login. |

### File Viewing

| Edge Case | Handling |
|---|---|
| PDF iframe fails to load (timeout or error) | Fallback UI: message "Unable to display PDF" + prominent Download button. Uses same timeout pattern as `ExternalLinkAssignmentView` (10 seconds). |
| TXT file is empty (0 bytes) | Render message: "This file is empty." in `text-sm text-muted-foreground`. |
| TXT fetch fails | `ErrorMessage` with the error text. No retry button (user can refresh the page). |
| Download link for DOCX/PPTX fails | Browser handles download errors natively (anchor tag with `download` attribute). No custom error handling needed. |
| Session expires while viewing | If a TXT fetch returns 401, dispatch `auth:unauthorized`. PDF iframe and anchor downloads will prompt browser login or fail silently -- the global 401 handler in AuthContext handles session expiry. |

### Edit Mode

| Edge Case | Handling |
|---|---|
| Editing a file assignment | Only title and objective are editable. The file info (filename, size, type) is displayed read-only. The file cannot be replaced -- teacher must delete and re-create. This matches the api-contract constraint that PUT does not accept file replacement. |
| File assignment data is null in edit mode | Should not happen (server always includes `fileAssignment` for `type: 'file'`). If it does, display the title/objective fields only with no file info section. |

## 12. Task List (ordered implementation steps)

1. **Update types** -- Add `FileAssignmentData` interface and `'file'` to `AssignmentType` union in `src/api/types.ts`. Add `fileAssignment: FileAssignmentData | null` to the `Assignment` interface.

2. **Update API client** -- Add `uploadFileAssignment` function (XMLHttpRequest with progress) and `getFileDownloadUrl` helper to `src/api/assignments.ts`.

3. **Create FileAssignmentForm** -- Build the MetaFields sub-form component at `src/features/assignments/FileAssignmentForm.tsx` with file picker, validation, file info display, and progress bar.

4. **Update AssignmentFormModal** -- Add `file` to `TYPE_CONFIG`, add file-specific state (`selectedFile`, `uploadProgress`, `fileError`), and override submission logic for the `file` type to call `uploadFileAssignment` instead of the standard JSON `onSubmit`. Handle edit mode showing read-only file info.

5. **Create FileAssignmentView** -- Build the student-facing viewer at `src/features/assignments/FileAssignmentView.tsx` with PDF iframe, TXT text display, and DOCX/PPTX download card.

6. **Update LessonAssignmentContent** -- Add the `file` branch that renders `FileAssignmentView`.

7. **Update AssignmentStepper** -- Add `FileUp` icon and `'File'` label for the `file` assignment type.

8. **Manual testing** -- Verify all three view modes (PDF, TXT, DOCX/PPTX), upload flow with progress, client-side validation, edit mode (title/objective only), delete flow, and mobile responsiveness.
