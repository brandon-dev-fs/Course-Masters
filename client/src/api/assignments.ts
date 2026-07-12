import { apiClient, ApiClientError } from './client.js';
import type { Assignment, AssignmentCompletion, AssignmentType, PracticeQuestionType, VocabEntry } from './types.js';

// ─── Payload Types ────────────────────────────────────────────────────────────

interface BaseCreatePayload {
  title: string;
  objective?: string;
  type: AssignmentType;
}

interface NoteCreatePayload extends BaseCreatePayload {
  type: 'note';
  content: Record<string, unknown>;
}

interface VideoCreatePayload extends BaseCreatePayload {
  type: 'video';
  url: string;
}

interface ReadingCreatePayload extends BaseCreatePayload {
  type: 'reading';
  url: string;
  description?: string;
  estimatedMinutes?: number;
}

interface VocabCreatePayload extends BaseCreatePayload {
  type: 'vocab';
  entries: VocabEntry[];
}

interface PracticeQuestionInput {
  type: PracticeQuestionType;
  order: number;
  content: Record<string, unknown>;
}

interface PracticeProblemCreatePayload extends BaseCreatePayload {
  type: 'practice_problem';
  passingPercentage?: number | null;
  questions: PracticeQuestionInput[];
}

export type CreateAssignmentPayload =
  | NoteCreatePayload
  | VideoCreatePayload
  | ReadingCreatePayload
  | VocabCreatePayload
  | PracticeProblemCreatePayload;

export interface UpdateAssignmentPayload {
  title?: string;
  objective?: string;
  // note
  content?: Record<string, unknown>;
  // video / reading
  url?: string;
  // reading
  description?: string;
  estimatedMinutes?: number | null;
  // vocab
  entries?: VocabEntry[];
  // practice_problem
  passingPercentage?: number | null;
  questions?: PracticeQuestionInput[];
}

export interface ReorderPayload {
  assignmentIds: string[];
}

// ─── API Module ───────────────────────────────────────────────────────────────

function toApiBody(payload: CreateAssignmentPayload | UpdateAssignmentPayload): Record<string, unknown> {
  // No transformation needed — the payload shape already matches the API contract.
  return payload as unknown as Record<string, unknown>;
}

// ─── File Upload ──────────────────────────────────────────────────────────────

export interface FileUploadMeta {
  title: string;
  objective?: string;
}

/**
 * Uploads a file assignment using XMLHttpRequest so we can track upload progress.
 * We do NOT use apiClient here because multipart form data requires the browser
 * to set the Content-Type boundary automatically (we must not set it manually).
 */
export function uploadFileAssignment(
  lessonId: string,
  meta: FileUploadMeta,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<Assignment> {
  return new Promise<Assignment>((resolve, reject) => {
    const formData = new FormData();
    formData.append('title', meta.title);
    if (meta.objective) formData.append('objective', meta.objective);
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open('POST', `/api/lessons/${lessonId}/assignments/upload`);
    // Do NOT set Content-Type — browser sets multipart/form-data with boundary automatically

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status === 401) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        reject(new ApiClientError('UNAUTHENTICATED', 'Authentication required', undefined, 'client'));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const body = JSON.parse(xhr.responseText) as { data: Assignment };
          resolve(body.data);
        } catch {
          reject(new ApiClientError('PARSE_ERROR', 'Failed to parse server response', undefined, 'server'));
        }
        return;
      }
      // Non-2xx error
      try {
        const body = JSON.parse(xhr.responseText) as { error: { code: string; message: string; details?: Record<string, unknown> } };
        const errorClass = xhr.status >= 400 && xhr.status < 500 ? 'client' as const : 'server' as const;
        reject(new ApiClientError(body.error.code, body.error.message, body.error.details, errorClass));
      } catch {
        reject(new ApiClientError('UNKNOWN', 'Request failed', undefined, 'server'));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new ApiClientError('NETWORK_ERROR', 'Network request failed', undefined, 'network'));
    });

    xhr.send(formData);
  });
}

/**
 * Returns the URL to stream/download a file assignment.
 * The browser must include credentials (session cookie) when fetching this URL.
 */
export function getFileDownloadUrl(assignmentId: string): string {
  return `/api/assignments/${assignmentId}/file`;
}

export const assignmentsApi = {
  getAll: (lessonId: string): Promise<Assignment[]> =>
    apiClient.get<Assignment[]>(`/lessons/${lessonId}/assignments`),

  getOne: (assignmentId: string): Promise<Assignment> =>
    apiClient.get<Assignment>(`/assignments/${assignmentId}`),

  create: (lessonId: string, data: CreateAssignmentPayload): Promise<Assignment> =>
    apiClient.post<Assignment>(`/lessons/${lessonId}/assignments`, toApiBody(data)),

  update: (assignmentId: string, data: UpdateAssignmentPayload): Promise<Assignment> =>
    apiClient.put<Assignment>(`/assignments/${assignmentId}`, toApiBody(data)),

  delete: (assignmentId: string): Promise<void> =>
    apiClient.delete<void>(`/assignments/${assignmentId}`),

  reorder: (lessonId: string, data: ReorderPayload): Promise<Assignment[]> =>
    apiClient.put<Assignment[]>(`/lessons/${lessonId}/assignments/reorder`, data),

  complete: (assignmentId: string): Promise<AssignmentCompletion> =>
    apiClient.post<AssignmentCompletion>(`/assignments/${assignmentId}/complete`, {}),

  uncomplete: (assignmentId: string): Promise<void> =>
    apiClient.delete<void>(`/assignments/${assignmentId}/complete`),

  getSavedFlashCards: (lessonId: string): Promise<VocabEntry[]> =>
    apiClient.get<VocabEntry[]>(`/lessons/${lessonId}/assignments/vocab-flashcards`),

  saveFlashCard: (entryId: string): Promise<{ id: string; entryId: string; createdAt: string }> =>
    apiClient.post(`/vocab-entries/${entryId}/flashcard`, {}),

  removeFlashCard: (entryId: string): Promise<void> =>
    apiClient.delete<void>(`/vocab-entries/${entryId}/flashcard`),

};
