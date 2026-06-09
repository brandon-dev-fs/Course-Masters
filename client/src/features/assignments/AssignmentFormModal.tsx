import { useState } from 'react';
import { FileText, Video, ExternalLink, BookMarked, Brain, ChevronLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Modal from '../../components/Modal.js';
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
import type { PracticeQuestionDraft } from './PracticeProblemAssignmentForm.js';
import type { Assignment, AssignmentType, VocabEntry } from '../../api/types.js';
import type { CreateAssignmentPayload, UpdateAssignmentPayload } from '../../api/assignments.js';
import { ApiClientError, classifyError } from '../../api/client.js';

// ─── Shared state + handler types ─────────────────────────────────────────────

export interface TypeFormState {
  noteContent: Record<string, unknown> | null;
  url: string;               // video + reading
  displayTitle: string;      // video
  description: string;       // reading
  estimatedMinutes: string;  // reading
  passingPercentage: string; // practice_problem
  entries: VocabEntry[];     // vocab
  questions: PracticeQuestionDraft[]; // practice_problem
}

export interface TypeFormHandlers {
  onNoteContentChange: (v: Record<string, unknown>) => void;
  onUrlChange: (v: string) => void;
  onDisplayTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
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
};

// ─── Empty state constant ─────────────────────────────────────────────────────

const EMPTY_TYPE_STATE: TypeFormState = {
  noteContent: null,
  url: '',
  displayTitle: '',
  description: '',
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
  onClose: () => void;
}

export default function AssignmentFormModal({ initial, onSubmit, onClose }: AssignmentFormModalProps) {
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

  // Flat type-form state — all fields initialised from initial if present
  const [typeState, setTypeState] = useState<TypeFormState>({
    noteContent: initial?.noteAssignment?.content ?? null,
    url: initial?.videoAssignment?.url ?? initial?.readingAssignment?.url ?? '',
    displayTitle: initial?.videoAssignment?.title ?? '',
    description: initial?.readingAssignment?.description ?? '',
    estimatedMinutes: String(initial?.readingAssignment?.estimatedMinutes ?? ''),
    passingPercentage: String(initial?.practiceProblemAssignment?.passingPercentage ?? ''),
    entries: initial?.vocabAssignment?.entries ?? [],
    questions: (initial?.practiceProblemAssignment?.questions ?? []).map(q => ({ ...q })),
  });

  const typeHandlers: TypeFormHandlers = {
    onNoteContentChange:       v => setTypeState(s => ({ ...s, noteContent: v })),
    onUrlChange:               v => setTypeState(s => ({ ...s, url: v })),
    onDisplayTitleChange:      v => setTypeState(s => ({ ...s, displayTitle: v })),
    onDescriptionChange:       v => setTypeState(s => ({ ...s, description: v })),
    onEstimatedMinutesChange:  v => setTypeState(s => ({ ...s, estimatedMinutes: v })),
    onPassingPercentageChange: v => setTypeState(s => ({ ...s, passingPercentage: v })),
    onEntriesChange:           v => setTypeState(s => ({ ...s, entries: v })),
    onQuestionsChange:         v => setTypeState(s => ({ ...s, questions: v })),
  };

  const subFormProps: SubFormProps = { ...typeState, ...typeHandlers };

  // Registry-driven derived state
  const config = selectedType ? TYPE_CONFIG[selectedType] : null;
  const hasItems = !!config?.ItemsForm;

  // Modal title
  const modalTitle = step === 'pick'
    ? 'Add Assignment'
    : isEdit
      ? `Edit ${config!.label}`
      : `Add ${config!.label}`;

  // Submission state
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    setTypeState(EMPTY_TYPE_STATE);
  }

  function handleAdvanceToItems() {
    if (!assignmentTitle.trim()) {
      setTitleError('Title is required');
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
      setTitleError('');

      const type = selectedType!;

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
          if (typeState.displayTitle.trim()) updatePayload.displayTitle = typeState.displayTitle.trim();
        } else if (type === 'reading') {
          if (!typeState.url.trim()) throw new Error('URL is required');
          updatePayload.url = typeState.url.trim();
          if (typeState.description.trim()) updatePayload.description = typeState.description.trim();
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
            displayTitle: typeState.displayTitle.trim() || undefined,
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
            description: typeState.description.trim() || undefined,
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
              <Input
                id="assignment-title"
                label="Title"
                value={assignmentTitle}
                onChange={e => { setAssignmentTitle(e.target.value); if (e.target.value.trim()) setTitleError(''); }}
                placeholder="e.g. Read the Introduction"
                required
              />
              {titleError && <ErrorMessage variant="inline" message={titleError} className="mt-1" />}
            </div>
            <Textarea
              id="assignment-objective"
              label="Objective (optional)"
              value={objective}
              onChange={e => setObjective(e.target.value)}
              placeholder="What should students be able to do after completing this?"
              rows={2}
            />
            {config?.MetaFields && (() => { const MetaFields = config.MetaFields!; return <MetaFields {...subFormProps} />; })()}
            {apiError && <ErrorMessage message={apiError} />}
          </div>

          {/* Fixed footer */}
          <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-border shrink-0">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            {!hasItems && (
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save assignment'}
              </Button>
            )}
            {hasItems && (
              <Button type="button" onClick={handleAdvanceToItems}>
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
            <Button type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save assignment'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
