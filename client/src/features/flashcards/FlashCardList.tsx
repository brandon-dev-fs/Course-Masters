import { useEffect, useState } from 'react';
import { flashCardsApi } from '../../api/flashcards.js';
import type { FlashCard } from '../../api/types.js';
import FlashCardComponent from './FlashCard.js';
import FlashCardStudyMode from './FlashCardStudyMode.js';
import FlashCardForm from './FlashCardForm.js';
import Modal from '../../components/Modal.js';
import ConfirmDialog from '../../components/ConfirmDialog.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import EmptyState from '../../components/EmptyState.js';

export default function FlashCardList({ lessonId }: { lessonId: string }) {
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<FlashCard | null>(null);
  const [deleting, setDeleting] = useState<FlashCard | null>(null);
  const [studying, setStudying] = useState(false);

  useEffect(() => {
    flashCardsApi.getAll(lessonId)
      .then(setCards)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load flash cards'))
      .finally(() => setLoading(false));
  }, [lessonId]);

  async function handleAdd(data: { front: string; back: string; order: number }) {
    const card = await flashCardsApi.create(lessonId, data);
    setCards(prev => [...prev, card].sort((a, b) => a.order - b.order));
    setShowAdd(false);
  }

  async function handleUpdate(data: { front: string; back: string; order: number }) {
    if (!editing) return;
    const updated = await flashCardsApi.update(editing.id, data);
    setCards(prev => prev.map(c => c.id === updated.id ? updated : c).sort((a, b) => a.order - b.order));
    setEditing(null);
  }

  async function handleDelete() {
    if (!deleting) return;
    await flashCardsApi.delete(deleting.id);
    setCards(prev => prev.filter(c => c.id !== deleting.id));
    setDeleting(null);
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <div className="flex gap-2 justify-end mb-4">
        {cards.length > 0 && (
          <Button variant="secondary" size="sm" onClick={() => setStudying(true)}>Study Mode</Button>
        )}
        <Button size="sm" onClick={() => setShowAdd(true)}>+ Add Card</Button>
      </div>

      {cards.length === 0 ? (
        <EmptyState title="No flash cards yet" description="Create flash cards to study key concepts." action={{ label: '+ Add Card', onClick: () => setShowAdd(true) }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map(card => (
            <FlashCardComponent key={card.id} card={card} onEdit={() => setEditing(card)} onDelete={() => setDeleting(card)} />
          ))}
        </div>
      )}

      {studying && <FlashCardStudyMode cards={cards} onExit={() => setStudying(false)} />}

      {showAdd && (
        <Modal title="Add Flash Card" onClose={() => setShowAdd(false)}>
          <FlashCardForm nextOrder={cards.length + 1} onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit Flash Card" onClose={() => setEditing(null)}>
          <FlashCardForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog title="Delete Card" message="Delete this flash card?" onConfirm={handleDelete} onClose={() => setDeleting(null)} />
      )}
    </div>
  );
}
