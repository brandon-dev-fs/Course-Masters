import { lessonToolsApi } from '../../api/lesson-tools.js';
import type { LessonTool } from '../../api/types.js';
import useResourceList from '../../hooks/useResourceList.js';
import useCanEdit from '../../hooks/useCanEdit.js';
import PracticeProblemCard from './PracticeProblemCard.js';
import PracticeProblemForm from './PracticeProblemForm.js';
import Modal from '../../components/Modal.js';
import ConfirmDialog from '../../components/ConfirmDialog.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import EmptyState from '../../components/EmptyState.js';
import type { QuestionDraft } from '../assessments/QuestionEditor.js';

type ProblemCreateInput = { type: 'practice_problem'; title: string; content: Record<string, unknown>; order: number };
type ProblemUpdateInput = { content?: Record<string, unknown>; order?: number };

const byOrder = (a: LessonTool, b: LessonTool) => a.order - b.order;

export default function PracticeProblemList({ lessonId }: { lessonId: string }) {
  const canEdit = useCanEdit();
  const {
    items: problems, loading, error,
    showAdd, setShowAdd, editing, setEditing, deleting, setDeleting,
    handleAdd, handleUpdate, handleDelete,
  } = useResourceList<LessonTool, ProblemCreateInput, ProblemUpdateInput>(
    () => lessonToolsApi.getAll(lessonId, 'practice_problem'),
    {
      create: d => lessonToolsApi.create(lessonId, d),
      update: lessonToolsApi.update,
      delete: lessonToolsApi.delete,
    },
    lessonId, byOrder,
  );

  function draftToCreateInput(draft: QuestionDraft): ProblemCreateInput {
    return {
      type: 'practice_problem',
      title: draft.question.slice(0, 80),
      content: { question: draft.question, ...draft.content, calculatorEnabled: draft.calculatorEnabled ?? false },
      order: draft.order,
    };
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      {canEdit && (
        <div className="flex justify-end mb-4">
          <Button size="sm" onClick={() => setShowAdd(true)}>+ Add Problem</Button>
        </div>
      )}

      {problems.length === 0 ? (
        <EmptyState
          title="No practice problems yet"
          description={canEdit ? 'Add problems to test your understanding.' : 'No practice problems have been added to this lesson yet.'}
          action={canEdit ? { label: '+ Add Problem', onClick: () => setShowAdd(true) } : undefined}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {problems.map(prob => (
            <PracticeProblemCard
              key={prob.id}
              problem={prob}
              onEdit={canEdit ? () => setEditing(prob) : undefined}
              onDelete={canEdit ? () => setDeleting(prob) : undefined}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="Add Practice Problem" onClose={() => setShowAdd(false)}>
          <PracticeProblemForm
            nextOrder={problems.length + 1}
            onSubmit={async (draft) => handleAdd(draftToCreateInput(draft))}
            onCancel={() => setShowAdd(false)}
          />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit Practice Problem" onClose={() => setEditing(null)}>
          <PracticeProblemForm
            initial={editing}
            onSubmit={async (draft) =>
              handleUpdate({ content: { question: draft.question, ...draft.content, calculatorEnabled: draft.calculatorEnabled ?? false }, order: draft.order })
            }
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog title="Delete Problem" message="Delete this practice problem?" onConfirm={handleDelete} onClose={() => setDeleting(null)} />
      )}
    </div>
  );
}
