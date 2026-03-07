import { Link } from 'react-router-dom';
import type { Lesson } from '../../api/types.js';
import EmptyState from '../../components/EmptyState.js';

interface LessonListProps {
  courseId: string;
  unitId: string;
  lessons: Lesson[];
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
}

export default function LessonList({ courseId, unitId, lessons, onEdit, onDelete }: LessonListProps) {
  if (lessons.length === 0) {
    return <EmptyState title="No lessons yet" description="Add a lesson to start adding content." />;
  }

  const sorted = [...lessons].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col gap-2">
      {sorted.map(lesson => (
        <div key={lesson.id} className="flex items-center justify-between rounded-lg bg-surface border border-border px-4 py-3 hover:border-primary/40 transition-colors">
          <Link to={`/courses/${courseId}/units/${unitId}/lessons/${lesson.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
            {lesson.order}. {lesson.title}
          </Link>
          <div className="flex gap-1">
            <button onClick={() => onEdit(lesson)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-surface-raised transition-colors">Edit</button>
            <button onClick={() => onDelete(lesson)} className="text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded hover:bg-surface-raised transition-colors">Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
