import { Link } from 'react-router-dom';
import { BookOpen, Circle, CircleDot, CheckCircle2 } from 'lucide-react';
import type { Lesson, LessonProgress } from '../../api/types.js';
import EmptyState from '../../components/EmptyState.js';
import Tooltip from '../../components/Tooltip.js';

interface LessonListProps {
  courseId: string;
  unitId: string;
  lessons: Lesson[];
  lessonProgress?: LessonProgress[];
}

function LessonStatusIcon({ prog }: { prog?: LessonProgress }) {
  if (prog?.quizPassed) {
    return <CheckCircle2 className="w-4 h-4 text-success shrink-0" />;
  }
  if (prog?.attempted) {
    return <CircleDot className="w-4 h-4 text-warning shrink-0" />;
  }
  return <Circle className="w-4 h-4 text-muted-foreground shrink-0" />;
}

export default function LessonList({ courseId, unitId, lessons, lessonProgress }: LessonListProps) {
  if (lessons.length === 0) {
    return <EmptyState icon={<BookOpen className="w-8 h-8" />} title="No lessons yet" description="Add a lesson via the course settings gear." />;
  }

  const sorted = [...lessons].sort((a, b) => a.order - b.order);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {sorted.map(lesson => {
        const prog = lessonProgress?.find(p => p.lessonId === lesson.id);
        return (
          <Link
            key={lesson.id}
            to={`/courses/${courseId}/units/${unitId}/lessons/${lesson.id}`}
            className="flex flex-col gap-1.5 rounded-xl bg-surface border border-border px-4 py-3 shadow-warm-sm hover:shadow-warm-md hover:-translate-y-px hover:border-primary/40 transition-all"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-foreground text-sm truncate">{lesson.title}</span>
              <LessonStatusIcon prog={prog} />
            </div>
            {lesson.description && (
              <Tooltip content={lesson.description}>
                <p className="text-xs text-muted-foreground line-clamp-2">{lesson.description}</p>
              </Tooltip>
            )}
          </Link>
        );
      })}
    </div>
  );
}
