import { notesApi } from '../../api/notes.js';
import type { Note } from '../../api/types.js';
import { useAuth } from '../../context/AuthContext.js';
import useResourceList from '../../hooks/useResourceList.js';
import NoteCard from './NoteCard.js';
import NoteForm from './NoteForm.js';
import Modal from '../../components/Modal.js';
import ConfirmDialog from '../../components/ConfirmDialog.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import EmptyState from '../../components/EmptyState.js';

const byOrder = (a: Note, b: Note) => a.order - b.order;

export default function NoteList({ lessonId }: { lessonId: string }) {
  const { user } = useAuth();
  const canEdit = user?.role === 'teacher' || user?.role === 'admin';
  const {
    items: notes, loading, error,
    showAdd, setShowAdd, editing, setEditing, deleting, setDeleting,
    handleAdd, handleUpdate, handleDelete,
  } = useResourceList<Note, { content: string; order: number }, { content?: string; order?: number }>(
    () => notesApi.getAll(lessonId),
    { create: d => notesApi.create(lessonId, d), update: notesApi.update, delete: notesApi.delete },
    lessonId, byOrder,
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      {canEdit && (
        <div className="flex justify-end mb-4">
          <Button size="sm" onClick={() => setShowAdd(true)}>+ Add Note</Button>
        </div>
      )}

      {notes.length === 0 ? (
        <EmptyState
          title="No notes yet"
          description={canEdit ? 'Add notes to capture key concepts.' : 'No lecture notes have been added to this lesson yet.'}
          action={canEdit ? { label: '+ Add Note', onClick: () => setShowAdd(true) } : undefined}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={canEdit ? () => setEditing(note) : undefined}
              onDelete={canEdit ? () => setDeleting(note) : undefined}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="Add Note" onClose={() => setShowAdd(false)}>
          <NoteForm nextOrder={notes.length + 1} onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit Note" onClose={() => setEditing(null)}>
          <NoteForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog title="Delete Note" message="Delete this note?" onConfirm={handleDelete} onClose={() => setDeleting(null)} />
      )}
    </div>
  );
}
