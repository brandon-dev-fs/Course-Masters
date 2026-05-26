import { Link } from 'react-router-dom';
import { ClipboardCheck, ClipboardList, Lock } from 'lucide-react';
import type { Unit, LessonProgress } from '../../api/types.js';
import LessonStatusIcon from '../../components/LessonStatusIcon.js';

interface UnitProgressEntry {
  unitId: string;
  title: string;
  order: number;
  isComplete: boolean;
  totalLessons: number;
  completedLessons: number;
  testPassed: boolean;
  lessons: LessonProgress[];
}

interface UnitCardProps {
  courseId: string;
  unit: Unit;
  unitProgress: UnitProgressEntry | null;
}

const MAX_VISIBLE_LESSONS = 3;

export default function UnitCard({ courseId, unit, unitProgress }: UnitCardProps) {
  const lessons = [...(unit.lessons ?? [])].sort((a, b) => a.order - b.order);
  const visibleLessons = lessons.slice(0, MAX_VISIBLE_LESSONS);
  const hiddenCount = lessons.length - visibleLessons.length;
  const isComplete = unitProgress?.isComplete ?? false;
  const testPassed = unitProgress?.testPassed ?? false;
  const allLessonsComplete =
    unitProgress
      ? unitProgress.totalLessons > 0 && unitProgress.completedLessons === unitProgress.totalLessons
      : false;
  const testLocked = !allLessonsComplete;

  return (
    <div className="w-full md:w-64 md:shrink-0 flex flex-col rounded-2xl bg-surface border border-border shadow-warm-sm hover:shadow-warm-md transition-all">
      {/* Accent bar */}
      <div className={`h-1.5 rounded-t-2xl ${isComplete ? 'bg-green-primary' : 'bg-primary'}`} />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
        <span className={`w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold shrink-0 ${
          isComplete
            ? 'bg-green-primary text-white'
            : 'bg-surface-raised text-muted-foreground border border-border'
        }`}>
          {unit.order}
        </span>
        <span className="font-semibold text-sm text-foreground leading-tight line-clamp-2">{unit.title}</span>
      </div>

      {/* Lesson links */}
      <div className="flex-1 flex flex-col gap-1 px-4 pb-2">
        {lessons.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No lessons yet</p>
        ) : (
          <>
            {visibleLessons.map((lesson) => {
              const prog = unitProgress?.lessons.find((p) => p.lessonId === lesson.id);
              return (
                <Link
                  key={lesson.id}
                  to={`/courses/${courseId}/units/${unit.id}/lessons/${lesson.id}`}
                  className="flex items-center gap-2 group/lesson"
                >
                  <LessonStatusIcon prog={prog} />
                  <span className="text-xs text-muted-foreground group-hover/lesson:text-foreground truncate transition-colors">
                    {lesson.title}
                  </span>
                </Link>
              );
            })}
            {hiddenCount > 0 && (
              <p className="text-xs text-muted-foreground/60 pl-6">
                ··· and {hiddenCount} more
              </p>
            )}
          </>
        )}
      </div>

      {/* Unit test footer */}
      <div className="border-t border-border px-4 py-2.5 flex items-center gap-2">
        {testLocked ? (
          <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        ) : testPassed ? (
          <ClipboardCheck className="w-3.5 h-3.5 text-green-primary shrink-0" />
        ) : (
          <ClipboardList className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        )}
        <span className={`text-xs ${
          testLocked
            ? 'text-muted-foreground/60'
            : testPassed
              ? 'text-green-primary font-medium'
              : 'text-muted-foreground'
        }`}>
          {testPassed ? 'Unit test passed' : testLocked ? 'Unit test locked' : 'Unit test available'}
        </span>
      </div>
    </div>
  );
}
