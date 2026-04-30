import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import Modal from '../../components/Modal.js';
import Input from '../../components/Input.js';
import Textarea from '../../components/Textarea.js';
import Button from '../../components/Button.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import AssignmentTypePicker from './AssignmentTypePicker.js';
import NoteAssignmentForm from './NoteAssignmentForm.js';
import VideoAssignmentForm from './VideoAssignmentForm.js';
import ReadingAssignmentForm from './ReadingAssignmentForm.js';
import VocabAssignmentForm from './VocabAssignmentForm.js';
import PracticeProblemAssignmentForm from './PracticeProblemAssignmentForm.js';
import type { PracticeQuestionDraft } from './PracticeProblemAssignmentForm.js';
import type { Assignment, AssignmentType, VocabEntry } from '../../api/types.js';
import type { CreateAssignmentPayload, UpdateAssignmentPayload } from '../../api/assignments.js';
import useFormSubmit from '../../hooks/useFormSubmit.js';

interface AssignmentFormModalProps {
  initial?: Assignment;
  onSubmit: (payload: CreateAssignmentPayload | UpdateAssignmentPayload) => Promise<void>;
  onClose: () => void;
}

const TYPE_LABELS: Record<AssignmentType, string> = {
  note: 'Note',
  video: 'Video',
  reading: 'Reading',
  vocab: 'Vocab',
  practice_problem: 'Practice Problem',
};

function getInitialVocabEntries(initial?: Assignment): VocabEntry[] {
  if (initial?.vocabAssignment) return initial.vocabAssignment.entries;
  return [{ term: '', definition: '' }];
}

function getInitialQuestions(initial?: Assignment): PracticeQuestionDraft[] {
  if (initial?.practiceProblemAssignment?.questions) {
    return initial.practiceProblemAssignment.questions.map(q => ({
      id: q.id,
      type: q.type,
      order: q.order,
      content: q.content,
    }));
  }
  return [];
}

