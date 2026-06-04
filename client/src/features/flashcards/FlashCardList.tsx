import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

import { lessonToolsApi } from '../../api/lesson-tools.js';
import { assignmentsApi } from '../../api/assignments.js';
import type { LessonTool, StudyCard, VocabEntry } from '../../api/types.js';
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

  const [savedVocabEntries, setSavedVocabEntries] = useState<VocabEntry[]>([]);

  // Initial fetch of saved vocab entries for students
  useEffect(() => {
    if (canEdit) return;
    let cancelled = false;
    assignmentsApi.getSavedVocabEntryFlashCards(lessonId).then(entries => {
      if (!cancelled) setSavedVocabEntries(entries.filter(e => !!e.id));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [lessonId, canEdit]);

  // Sync when VocabAssignmentView adds or removes an entry
  useEffect(() => {
    if (canEdit) return;

    function onSaved(e: Event) {
      const { entry } = (e as CustomEvent<{ entry: VocabEntry }>).detail;
      if (!entry.id) return;
      setSavedVocabEntries(prev =>
        prev.some(v => v.id === entry.id) ? prev : [...prev, entry],
      );
    }

    function onRemoved(e: Event) {
      const { entryId } = (e as CustomEvent<{ entryId: string }>).detail;
      setSavedVocabEntries(prev => prev.filter(v => v.id !== entryId));
    }

    window.addEventListener('vocabflashcard:saved', onSaved);
    window.addEventListener('vocabflashcard:removed', onRemoved);
    return () => {
      window.removeEventListener('vocabflashcard:saved', onSaved);
      window.removeEventListener('vocabflashcard:removed', onRemoved);
    };
  }, [canEdit]);

  async function handleUpdate(id: string, data: { front: string; back: string }) {
    const updated = await lessonToolsApi.update(id, { content: data });
    setCards(prev => prev.map(c => (c.id === updated.id ? updated : c)).sort(byOrder));
  }

  function handleToggleEdit() {
    setEditMode(prev => !prev);
    setStudying(false);
  }

  async function handleRemoveVocabEntry(entryId: string) {
    const entry = savedVocabEntries.find(e => e.id === entryId);

    // Optimistic update — remove immediately
    setSavedVocabEntries(prev => prev.filter(e => e.id !== entryId));
    window.dispatchEvent(new CustomEvent('vocabflashcard:removed', { detail: { entryId } }));

    try {
      await assignmentsApi.removeVocabEntryFlashCard(entryId);
    } catch {
      // Revert
      if (entry) {
        setSavedVocabEntries(prev => [...prev, entry]);
        window.dispatchEvent(new CustomEvent('vocabflashcard:saved', { detail: { entry } }));
      }
    }
  }

  async function handleStudyMode() {
    const teacherCards: StudyCard[] = cards
      .filter((c): c is LessonTool & { type: 'flash_card' } => c.type === 'flash_card')
      .map(c => ({ id: c.id, front: c.content.front, back: c.content.back }));

    let vocabCards: StudyCard[] = [];
    try {
      const saved = await lessonToolsApi.getSavedVocabFlashCards(lessonId);
      vocabCards = saved
        .filter((t): t is LessonTool & { type: 'vocab' } => t.type === 'vocab')
        .map(t => ({ id: t.id, front: t.content.term, back: t.content.definition }));
    } catch {
      // students only — ignore if not available
    }

    // Use already-fetched state instead of re-fetching
    const vocabAssignmentCards: StudyCard[] = savedVocabEntries
      .filter(e => !!e.id)
      .map(e => ({ id: e.id!, front: e.term, back: e.definition }));

    const seen = new Set<string>();
    const merged: StudyCard[] = [];
    for (const card of [...teacherCards, ...vocabCards, ...vocabAssignmentCards]) {
      if (!seen.has(card.id)) { seen.add(card.id); merged.push(card); }
    }

    setStudyCards(merged);
    setStudying(true);
    setEditMode(false);
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const hasAnything = cards.length > 0 || savedVocabEntries.length > 0;

  return (
    <div>
      <div className="flex items-center gap-2 justify-end mb-4">
        {(hasAnything || !canEdit) && (
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

      {cards.length === 0 && savedVocabEntries.length === 0 ? (
        <EmptyState
          title="No flash cards yet"
          description={canEdit ? 'Create flash cards to study key concepts.' : 'Save vocabulary terms from the Vocabulary tab to study them here.'}
          action={canEdit ? { label: '+ Add Card', onClick: () => setShowAdd(true) } : undefined}
        />
      ) : (
        <>
          {cards.length > 0 && (
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

          {savedVocabEntries.length > 0 && (
            <div className={cards.length > 0 ? 'mt-6' : ''}>
              {cards.length > 0 && (
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Saved Vocabulary</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedVocabEntries.map(entry => (
                  <div key={entry.id} className="relative rounded-2xl bg-surface border-2 border-border p-5">
                    <button
                      type="button"
                      onClick={() => handleRemoveVocabEntry(entry.id!)}
                      aria-label={`Remove "${entry.term}" from flash cards`}
                      className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Term</p>
                    <p className="text-foreground font-medium pr-6">{entry.term}</p>
                    <p className="text-xs text-muted-foreground mt-3 mb-1 uppercase tracking-wide">Definition</p>
                    <p className="text-sm text-muted-foreground">{entry.definition}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
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
