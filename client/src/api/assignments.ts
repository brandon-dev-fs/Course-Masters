import { apiClient } from './client.js';
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
  // displayTitle is the video's own display title — named distinctly from the shared `title`
  // to avoid a key collision in the flat request body
  displayTitle?: string;
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
  // displayTitle: video's own display title — distinct from the shared `title`
  displayTitle?: string;
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

/**
 * Maps a CreateAssignmentPayload or UpdateAssignmentPayload to the flat body
 * expected by the server. The `displayTitle` field is the video assignment's
 * own display title — named distinctly from the shared `title` to avoid a
 * key collision in the flat request body. The backend maps `displayTitle` →
 * `VideoAssignment.title`.
 */
function toApiBody(payload: CreateAssignmentPayload | UpdateAssignmentPayload): Record<string, unknown> {
  // No transformation needed — the payload shape already matches the API contract.
  return payload as unknown as Record<string, unknown>;
}

export const assignmentsApi = {
  getAll: (lessonId: string): Promise<Assignment[]> =>
    apiClient.get<Assignment[]>(`/lessons/${lessonId}/assignments`),

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
};
