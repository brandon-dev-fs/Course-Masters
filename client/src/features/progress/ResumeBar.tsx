import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import type { Unit, CourseProgress } from '../../api/types.js';

interface ResumeBarProps {
  courseId: string;
  units: Unit[];
  progress: CourseProgress | null;
}

export default function ResumeBar({ courseId, units, progress }: ResumeBarProps) {
  if (!progress || units.length === 0) return null;

  // Join course units (have title/order) with progress units (have lesson completion)
  const sortedUnits = [...units].sort((a, b) => a.order - b.order);

  for (const unit of sortedUnits) {
    const unitProg = progress.units.find((u) => u.unitId === unit.id);
    const sortedLessons = [...(unit.lessons ?? [])].sort((a, b) => a.order - b.order);

    for (const lesson of sortedLessons) {
      const lessonProg = unitProg?.lessons.find((l) => l.lessonId === lesson.id);
      const isComplete = lessonProg?.quizPassed === true;
      if (!isComplete) {
        return (
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-surface border border-border shadow-warm-sm px-5 py-4 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Continue where you left off</p>
                <p className="text-sm font-medium text-foreground truncate">{lesson.title}</p>
              </div>
            </div>
            <Link
              to={`/courses/${courseId}/units/${unit.id}/lessons/${lesson.id}`}
              className="flex items-center gap-1.5 text-xs font-medium bg-primary text-primary-foreground hover:brightness-110 rounded-lg px-3 py-1.5 transition-all shrink-0"
            >
              Resume <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        );
      }
    }
  }

  // All lessons done — surface the exam if not passed
  if (!progress.examPassed && progress.totalUnits > 0) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-2xl bg-surface border border-border shadow-warm-sm px-5 py-4 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Continue where you left off</p>
            <p className="text-sm font-medium text-foreground">Final Exam</p>
          </div>
        </div>
        <span className="text-xs font-medium text-muted-foreground shrink-0">Scroll to end →</span>
      </div>
    );
  }

  return null;
}
