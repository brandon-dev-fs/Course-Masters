import { lessonToolsApi } from '../../api/lesson-tools.js';
import type { LessonTool } from '../../api/types.js';
import Modal from '../../components/Modal.js';
import FlashCardForm from '../flashcards/FlashCardForm.js';
import PracticeProblemForm from '../practice-problems/PracticeProblemForm.js';
import VocabForm from '../vocab/VocabForm.js';

interface LessonToolModalsProps {
  canEdit: boolean;
  editingTool: LessonTool | null;
  onClose: () => void;
  onToolUpdated: (updated: LessonTool) => void;
}

export default function LessonToolModals({
  canEdit,
  editingTool,
  onClose,
  onToolUpdated,
}: LessonToolModalsProps) {
  if (!canEdit || !editingTool) return null;

  if (editingTool.type === 'flash_card') {
    return (
      <Modal title="Edit Flash Card" onClose={onClose}>
        <FlashCardForm
          initial={editingTool}
          onSubmit={async ({ front, back, order }) => {
            const updated = await lessonToolsApi.update(editingTool.id, { title: front, content: { front, back }, order });
            onToolUpdated(updated);
            onClose();
          }}
          onCancel={onClose}
        />
      </Modal>
    );
  }

  if (editingTool.type === 'practice_problem') {
    return (
      <Modal title="Edit Practice Problem" onClose={onClose}>
        <PracticeProblemForm
          initial={editingTool}
          onSubmit={async (draft) => {
            const updated = await lessonToolsApi.update(editingTool.id, {
              title: draft.question,
              content: { question: draft.question, options: draft.content.options, correctIndex: draft.content.correctIndex, calculatorEnabled: draft.calculatorEnabled ?? false },
              order: draft.order,
            });
            onToolUpdated(updated);
            onClose();
          }}
          onCancel={onClose}
        />
      </Modal>
    );
  }

  if (editingTool.type === 'vocab') {
    return (
      <Modal title="Edit Vocab Term" onClose={onClose}>
        <VocabForm
          initial={editingTool}
          onSubmit={async ({ term, definition, example, order }) => {
            const updated = await lessonToolsApi.update(editingTool.id, { title: term, content: { term, definition, example }, order });
            onToolUpdated(updated);
            onClose();
          }}
          onCancel={onClose}
        />
      </Modal>
    );
  }

  return null;
}
