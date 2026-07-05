import { useState, useRef } from 'react';
import { FileText, Video, ExternalLink, BookMarked, Brain, ChevronLeft, FileUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Modal from '../../components/Modal.js';
import Tooltip from '../../components/Tooltip.js';
import Input from '../../components/Input.js';
import Textarea from '../../components/Textarea.js';
import Button from '../../components/Button.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import AssignmentTypePicker from './AssignmentTypePicker.js';
import NoteAssignmentForm from './NoteAssignmentForm.js';
import VideoAssignmentForm from './VideoAssignmentForm.js';
import ExternalLinkAssignmentForm from './ExternalLinkAssignmentForm.js';
import VocabAssignmentForm from './VocabAssignmentForm.js';
import PracticeProblemAssignmentForm from './PracticeProblemAssignmentForm.js';
import PracticeProblemMetaFields from './PracticeProblemMetaFields.js';
import FileAssignmentForm from './FileAssignmentForm.js';
import type { PracticeQuestionDraft } from './PracticeProblemAssignmentForm.js';
import type { Assignment, AssignmentType, VocabEntry } from '../../api/types.js';
import type { CreateAssignmentPayload, UpdateAssignmentPayload } from '../../api/assignments.js';
import { uploadFileAssignment } from '../../api/assignments.js';
import useYouTubeTitle from '../../hooks/useYouTubeTitle.js';
import { ApiClientError, classifyError } from '../../api/client.js';

// ─── Shared state + handler types ─────────────────────────────────────────────

export interface TypeFormState {
  noteContent: Record<string, unknown> | null;
  url: string;               // video + reading
  estimatedMinutes: string;  // reading
  passingPercentage: string; // practice_problem
  entries: VocabEntry[];     // vocab
  questions: PracticeQuestionDraft[]; // practice_problem
  // video: YouTube auto-fetch state (lifted here so title can be set on the shared field)
  fetchingVideoTitle: boolean;
  handleVideoUrlBlur: () => Promise<void>;
}

export interface TypeFormHandlers {
  onNoteContentChange: (v: Record<string, unknown>) => void;
  onUrlChange: (v: string) => void;
  onEstimatedMinutesChange: (v: string) => void;
  onPassingPercentageChange: (v: string) => void;
  onEntriesChange: (entries: VocabEntry[]) => void;
  onQuestionsChange: (questions: PracticeQuestionDraft[]) => void;
}

export type SubFormProps = TypeFormState & TypeFormHandlers;

// ─── Type registry ─────────────────────────────────────────────────────────────

interface TypeConfig {
  label: string;
  icon: LucideIcon;
  nextLabel?: string;
  MetaFields?: React.ComponentType<SubFormProps>;
  ItemsForm?: React.ComponentType<SubFormProps>;
}

export const TYPE_CONFIG: Record<AssignmentType, TypeConfig> = {
  note:             { label: 'Note',             icon: FileText,     MetaFields: NoteAssignmentForm },
  video:            { label: 'Video',             icon: Video,        MetaFields: VideoAssignmentForm },
  reading:          { label: 'External Link',      icon: ExternalLink, MetaFields: ExternalLinkAssignmentForm },
  vocab:            { label: 'Vocab',             icon: BookMarked,   nextLabel: 'Terms',
                      ItemsForm: VocabAssignmentForm },
  practice_problem: { label: 'Practice Problem',  icon: Brain,        nextLabel: 'Questions',
                      MetaFields: PracticeProblemMetaFields,
                      ItemsForm: PracticeProblemAssignmentForm },
  file:             { label: 'File',              icon: FileUp },
};

// ─── Question validity helper ─────────────────────────────────────────────────

function isQuestionValid(q: PracticeQuestionDraft): boolean {
  const content = q.content;
  switch (q.type) {
    case 'multiple_choice': {
      const questionText = (content.question as string) ?? '';
      const options = (content.options as string[]) ?? [];
      const nonEmpty = options.filter(o => o.trim().length > 0);
      const uniqueNonEmpty = new Set(nonEmpty);
      return questionText.trim().length > 0 && nonEmpty.length >= 2 && uniqueNonEmpty.size === nonEmpty.length;
    }
    case 'true_false': {
      const question = (content.question as string) ?? '';
      return question.trim().length > 0;
    }
    case 'matching': {
      const leftItems = (content.leftItems as string[]) ?? [];
      const rightItems = (content.rightItems as string[]) ?? [];
      return leftItems.some((l, i) => l.trim().length > 0 && (rightItems[i] ?? '').trim().length > 0);
    }
    case 'fill_in_blank': {
      const questionText = (content.question as string) ?? '';
      const blanks = (content.blanks as Array<{ answer: string }>) ?? [];
      const tokenCount = (questionText.match(/\{\{blank_\d+\}\}/g) ?? []).length;
      return (
        questionText.trim().length > 0 &&
        tokenCount > 0 &&
        blanks.length === tokenCount &&
        blanks.every(b => b.answer.trim().length > 0)
      );
    }
    default:
      return false;
  }
}

// ─── Empty state constant ─────────────────────────────────────────────────────

const EMPTY_TYPE_STATE: Omit<TypeFormState, 'fetchingVideoTitle' | 'handleVideoUrlBlur'> = {
  noteContent: null,
  url: '',
  estimatedMinutes: '',
  passingPercentage: '',
  entries: [],
  questions: [],
};

// ─── Component ────────────────────────────────────────────────────────────────

type ModalStep = 'pick' | 'meta' | 'items';

interface AssignmentFormModalProps {
  initial?: Assignment;
  onSubmit: (payload: CreateAssignmentPayload | UpdateAssignmentPayload) => Promise<void>;
  /**
   * Required when creating a file assignment.
   * Used to call the multipart upload route directly.
   */
  lessonId?: string;
  /**
   * Called with the newly created Assignment after a successful file upload.
   * The modal closes itself after calling this.
   */
  onFileCreate?: (assignment: Assignment) => void;
  onClose: () => void;
}

export default function AssignmentFormModal({ initial, onSubmit, lessonId, onFileCreate, onClose }: AssignmentFormModalProps) {
  const isEdit = !!initial;

  // Step state
  const [step, setStep] = useState<ModalStep>(isEdit ? 'meta' : 'pick');
  const [selectedType, setSelectedType] = useState<AssignmentType | null>(
    isEdit ? initial.type : null,
  );

  // Shared form fields
  const [assignmentTitle, setAssignmentTitle] = useState(initial?.title ?? '');
  const [objective, setObjective] = useState(initial?.objective ?? '');
  const [titleError, setTitleError] = useState('');

  // Tracks whether the user has manually typed a title — prevents YouTube auto-fetch from overwriting it
  const videoTitleTouched = useRef(isEdit);

  // Flat type-form state — all fields initialised from initial if present
  const [typeState, setTypeState] = useState<Omit<TypeFormState, 'fetchingVideoTitle' | 'handleVideoUrlBlur'>>({
    noteContent: initial?.noteAssignment?.content ?? null,
    url: initial?.videoAssignment?.url ?? initial?.readingAssignment?.url ?? '',
    estimatedMinutes: String(initial?.readingAssignment?.estimatedMinutes ?? ''),
    passingPercentage: String(initial?.practiceProblemAssignment?.passingPercentage ?? ''),
    entries: initial?.vocabAssignment?.entries ?? [],
    questions: (initial?.practiceProblemAssignment?.questions ?? []).map(q => ({ ...q })),
  });

  // YouTube title auto-fetch — populates the shared assignment title field
  const { fetchingTitle: fetchingVideoTitle, handleUrlBlur: handleVideoUrlBlur } = useYouTubeTitle({
    url: typeState.url,
    titleTouched: videoTitleTouched,
    onTitleFetched: setAssignmentTitle,
  });

  const typeHandlers: TypeFormHandlers = {
    onNoteContentChange:       v => setTypeState(s => ({ ...s, noteContent: v })),
    onUrlChange:               v => setTypeState(s => ({ ...s, url: v })),
    onEstimatedMinutesChange:  v => setTypeState(s => ({ ...s, estimatedMinutes: v })),
    onPassingPercentageChange: v => setTypeState(s => ({ ...s, passingPercentage: v })),
    onEntriesChange:           v => setTypeState(s => ({ ...s, entries: v })),
    onQuestionsChange:         v => setTypeState(s => ({ ...s, questions: v })),
  };

  const subFormProps: SubFormProps = { ...typeState, ...typeHandlers, fetchingVideoTitle, handleVideoUrlBlur };

  // Registry-driven derived state
  const config = selectedType ? TYPE_CONFIG[selectedType] : null;
  const hasItems = !!config?.ItemsForm;

  // File assignment state (create mode only — file cannot be replaced in edit mode)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [fileError, setFileError] = useState('');

  // Submission state
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Validity derived from typeState ──────────────────────────────────────────
  const titleValid = assignmentTitle.trim().length > 0 && assignmentTitle.length <= 120;
  // Disable title field for new video assignments until a URL is entered so the auto-fetch fires first
  const isTitleDisabledForVideo = selectedType === 'video' && !isEdit && !typeState.url.trim();

  const isMetaTypeValid: boolean = (() => {
    if (!selectedType) return false;
    switch (selectedType) {
      case 'note':
        return typeState.noteContent != null && JSON.stringify(typeState.noteContent).includes('"text"');
      case 'video':
        return typeState.url.trim().length > 0;
      case 'reading':
        return typeState.url.trim().length > 0;
      case 'file':
        return isEdit ? true : selectedFile !== null;
      case 'vocab':
      case 'practice_problem':
        return true;
      default:
        return true;
    }
  })();

  const isItemsValid: boolean = (() => {
    if (!selectedType) return false;
    switch (selectedType) {
      case 'vocab':
        return typeState.entries.some(e => e.term.trim() && e.definition.trim());
      case 'practice_problem':
        return typeState.questions.length > 0 && typeState.questions.every(isQuestionValid);
      default:
        return true;
    }
  })();

  const isMetaSubmitValid = titleValid && isMetaTypeValid;
  const isNextValid = titleValid;
  const isItemsSubmitValid = isItemsValid;

  // Modal title
  const modalTitle = step === 'pick'
    ? 'Add Assignment'
    : isEdit
      ? `Edit ${config!.label}`
      : `Add ${config!.label}`;

  // Navigation handlers
  function handleTypeSelected(type: AssignmentType) {
    setSelectedType(type);
    setStep('meta');
  }

  function handleBack() {
    if (step === 'items') {
      setStep('meta');
      return;
    }
    // meta in create mode — return to picker and reset all state
    setSelectedType(null);
    setStep('pick');
    setAssignmentTitle('');
    setObjective('');
    setTitleError('');
    setTypeState({ ...EMPTY_TYPE_STATE });
    videoTitleTouched.current = false;
    setSelectedFile(null);
    setUploadProgress(null);
    setFileError('');
  }

  function handleAdvanceToItems() {
    if (!assignmentTitle.trim()) {
      setTitleError('Title is required');
      return;
    }
    if (assignmentTitle.length > 120) {
      setTitleError('Title must be 120 characters or fewer');
      return;
    }
    setTitleError('');
    setStep('items');
  }

  // Form submission — called both as form onSubmit (with event) and button onClick (without event)
  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setSubmitting(true);
    setApiError('');
    try {
      if (!assignmentTitle.trim()) {
        setTitleError('Title is required');
        throw new Error('Title is required');
      }
      if (assignmentTitle.length > 120) {
        setTitleError('Title must be 120 characters or fewer');
        throw new Error('Title must be 120 characters or fewer');
      }
      setTitleError('');

      const type = selectedType!;

      // File type (create mode) — handled via multipart upload, bypasses standard onSubmit
      if (type === 'file' && !isEdit) {
        if (!selectedFile) {
          setFileError('Please select a file');
          setSubmitting(false);
          return;
        }
        if (!lessonId) throw new Error('Lesson ID is required for file upload');
        setUploadProgress(0);
        const created = await uploadFileAssignment(
          lessonId,
          { title: assignmentTitle.trim(), objective: objective.trim() || undefined },
          selectedFile,
          (pct) => setUploadProgress(pct),
        );
        setUploadProgress(null);
        // Notify parent of the created assignment via the dedicated callback
        if (onFileCreate) onFileCreate(created);
        return;
      }

      if (isEdit) {
        const updatePayload: UpdateAssignmentPayload = {
          title: assignmentTitle.trim(),
          objective: objective.trim() || undefined,
        };

        if (type === 'note') {
          if (!typeState.noteContent) throw new Error('Content is required');
          updatePayload.content = typeState.noteContent;
        } else if (type === 'video') {
          if (!typeState.url.trim()) throw new Error('URL is required');
          updatePayload.url = typeState.url.trim();
        } else if (type === 'reading') {
          if (!typeState.url.trim()) throw new Error('URL is required');
          updatePayload.url = typeState.url.trim();
          if (typeState.estimatedMinutes.trim()) {
            const mins = parseInt(typeState.estimatedMinutes, 10);
            if (isNaN(mins) || mins < 1) throw new Error('Estimated minutes must be at least 1');
            updatePayload.estimatedMinutes = mins;
          } else {
            updatePayload.estimatedMinutes = null;
          }
        } else if (type === 'vocab') {
          const validEntries = typeState.entries.filter(e => e.term.trim() && e.definition.trim());
          if (validEntries.length === 0) throw new Error('At least one term with a non-empty term and definition is required');
          updatePayload.entries = validEntries;
        } else if (type === 'practice_problem') {
          if (typeState.questions.length === 0) throw new Error('At least one question is required');
          if (typeState.passingPercentage.trim()) {
            const pp = parseInt(typeState.passingPercentage, 10);
            if (isNaN(pp) || pp < 0 || pp > 100) throw new Error('Passing percentage must be between 0 and 100');
            updatePayload.passingPercentage = pp;
          } else {
            updatePayload.passingPercentage = null;
          }
          updatePayload.questions = typeState.questions.map((q, i) => ({ type: q.type, order: i + 1, content: q.content }));
        }

        await onSubmit(updatePayload);
      } else {
        let createPayload: CreateAssignmentPayload;

        if (type === 'note') {
          if (!typeState.noteContent) throw new Error('Content is required');
          createPayload = {
            title: assignmentTitle.trim(),
            objective: objective.trim() || undefined,
            type: 'note',
            content: typeState.noteContent,
          };
        } else if (type === 'video') {
          if (!typeState.url.trim()) throw new Error('URL is required');
          createPayload = {
            title: assignmentTitle.trim(),
            objective: objective.trim() || undefined,
            type: 'video',
            url: typeState.url.trim(),
          };
        } else if (type === 'reading') {
          if (!typeState.url.trim()) throw new Error('URL is required');
          const estimatedMinutes = typeState.estimatedMinutes.trim()
            ? parseInt(typeState.estimatedMinutes, 10)
            : undefined;
          if (estimatedMinutes !== undefined && (isNaN(estimatedMinutes) || estimatedMinutes < 1)) {
            throw new Error('Estimated minutes must be at least 1');
          }
          createPayload = {
            title: assignmentTitle.trim(),
            objective: objective.trim() || undefined,
            type: 'reading',
            url: typeState.url.trim(),
            estimatedMinutes,
          };
        } else if (type === 'vocab') {
          const validEntries = typeState.entries.filter(e => e.term.trim() && e.definition.trim());
          if (validEntries.length === 0) throw new Error('At least one term with a non-empty term and definition is required');
          createPayload = {
            title: assignmentTitle.trim(),
            objective: objective.trim() || undefined,
            type: 'vocab',
            entries: validEntries,
          };
        } else {
          // practice_problem
          if (typeState.questions.length === 0) throw new Error('At least one question is required');
          let pp: number | undefined;
          if (typeState.passingPercentage.trim()) {
            pp = parseInt(typeState.passingPercentage, 10);
            if (isNaN(pp) || pp < 0 || pp > 100) throw new Error('Passing percentage must be between 0 and 100');
          }
          createPayload = {
            title: assignmentTitle.trim(),
            objective: objective.trim() || undefined,
            type: 'practice_problem',
            passingPercentage: pp,
            questions: typeState.questions.map((q, i) => ({ type: q.type, order: i + 1, content: q.content })),
          };
        }

        await onSubmit(createPayload);
      }
    } catch (err: unknown) {
      setApiError(err instanceof ApiClientError ? classifyError(err) : err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={modalTitle} onClose={onClose} size="lg">
      {step === 'pick' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">Choose the type of assignment to add.</p>
          <AssignmentTypePicker config={TYPE_CONFIG} onSelect={handleTypeSelected} />
        </div>
      )}

      {step === 'meta' && (
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          {/* Fixed header: step indicator + back/type */}
          <div className="flex flex-col gap-2 pb-3 shrink-0">
            {hasItems && (
              <span className="text-xs text-muted-foreground">1 of 2</span>
            )}
            {!isEdit && (
              <button
                type="button"
                aria-label="Back to type selection"
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors self-start"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            {isEdit && (
              <span className="text-sm text-muted-foreground capitalize">
                {selectedType!.replace('_', ' ')}
              </span>
            )}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-4 pr-1">
            <div>
              {isTitleDisabledForVideo ? (
                <Tooltip content="Title will auto-populate from YouTube once you enter a URL. You can edit it after.">
                  <Input
                    id="assignment-title"
                    label="Title"
                    value={assignmentTitle}
                    onChange={e => {
                      const val = e.target.value;
                      setAssignmentTitle(val);
                      videoTitleTouched.current = true;
                      setTitleError(val.length > 120 ? 'Title must be 120 characters or fewer' : '');
                    }}
                    placeholder="e.g. Read the Introduction"
                    required
                    disabled
                  />
                </Tooltip>
              ) : (
                <Input
                  id="assignment-title"
                  label="Title"
                  value={assignmentTitle}
                  onChange={e => {
                    const val = e.target.value;
                    setAssignmentTitle(val);
                    videoTitleTouched.current = true;
                    setTitleError(val.length > 120 ? 'Title must be 120 characters or fewer' : '');
                  }}
                  placeholder="e.g. Read the Introduction"
                  required
                />
              )}
              <div className="flex justify-between mt-1">
                {titleError
                  ? <ErrorMessage variant="inline" message={titleError} />
                  : <span />}
                <p className={`text-xs ${assignmentTitle.length > 120 ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                  {assignmentTitle.length}/120
                </p>
              </div>
            </div>
            <Textarea
              id="assignment-objective"
              label="Objective (optional)"
              value={objective}
              onChange={e => setObjective(e.target.value)}
              placeholder="What should students be able to do after completing this?"
              rows={2}
            />
            {selectedType === 'file' ? (
              <FileAssignmentForm
                file={selectedFile}
                onFileChange={setSelectedFile}
                uploadProgress={uploadProgress}
                existingFile={isEdit ? (initial?.fileAssignment ?? null) : null}
                error={fileError}
                onErrorChange={setFileError}
              />
            ) : (
              config?.MetaFields && (() => { const MetaFields = config.MetaFields!; return <MetaFields {...subFormProps} />; })()
            )}
            {apiError && <ErrorMessage message={apiError} />}
          </div>

          {/* Fixed footer */}
          <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-border shrink-0">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            {!hasItems && (
              <Button type="submit" disabled={!isMetaSubmitValid || submitting}>
                {submitting ? 'Saving...' : 'Save assignment'}
              </Button>
            )}
            {hasItems && (
              <Button type="button" onClick={handleAdvanceToItems} disabled={!isNextValid}>
                Next: {config!.nextLabel} →
              </Button>
            )}
          </div>
        </form>
      )}

      {step === 'items' && config?.ItemsForm && (
        <div className="flex flex-col min-h-0 flex-1">
          {/* Fixed header: step indicator + back */}
          <div className="flex flex-col gap-2 pb-3 shrink-0">
            <span className="text-xs text-muted-foreground">2 of 2</span>
            <button
              type="button"
              aria-label="Back to details"
              onClick={handleBack}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors self-start"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto min-h-0 pr-1">
            <config.ItemsForm {...subFormProps} />
            {apiError && <ErrorMessage message={apiError} />}
          </div>

          {/* Fixed footer */}
          <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-border shrink-0">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={!isItemsSubmitValid || submitting}>
              {submitting ? 'Saving...' : 'Save assignment'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
