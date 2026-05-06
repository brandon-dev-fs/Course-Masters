import type { Lesson } from '../../api/types.js';
import RichTextEditor from '../../components/RichTextEditor.js';
import ResourceCompletionCheckbox from '../../components/ResourceCompletionCheckbox.js';
import EmptyState from '../../components/EmptyState.js';

interface LessonPlanViewProps {
  lesson: Lesson;
  isComplete?: boolean;
  onToggleComplete?: () => void;
  canEdit: boolean;
  onEdit: () => void;
}

export default function LessonPlanView({ lesson, isComplete, onToggleComplete, canEdit, onEdit }: LessonPlanViewProps) {
  const hasContent = lesson.objective || lesson.planContent;

  if (!hasContent && !canEdit) {
    return <EmptyState title="No lesson plan" description="No lesson plan has been added to this lesson yet." />;
  }

  if (!hasContent && canEdit) {
    return (
      <EmptyState
        title="No lesson plan"
        description="Add a learning objective and lesson plan content."
        action={{ label: 'Edit Lesson Plan', onClick: onEdit }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {lesson.objective && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Learning Objective</h3>
          <p className="text-foreground">{lesson.objective}</p>
        </div>
      )}

      {lesson.planContent && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Lesson Plan</h3>
          <RichTextEditor content={lesson.planContent} editable={false} />
        </div>
      )}

      {(onToggleComplete !== undefined || canEdit) && (
        <div className="flex items-center justify-between pt-2 border-t border-border">
          {onToggleComplete !== undefined ? (
            <ResourceCompletionCheckbox isComplete={isComplete ?? false} onToggle={onToggleComplete} />
          ) : (
            <div />
          )}
          {canEdit && (
            <button
              onClick={onEdit}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      )}
    </div>
  );
}
