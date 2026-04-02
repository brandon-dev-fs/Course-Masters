import { Link } from 'react-router-dom';
import { BookOpen, Check } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Lesson, LessonProgress } from '../../api/types.js';
import EmptyState from '../../components/EmptyState.js';
import Tooltip from '../../components/Tooltip.js';

interface LessonListProps {
  courseId: string;
  unitId: string;
  lessons: Lesson[];
  lessonProgress?: LessonProgress[];
  trailingContent?: ReactNode;
}

function LessonStatusIcon({ prog }: { prog?: LessonProgress }) {
  if (prog?.quizPassed) {
    return (
      <div className="w-4 h-4 rounded-[3px] bg-green-500 border border-green-500 flex items-center justify-center shrink-0">
        <Check className="w-3 h-3 text-white" strokeWidth={3} />
      </div>
    );
  }
  if (prog?.attempted) {
    return (
      <div className="w-4 h-4 rounded-[3px] bg-warning/10 border border-warning flex items-center justify-center shrink-0">
        <Check className="w-3 h-3 text-warning/70" strokeWidth={3} />
      </div>
    );
  }
  return (
    <div className="w-4 h-4 rounded-[3px] border border-border bg-surface-raised flex items-center justify-center shrink-0">
      <Check className="w-3 h-3 text-muted-foreground/25" strokeWidth={3} />
    </div>
  );
}

export default function LessonList({ courseId, unitId, lessons, lessonProgress, trailingContent }: LessonListProps) {
  if (lessons.length === 0) {
    return <EmptyState icon={<BookOpen className="w-8 h-8" />} title="No lessons yet" description="Add a lesson from within the lesson page." />;
  }

  const sorted = [...lessons].sort((a, b) => a.order - b.order);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {sorted.map(lesson => {
        const prog = lessonProgress?.find(p => p.lessonId === lesson.id);
        return (
          <div
            key={lesson.id}
            className="flex flex-col gap-1.5 rounded-xl bg-surface border border-border px-4 py-3 shadow-warm-sm"
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
            <Link
              to={`/courses/${courseId}/units/${unitId}/lessons/${lesson.id}`}
              className="mt-1 w-full text-center text-xs font-medium bg-primary text-primary-foreground hover:brightness-110 rounded-lg py-1.5 transition-all"
            >
              Go to Lesson
            </Link>
          </div>
        );
      })}
      {trailingContent}
    </div>
  );
}
