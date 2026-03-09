import { Link } from 'react-router-dom';
import { BookOpen, Circle, CircleDot, CheckCircle2 } from 'lucide-react';
import type { Lesson, LessonProgress } from '../../api/types.js';
import EmptyState from '../../components/EmptyState.js';

interface LessonListProps {
  courseId: string;
  unitId: string;
  lessons: Lesson[];
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

export default function LessonList({ courseId, unitId, lessons, lessonProgress }: LessonListProps) {
  if (lessons.length === 0) {
    return <EmptyState icon={<BookOpen className="w-8 h-8" />} title="No lessons yet" description="Add a lesson via the course settings gear." />;
  }

  const sorted = [...lessons].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col gap-2">
      {sorted.map(lesson => {
        const prog = lessonProgress?.find(p => p.lessonId === lesson.id);
        return (
          <div key={lesson.id} className="flex items-center rounded-xl bg-surface border border-border px-4 py-3 shadow-warm-sm hover:shadow-warm-md hover:-translate-y-px hover:border-primary/40 transition-all">
            <LessonStatusIcon prog={prog} />
            <Link to={`/courses/${courseId}/units/${unitId}/lessons/${lesson.id}`} className="ml-3 font-medium text-foreground hover:text-primary transition-colors">
              {lesson.title}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
