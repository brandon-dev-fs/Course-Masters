import { lessonToolsApi } from '../../api/lesson-tools.js';
import type { LessonTool } from '../../api/types.js';
import FlashCard from '../flashcards/FlashCard.js';
import PracticeProblemCard from '../practice-problems/PracticeProblemCard.js';
import VocabCard from '../vocab/VocabCard.js';

interface LessonToolContentProps {
  tool: LessonTool;
  canEdit: boolean;
  onEditRequest: (tool: LessonTool) => void;
  onDeleted: (id: string) => void;
  onToolUpdated: (updated: LessonTool) => void;
}

export default function LessonToolContent({
  tool,
  canEdit,
  onEditRequest,
  onDeleted,
  onToolUpdated,
}: LessonToolContentProps) {
  if (tool.type === 'flash_card') {
    return (
      <FlashCard
        card={tool}
        editMode={canEdit}
        onUpdate={canEdit ? async (id, data) => {
          const updated = await lessonToolsApi.update(id, { content: data });
          onToolUpdated(updated);
        } : undefined}
        onDelete={canEdit ? async () => {
          await lessonToolsApi.delete(tool.id);
          onDeleted(tool.id);
        } : undefined}
      />
    );
  }

  if (tool.type === 'practice_problem') {
    return (
      <PracticeProblemCard
        problem={tool}
        onEdit={canEdit ? () => onEditRequest(tool) : undefined}
        onDelete={canEdit ? async () => {
          await lessonToolsApi.delete(tool.id);
          onDeleted(tool.id);
        } : undefined}
      />
    );
  }

  if (tool.type === 'vocab') {
    return (
      <VocabCard
        vocab={tool}
        onEdit={canEdit ? () => onEditRequest(tool) : undefined}
        onDelete={canEdit ? async () => {
          await lessonToolsApi.delete(tool.id);
          onDeleted(tool.id);
        } : undefined}
      />
    );
  }

  return null;
}
