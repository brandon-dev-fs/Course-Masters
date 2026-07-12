import { BookOpen, BookMarked } from 'lucide-react';

interface LessonPlanRowProps {
  hasLessonPlan: boolean;
  onClick: () => void;
}

export default function LessonPlanRow({ hasLessonPlan, onClick }: LessonPlanRowProps) {
  if (hasLessonPlan) {
    return (
      <button
        type="button"
        aria-label="Lesson plan set — click to edit"
        onClick={onClick}
        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface transition-colors text-left ml-8 md:ml-16 mb-1"
      >
        <span className="hidden md:block w-4 h-4 shrink-0" aria-hidden="true" />
        <BookMarked className="w-4 h-4 shrink-0 text-green-primary" aria-hidden="true" />
        <span className="text-sm text-text-secondary flex-1">Lesson plan</span>
        <span className="text-xs font-medium text-green-primary shrink-0">set · edit</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label="No lesson plan — click to set one before adding activities"
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-green-primary/50 hover:border-green-primary hover:bg-green-surface transition-colors text-left ml-8 md:ml-16 mb-2"
    >
      <span className="hidden md:block w-4 h-4 shrink-0" aria-hidden="true" />
      <BookOpen className="w-4 h-4 shrink-0 text-green-primary" aria-hidden="true" />
      <span className="text-sm font-medium text-green-primary flex-1">Set lesson plan</span>
      <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">required before adding activities</span>
    </button>
  );
}
