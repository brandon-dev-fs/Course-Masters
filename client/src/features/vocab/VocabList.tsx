import { assignmentsApi } from '../../api/assignments.js';
import type { Assignment } from '../../api/types.js';
import type { CreateAssignmentPayload, UpdateAssignmentPayload } from '../../api/assignments.js';
import useResourceList from '../../hooks/useResourceList.js';
import useCanEdit from '../../hooks/useCanEdit.js';
import VocabCard from './VocabCard.js';
import VocabForm from './VocabForm.js';
import Modal from '../../components/Modal.js';
import ConfirmDialog from '../../components/ConfirmDialog.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import EmptyState from '../../components/EmptyState.js';

const byOrder = (a: Assignment, b: Assignment) => a.order - b.order;

export default function VocabList({ lessonId }: { lessonId: string }) {
  const canEdit = useCanEdit();

  const {
    items: vocabAssignments, loading, error,
    showAdd, setShowAdd, editing, setEditing, deleting, setDeleting,
    handleAdd, handleUpdate, handleDelete,
  } = useResourceList<Assignment, CreateAssignmentPayload, UpdateAssignmentPayload>(
    () => assignmentsApi.getAll(lessonId).then(list => list.filter(a => a.type === 'vocab')),
    {
      create: d => assignmentsApi.create(lessonId, d),
      update: assignmentsApi.update,
      delete: assignmentsApi.delete,
    },
    lessonId, byOrder,
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      {canEdit && (
        <div className="flex justify-end mb-4">
          <Button size="sm" onClick={() => setShowAdd(true)}>+ Add Term</Button>
        </div>
      )}

      {vocabAssignments.length === 0 ? (
        <EmptyState
          title="No vocabulary yet"
          description={canEdit ? 'Add key terms and definitions for this lesson.' : 'No vocabulary terms have been added to this lesson yet.'}
          action={canEdit ? { label: '+ Add Term', onClick: () => setShowAdd(true) } : undefined}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {vocabAssignments.map(vocab => {
            const firstEntry = vocab.vocabAssignment?.entries[0];
            return (
              <VocabCard
                key={vocab.id}
                vocab={{
                  term: firstEntry?.term ?? vocab.title,
                  definition: firstEntry?.definition ?? '',
                  example: firstEntry?.example,
                }}
                onEdit={canEdit ? () => setEditing(vocab) : undefined}
                onDelete={canEdit ? () => setDeleting(vocab) : undefined}
              />
            );
          })}
        </div>
      )}

      {showAdd && (
        <Modal title="Add Vocabulary Term" onClose={() => setShowAdd(false)}>
          <VocabForm
            nextOrder={vocabAssignments.length + 1}
            onSubmit={async ({ term, definition, example }) =>
              handleAdd({ title: term, type: 'vocab', entries: [{ term, definition, example }] })
            }
            onCancel={() => setShowAdd(false)}
          />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit Vocabulary Term" onClose={() => setEditing(null)}>
          <VocabForm
            initial={{
              id: editing.id,
              type: 'vocab',
              content: {
                term: editing.vocabAssignment?.entries[0]?.term,
                definition: editing.vocabAssignment?.entries[0]?.definition,
                example: editing.vocabAssignment?.entries[0]?.example,
              },
              order: editing.order,
            }}
            onSubmit={async ({ term, definition, example }) =>
              handleUpdate({ entries: [{ term, definition, example }] })
            }
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete Term"
          message={`Delete "${deleting.vocabAssignment?.entries[0]?.term ?? deleting.title}"?`}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
