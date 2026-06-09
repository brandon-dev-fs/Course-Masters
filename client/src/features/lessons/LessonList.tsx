import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Lesson, LessonProgress } from '../../api/types.js';
import EmptyState from '../../components/EmptyState.js';
import Tooltip from '../../components/Tooltip.js';
import LessonStatusIcon from '../../components/LessonStatusIcon.js';

interface LessonListProps {
  courseId: string;
  unitId: string;
  lessons: Lesson[];
  lessonProgress?: LessonProgress[];
  trailingContent?: ReactNode;
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
