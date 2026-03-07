import { useEffect, useState } from 'react';
import { notesApi } from '../../api/notes.js';
import type { Note } from '../../api/types.js';
import NoteCard from './NoteCard.js';
import NoteForm from './NoteForm.js';
import Modal from '../../components/Modal.js';
import ConfirmDialog from '../../components/ConfirmDialog.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import EmptyState from '../../components/EmptyState.js';

export default function NoteList({ lessonId }: { lessonId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [deleting, setDeleting] = useState<Note | null>(null);

  useEffect(() => {
    notesApi.getAll(lessonId)
      .then(setNotes)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load notes'))
      .finally(() => setLoading(false));
  }, [lessonId]);

  async function handleAdd(data: { content: string; order: number }) {
    const note = await notesApi.create(lessonId, data);
    setNotes(prev => [...prev, note].sort((a, b) => a.order - b.order));
    setShowAdd(false);
  }

  async function handleUpdate(data: { content: string; order: number }) {
    if (!editing) return;
    const updated = await notesApi.update(editing.id, data);
    setNotes(prev => prev.map(n => n.id === updated.id ? updated : n).sort((a, b) => a.order - b.order));
    setEditing(null);
  }

  async function handleDelete() {
    if (!deleting) return;
    await notesApi.delete(deleting.id);
    setNotes(prev => prev.filter(n => n.id !== deleting.id));
    setDeleting(null);
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setShowAdd(true)}>+ Add Note</Button>
      </div>

      {notes.length === 0 ? (
        <EmptyState title="No notes yet" description="Add notes to capture key concepts." action={{ label: '+ Add Note', onClick: () => setShowAdd(true) }} />
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map(note => (
            <NoteCard key={note.id} note={note} onEdit={() => setEditing(note)} onDelete={() => setDeleting(note)} />
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
