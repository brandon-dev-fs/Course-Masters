import { useState } from 'react';

import { lessonToolsApi } from '../../api/lesson-tools.js';
import type { LessonTool, StudyCard } from '../../api/types.js';
import useResourceList from '../../hooks/useResourceList.js';
import useCanEdit from '../../hooks/useCanEdit.js';
import FlashCardComponent from './FlashCard.js';
import FlashCardStudyMode from './FlashCardStudyMode.js';
import FlashCardForm from './FlashCardForm.js';
import Modal from '../../components/Modal.js';
import ConfirmDialog from '../../components/ConfirmDialog.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import EmptyState from '../../components/EmptyState.js';

type CardCreateInput = { type: 'flash_card'; title: string; content: { front: string; back: string }; order: number };
type CardUpdateInput = { content?: { front: string; back: string }; order?: number };

const byOrder = (a: LessonTool, b: LessonTool) => a.order - b.order;

export default function FlashCardList({ lessonId }: { lessonId: string }) {
  const canEdit = useCanEdit();
  const {
    items: cards, loading, error,
    showAdd, setShowAdd, deleting, setDeleting,
    setItems: setCards, handleAdd, handleDelete,
  } = useResourceList<LessonTool, CardCreateInput, CardUpdateInput>(
    () => lessonToolsApi.getAll(lessonId, 'flash_card'),
    {
      create: d => lessonToolsApi.create(lessonId, d),
      update: lessonToolsApi.update,
      delete: lessonToolsApi.delete,
    },
    lessonId, byOrder,
  );
  const [studying, setStudying] = useState(false);
  const [studyCards, setStudyCards] = useState<StudyCard[]>([]);
  const [editMode, setEditMode] = useState(false);

  async function handleUpdate(id: string, data: { front: string; back: string }) {
    const updated = await lessonToolsApi.update(id, { content: data });
    setCards(prev => prev.map(c => (c.id === updated.id ? updated : c)).sort(byOrder));
  }

  function handleToggleEdit() {
    setEditMode(prev => !prev);
    setStudying(false);
  }

  function handleStudyMode() {
    const teacherCards: StudyCard[] = cards
      .filter((c): c is LessonTool & { type: 'flash_card' } => c.type === 'flash_card')
      .map(c => ({ id: c.id, front: c.content.front, back: c.content.back }));

    setStudyCards(teacherCards);
    setStudying(true);
    setEditMode(false);
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <div className="flex items-center gap-2 justify-end mb-4">
        {cards.length > 0 && (
          <Button variant="accent" size="sm" onClick={handleStudyMode}>Study Mode</Button>
        )}
        {cards.length > 0 && canEdit && (
          <>
            <span className="w-px h-4 bg-border" />
            <Button size="sm" onClick={() => setShowAdd(true)}>+ Add Card</Button>
            <Button variant={editMode ? 'danger' : 'secondary'} size="sm" onClick={handleToggleEdit}>
              {editMode ? 'Done Editing' : 'Edit Cards'}
            </Button>
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

      {studying && <FlashCardStudyMode cards={studyCards} onExit={() => setStudying(false)} />}

      {showAdd && (
        <Modal title="Add Flash Card" onClose={() => setShowAdd(false)}>
          <FlashCardForm
            nextOrder={cards.length + 1}
            onSubmit={async ({ front, back, order }) =>
              handleAdd({ type: 'flash_card', title: front.slice(0, 60), content: { front, back }, order })
            }
            onCancel={() => setShowAdd(false)}
          />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog title="Delete Card" message="Delete this flash card?" onConfirm={handleDelete} onClose={() => setDeleting(null)} />
      )}
    </div>
  );
}
