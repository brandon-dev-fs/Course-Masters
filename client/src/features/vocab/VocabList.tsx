import { useEffect, useState } from 'react';
import { vocabApi } from '../../api/vocab.js';
import type { Vocab } from '../../api/types.js';
import VocabCard from './VocabCard.js';
import VocabForm from './VocabForm.js';
import Modal from '../../components/Modal.js';
import ConfirmDialog from '../../components/ConfirmDialog.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import EmptyState from '../../components/EmptyState.js';

export default function VocabList({ lessonId }: { lessonId: string }) {
  const [vocabs, setVocabs] = useState<Vocab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Vocab | null>(null);
  const [deleting, setDeleting] = useState<Vocab | null>(null);

  useEffect(() => {
    vocabApi.getAll(lessonId)
      .then(setVocabs)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load vocabulary'))
      .finally(() => setLoading(false));
  }, [lessonId]);

  async function handleAdd(data: { term: string; definition: string; order: number }) {
    const vocab = await vocabApi.create(lessonId, data);
    setVocabs(prev => [...prev, vocab].sort((a, b) => a.order - b.order));
    setShowAdd(false);
  }

  async function handleUpdate(data: { term: string; definition: string; order: number }) {
    if (!editing) return;
    const updated = await vocabApi.update(editing.id, data);
    setVocabs(prev => prev.map(v => v.id === updated.id ? updated : v).sort((a, b) => a.order - b.order));
    setEditing(null);
  }

  async function handleDelete() {
    if (!deleting) return;
    await vocabApi.delete(deleting.id);
    setVocabs(prev => prev.filter(v => v.id !== deleting.id));
    setDeleting(null);
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setShowAdd(true)}>+ Add Term</Button>
      </div>

      {vocabs.length === 0 ? (
        <EmptyState title="No vocabulary yet" description="Add key terms and definitions for this lesson." action={{ label: '+ Add Term', onClick: () => setShowAdd(true) }} />
      ) : (
        <div className="flex flex-col gap-3">
          {vocabs.map(vocab => (
            <VocabCard key={vocab.id} vocab={vocab} onEdit={() => setEditing(vocab)} onDelete={() => setDeleting(vocab)} />
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
