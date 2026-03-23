import { vocabApi } from '../../api/vocab.js';
import type { Vocab } from '../../api/types.js';
import { useAuth } from '../../context/AuthContext.js';
import useResourceList from '../../hooks/useResourceList.js';
import VocabCard from './VocabCard.js';
import VocabForm from './VocabForm.js';
import Modal from '../../components/Modal.js';
import ConfirmDialog from '../../components/ConfirmDialog.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import EmptyState from '../../components/EmptyState.js';

const byOrder = (a: Vocab, b: Vocab) => a.order - b.order;

export default function VocabList({ lessonId }: { lessonId: string }) {
  const { user } = useAuth();
  const canEdit = user?.role === 'teacher' || user?.role === 'admin';
  const {
    items: vocabs, loading, error,
    showAdd, setShowAdd, editing, setEditing, deleting, setDeleting,
    handleAdd, handleUpdate, handleDelete,
  } = useResourceList<Vocab, { term: string; definition: string; order: number }, { term?: string; definition?: string; order?: number }>(
    () => vocabApi.getAll(lessonId),
    { create: d => vocabApi.create(lessonId, d), update: vocabApi.update, delete: vocabApi.delete },
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
          <VocabForm nextOrder={vocabs.length + 1} onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit Vocabulary Term" onClose={() => setEditing(null)}>
          <VocabForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog title="Delete Term" message={`Delete "${deleting.term}"?`} onConfirm={handleDelete} onClose={() => setDeleting(null)} />
      )}
    </div>
  );
}