export default function AssignmentFormModal({ initial, onSubmit, onClose }: AssignmentFormModalProps) {
  const isEdit = !!initial;

  // Two-step state (only relevant in create mode)
  const [step, setStep] = useState<'pick' | 'form'>(isEdit ? 'form' : 'pick');
  const [selectedType, setSelectedType] = useState<AssignmentType | null>(
    isEdit ? initial.type : null,
  );

  // Shared form fields
  const [assignmentTitle, setAssignmentTitle] = useState(initial?.title ?? '');
  const [objective, setObjective] = useState(initial?.objective ?? '');
  const [titleError, setTitleError] = useState('');

  // Note fields
  const [noteContent, setNoteContent] = useState<Record<string, unknown> | null>(
    initial?.noteAssignment?.content ?? null,
  );

  // Video fields
  const [videoUrl, setVideoUrl] = useState(initial?.videoAssignment?.url ?? '');
  const [displayTitle, setDisplayTitle] = useState(initial?.videoAssignment?.title ?? '');

  // Reading fields
  const [readingUrl, setReadingUrl] = useState(initial?.readingAssignment?.url ?? '');
  const [readingDescription, setReadingDescription] = useState(
    initial?.readingAssignment?.description ?? '',
  );
  const [readingMinutes, setReadingMinutes] = useState(
    initial?.readingAssignment?.estimatedMinutes != null
      ? String(initial.readingAssignment.estimatedMinutes)
      : '',
  );

  // Vocab fields
  const [vocabEntries, setVocabEntries] = useState<VocabEntry[]>(getInitialVocabEntries(initial));

  // Practice problem fields
  const [passingPercentage, setPassingPercentage] = useState(
    initial?.practiceProblemAssignment?.passingPercentage != null
      ? String(initial.practiceProblemAssignment.passingPercentage)
      : '',
  );
  const [questions, setQuestions] = useState<PracticeQuestionDraft[]>(getInitialQuestions(initial));

  function handleTypeSelected(type: AssignmentType) {
    setSelectedType(type);
    setStep('form');
  }

  function handleBack() {
    setSelectedType(null);
    setStep('pick');
    // Reset all form field state
    setAssignmentTitle('');
    setObjective('');
    setTitleError('');
    setNoteContent(null);
    setVideoUrl('');
    setDisplayTitle('');
    setReadingUrl('');
    setReadingDescription('');
    setReadingMinutes('');
    setVocabEntries([{ term: '', definition: '' }]);
    setPassingPercentage('');
    setQuestions([]);
  }

  const modalTitle = step === 'pick'
    ? 'Add Assignment'
    : isEdit
      ? `Edit ${TYPE_LABELS[selectedType!]}`
      : `Add ${TYPE_LABELS[selectedType!]}`;

  const { error: apiError, submitting, handleSubmit } = useFormSubmit(async () => {
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
        if (!noteContent) throw new Error('Content is required');
        updatePayload.content = noteContent;
      } else if (type === 'video') {
        if (!videoUrl.trim()) throw new Error('URL is required');
        updatePayload.url = videoUrl.trim();
        if (displayTitle.trim()) updatePayload.videoTitle = displayTitle.trim();
      } else if (type === 'reading') {
        if (!readingUrl.trim()) throw new Error('URL is required');
        updatePayload.url = readingUrl.trim();
        if (readingDescription.trim()) updatePayload.description = readingDescription.trim();
        if (readingMinutes.trim()) {
          const mins = parseInt(readingMinutes, 10);
          if (isNaN(mins) || mins < 1) throw new Error('Estimated minutes must be at least 1');
          updatePayload.estimatedMinutes = mins;
        } else {
          updatePayload.estimatedMinutes = null;
        }
      } else if (type === 'vocab') {
        const validEntries = vocabEntries.filter(e => e.term.trim() && e.definition.trim());
        if (validEntries.length === 0) throw new Error('At least one term with a non-empty term and definition is required');
        updatePayload.entries = validEntries;
      } else if (type === 'practice_problem') {
        if (questions.length === 0) throw new Error('At least one question is required');
        if (passingPercentage.trim()) {
          const pp = parseInt(passingPercentage, 10);
          if (isNaN(pp) || pp < 0 || pp > 100) throw new Error('Passing percentage must be between 0 and 100');
          updatePayload.passingPercentage = pp;
        } else {
          updatePayload.passingPercentage = null;
        }
        updatePayload.questions = questions.map((q, i) => ({ type: q.type, order: i + 1, content: q.content }));
      }

      await onSubmit(updatePayload);
    } else {
      let createPayload: CreateAssignmentPayload;

      if (type === 'note') {
        if (!noteContent) throw new Error('Content is required');
        createPayload = {
          title: assignmentTitle.trim(),
          objective: objective.trim() || undefined,
          type: 'note',
          content: noteContent,
        };
      } else if (type === 'video') {
        if (!videoUrl.trim()) throw new Error('URL is required');
        createPayload = {
          title: assignmentTitle.trim(),
          objective: objective.trim() || undefined,
          type: 'video',
          url: videoUrl.trim(),
          videoTitle: displayTitle.trim() || undefined,
        };
      } else if (type === 'reading') {
        if (!readingUrl.trim()) throw new Error('URL is required');
        const estimatedMinutes = readingMinutes.trim()
          ? parseInt(readingMinutes, 10)
          : undefined;
        if (estimatedMinutes !== undefined && (isNaN(estimatedMinutes) || estimatedMinutes < 1)) {
          throw new Error('Estimated minutes must be at least 1');
        }
        createPayload = {
          title: assignmentTitle.trim(),
          objective: objective.trim() || undefined,
          type: 'reading',
          url: readingUrl.trim(),
          description: readingDescription.trim() || undefined,
          estimatedMinutes,
        };
      } else if (type === 'vocab') {
        const validEntries = vocabEntries.filter(e => e.term.trim() && e.definition.trim());
        if (validEntries.length === 0) throw new Error('At least one term with a non-empty term and definition is required');
        createPayload = {
          title: assignmentTitle.trim(),
          objective: objective.trim() || undefined,
          type: 'vocab',
          entries: validEntries,
        };
      } else {
        // practice_problem
        if (questions.length === 0) throw new Error('At least one question is required');
        let pp: number | undefined;
        if (passingPercentage.trim()) {
          pp = parseInt(passingPercentage, 10);
          if (isNaN(pp) || pp < 0 || pp > 100) throw new Error('Passing percentage must be between 0 and 100');
        }
        createPayload = {
          title: assignmentTitle.trim(),
          objective: objective.trim() || undefined,
          type: 'practice_problem',
          passingPercentage: pp,
          questions: questions.map((q, i) => ({ type: q.type, order: i + 1, content: q.content })),
        };
      }

      await onSubmit(createPayload);
    }
  });

  return (
    <Modal title={modalTitle} onClose={onClose} size="lg">
      {step === 'pick' ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">Choose the type of assignment to add.</p>
          <AssignmentTypePicker onSelect={handleTypeSelected} />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto flex-1">
          {/* Back button — create mode only */}
          {!isEdit && (
            <button
              type="button"
              aria-label="Back to type selection"
              onClick={handleBack}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 self-start"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}

          {/* Type read-only in edit mode */}
          {isEdit && (
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-foreground">Type</span>
              <span className="text-sm text-muted-foreground capitalize">
                {selectedType!.replace('_', ' ')}
              </span>
            </div>
          )}

          {/* Shared fields */}
          <div>
            <Input
              id="assignment-title"
              label="Title"
              value={assignmentTitle}
              onChange={e => { setAssignmentTitle(e.target.value); if (e.target.value.trim()) setTitleError(''); }}
              placeholder="e.g. Read the Introduction"
              required
            />
            {titleError && <p role="alert" className="text-sm text-destructive mt-1">{titleError}</p>}
          </div>

          <Textarea
            id="assignment-objective"
            label="Objective (optional)"
            value={objective}
            onChange={e => setObjective(e.target.value)}
            placeholder="What should students be able to do after completing this?"
            rows={2}
          />

          {/* Type-specific sub-form */}
          {selectedType === 'note' && (
            <NoteAssignmentForm value={noteContent} onChange={setNoteContent} />
          )}
          {selectedType === 'video' && (
            <VideoAssignmentForm
              url={videoUrl}
              displayTitle={displayTitle}
              onUrlChange={setVideoUrl}
              onDisplayTitleChange={setDisplayTitle}
            />
          )}
          {selectedType === 'reading' && (
            <ReadingAssignmentForm
              url={readingUrl}
              description={readingDescription}
              estimatedMinutes={readingMinutes}
              onUrlChange={setReadingUrl}
              onDescriptionChange={setReadingDescription}
              onEstimatedMinutesChange={setReadingMinutes}
            />
          )}
          {selectedType === 'vocab' && (
            <VocabAssignmentForm entries={vocabEntries} onChange={setVocabEntries} />
          )}
          {selectedType === 'practice_problem' && (
            <PracticeProblemAssignmentForm
              passingPercentage={passingPercentage}
              questions={questions}
              onPassingPercentageChange={setPassingPercentage}
              onQuestionsChange={setQuestions}
            />
          )}

          {apiError && <ErrorMessage message={apiError} />}

          <div className="flex justify-end gap-3 pt-2 shrink-0">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save assignment'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
