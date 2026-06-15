import { useRef } from 'react';
import type React from 'react';

import Button from '../../components/Button.js';
import ErrorMessage from '../../components/ErrorMessage.js';

import type { FileAssignmentData } from '../../api/types.js';

export interface FileAssignmentFormProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  uploadProgress: number | null;
  existingFile: FileAssignmentData | null;
  error: string;
  onErrorChange: (error: string) => void;
}

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileAssignmentForm({
  file,
  onFileChange,
  uploadProgress,
  existingFile,
  error,
  onErrorChange,
}: FileAssignmentFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    // Reset the input so the same file can be re-selected after a change
    if (inputRef.current) inputRef.current.value = '';

    if (!selected) return;

    if (!ALLOWED_MIME_TYPES.has(selected.type)) {
      onErrorChange('Invalid file type. Accepted: PDF, DOCX, TXT, PPT, PPTX');
      return;
    }
    if (selected.size > MAX_SIZE_BYTES) {
      onErrorChange(`File is too large. Maximum size is 10 MB (selected: ${formatFileSize(selected.size)})`);
      return;
    }

    onErrorChange('');
    onFileChange(selected);
  }

  function openFilePicker() {
    inputRef.current?.click();
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Hidden native file input — triggered programmatically */}
      <input
        ref={inputRef}
        id="file-assignment-input"
        type="file"
        accept=".pdf,.docx,.txt,.ppt,.pptx"
        onChange={handleFileSelected}
        className="sr-only"
        aria-label="Choose a file to upload"
      />

      {/* Selected new file info */}
      {file ? (
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-surface">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-medium text-text-primary truncate">{file.name}</span>
            <span className="text-xs text-text-secondary">{formatFileSize(file.size)}</span>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={openFilePicker}
          >
            Change
          </Button>
        </div>
      ) : existingFile ? (
        /* Existing file info (edit mode, read-only) */
        <div className="flex flex-col gap-0.5 p-3 rounded-lg border border-border bg-surface">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1">Current file</span>
          <span className="text-sm font-medium text-text-primary truncate">{existingFile.filename}</span>
          <span className="text-xs text-text-secondary">{formatFileSize(existingFile.sizeBytes)}</span>
        </div>
      ) : (
        /* No file yet — show picker button */
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={openFilePicker}
          >
            Choose file
          </Button>
          <p className="text-xs text-text-secondary">
            Accepted: PDF, DOCX, TXT, PPT, PPTX — max 10 MB
          </p>
        </div>
      )}

      {/* Upload progress bar */}
      {uploadProgress !== null && (
        <div className="flex flex-col gap-1">
          <div
            role="progressbar"
            aria-valuenow={uploadProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Upload progress"
            className="w-full h-2 bg-surface rounded-full overflow-hidden border border-border"
          >
            <div
              className="h-full bg-green-button rounded-full transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-text-secondary text-center">{uploadProgress}% uploaded</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <ErrorMessage variant="inline" message={error} />
      )}
    </div>
  );
}
