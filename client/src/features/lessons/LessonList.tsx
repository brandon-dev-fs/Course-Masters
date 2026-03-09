import { Link } from 'react-router-dom';
import { BookOpen, Circle, CircleDot, CheckCircle2 } from 'lucide-react';
import type { Lesson, LessonProgress } from '../../api/types.js';
import EmptyState from '../../components/EmptyState.js';

interface LessonListProps {
  courseId: string;
  unitId: string;
  lessons: Lesson[];
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
  lessonProgress?: LessonProgress[];
}

function LessonStatusIcon({ prog }: { prog?: LessonProgress }) {
  if (prog?.quizPassed) {
    return <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />;
  }
  if (prog?.attempted) {
    return <CircleDot className="w-5 h-5 text-warning shrink-0" />;
  }
  return <Circle className="w-5 h-5 text-muted-foreground shrink-0" />;
}

export default function LessonList({ courseId, unitId, lessons, onEdit, onDelete, lessonProgress }: LessonListProps) {
  if (lessons.length === 0) {
    return <EmptyState icon={<BookOpen className="w-8 h-8" />} title="No lessons yet" description="Add a lesson to start adding content." />;
  }

  const sorted = [...lessons].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col gap-2">
      {sorted.map(lesson => {
        const prog = lessonProgress?.find(p => p.lessonId === lesson.id);
        return (
          <div key={lesson.id} className="flex items-center justify-between rounded-xl bg-surface border border-border px-4 py-3 shadow-warm-sm hover:shadow-warm-md hover:-translate-y-px hover:border-primary/40 transition-all">
            <div className="flex items-center gap-3">
              <LessonStatusIcon prog={prog} />
              <Link to={`/courses/${courseId}/units/${unitId}/lessons/${lesson.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                {lesson.title}
              </Link>
            </div>
            <div className="flex gap-1">
              <button onClick={() => onEdit(lesson)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-surface-raised transition-colors">Edit</button>
              <button onClick={() => onDelete(lesson)} className="text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded hover:bg-surface-raised transition-colors">Delete</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
