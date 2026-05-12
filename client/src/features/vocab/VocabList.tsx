import { lessonToolsApi } from '../../api/lesson-tools.js';
import type { LessonTool } from '../../api/types.js';
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

type VocabCreateInput = { type: 'vocab'; title: string; content: { term: string; definition: string }; order: number };
type VocabUpdateInput = { content?: { term: string; definition: string }; order?: number };

const byOrder = (a: LessonTool, b: LessonTool) => a.order - b.order;

export default function VocabList({ lessonId }: { lessonId: string }) {
  const canEdit = useCanEdit();
  const {
    items: vocabs, loading, error,
    showAdd, setShowAdd, editing, setEditing, deleting, setDeleting,
    handleAdd, handleUpdate, handleDelete,
  } = useResourceList<LessonTool, VocabCreateInput, VocabUpdateInput>(
    () => lessonToolsApi.getAll(lessonId, 'vocab'),
    {
      create: d => lessonToolsApi.create(lessonId, d),
      update: lessonToolsApi.update,
      delete: lessonToolsApi.delete,
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

      {vocabs.length === 0 ? (
        <EmptyState
          title="No vocabulary yet"
          description={canEdit ? 'Add key terms and definitions for this lesson.' : 'No vocabulary terms have been added to this lesson yet.'}
          action={canEdit ? { label: '+ Add Term', onClick: () => setShowAdd(true) } : undefined}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {vocabs.map(vocab => (
            <VocabCard
              key={vocab.id}
              vocab={vocab}
              onEdit={canEdit ? () => setEditing(vocab) : undefined}
              onDelete={canEdit ? () => setDeleting(vocab) : undefined}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="Add Vocabulary Term" onClose={() => setShowAdd(false)}>
          <VocabForm
            nextOrder={vocabs.length + 1}
            onSubmit={async ({ term, definition, order }) =>
              handleAdd({ type: 'vocab', title: term, content: { term, definition }, order })
            }
            onCancel={() => setShowAdd(false)}
          />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit Vocabulary Term" onClose={() => setEditing(null)}>
          <VocabForm
            initial={editing}
            onSubmit={async ({ term, definition, order }) =>
              handleUpdate({ content: { term, definition }, order })
            }
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete Term"
          message={`Delete "${deleting.type === 'vocab' ? (deleting.content.term ?? deleting.title) : deleting.title}"?`}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
