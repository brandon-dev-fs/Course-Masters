import { useState } from 'react';
import { flashCardsApi } from '../../api/flashcards.js';
import type { FlashCard } from '../../api/types.js';
import { useAuth } from '../../context/AuthContext.js';
import useResourceList from '../../hooks/useResourceList.js';
import FlashCardComponent from './FlashCard.js';
import FlashCardStudyMode from './FlashCardStudyMode.js';
import FlashCardForm from './FlashCardForm.js';
import Modal from '../../components/Modal.js';
import ConfirmDialog from '../../components/ConfirmDialog.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import EmptyState from '../../components/EmptyState.js';

const byOrder = (a: FlashCard, b: FlashCard) => a.order - b.order;

export default function FlashCardList({ lessonId }: { lessonId: string }) {
  const { user } = useAuth();
  const canEdit = user?.role === 'teacher' || user?.role === 'admin';
  const {
    items: cards, loading, error,
    showAdd, setShowAdd, deleting, setDeleting,
    setItems: setCards, handleAdd, handleDelete,
  } = useResourceList<FlashCard, { front: string; back: string; order: number }, { front?: string; back?: string; order?: number }>(
    () => flashCardsApi.getAll(lessonId),
    { create: d => flashCardsApi.create(lessonId, d), update: flashCardsApi.update, delete: flashCardsApi.delete },
    lessonId, byOrder,
  );
  const [studying, setStudying] = useState(false);
  const [editMode, setEditMode] = useState(false);

  async function handleUpdate(id: string, data: { front?: string; back?: string }) {
    const updated = await flashCardsApi.update(id, data);
    setCards(prev => prev.map(c => (c.id === updated.id ? updated : c)).sort(byOrder));
  }

  function handleToggleEdit() {
    setEditMode(prev => !prev);
    setStudying(false);
  }

  function handleStudyMode() {
    setStudying(true);
    setEditMode(false);
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <div className="flex items-center gap-2 justify-end mb-4">
        {cards.length > 0 && (
          <>
            <Button variant="accent" size="sm" onClick={handleStudyMode}>Study Mode</Button>
            {canEdit && (
              <>
                <span className="w-px h-4 bg-border" />
                <Button size="sm" onClick={() => setShowAdd(true)}>+ Add Card</Button>
                <Button variant={editMode ? 'danger' : 'secondary'} size="sm" onClick={handleToggleEdit}>
                  {editMode ? 'Done Editing' : 'Edit Cards'}
                </Button>
              </>
            )}
          </>
        )}
        {cards.length === 0 && canEdit && (
          <Button size="sm" onClick={() => setShowAdd(true)}>+ Add Card</Button>
        )}
      </div>

      {cards.length === 0 ? (
        <EmptyState
          title="No flash cards yet"
          description={canEdit ? 'Create flash cards to study key concepts.' : 'No flash cards have been added to this lesson yet.'}
          action={canEdit ? { label: '+ Add Card', onClick: () => setShowAdd(true) } : undefined}
        />
      ) : (
        <div className={editMode ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
          {cards.map(card => (
            <FlashCardComponent
              key={card.id}
              card={card}
              editMode={canEdit && editMode}
              onUpdate={canEdit ? handleUpdate : undefined}
              onDelete={canEdit ? () => setDeleting(card) : undefined}
            />
          ))}
        </div>
      )}

      {studying && <FlashCardStudyMode cards={cards} onExit={() => setStudying(false)} />}

      {showAdd && (
        <Modal title="Add Flash Card" onClose={() => setShowAdd(false)}>
          <FlashCardForm nextOrder={cards.length + 1} onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog title="Delete Card" message="Delete this flash card?" onConfirm={handleDelete} onClose={() => setDeleting(null)} />
      )}
    </div>
  );
}
