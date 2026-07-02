interface LessonPlanRowProps {
  hasLessonPlan: boolean;
  onClick: () => void;
}

export default function LessonPlanRow({ hasLessonPlan, onClick }: LessonPlanRowProps) {
  return (
    <button
      type="button"
      aria-label={hasLessonPlan ? 'Lesson plan — created. Click to edit.' : 'Lesson plan — not set. Click to add.'}
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-surface text-left
        ml-8 md:ml-16
        ${hasLessonPlan ? 'opacity-70' : 'opacity-50'}`}
    >
      {/* Placeholder for drag handle spacing */}
      <span className="hidden md:block w-4 h-4 shrink-0" aria-hidden="true" />

      <span className="text-sm text-muted-foreground flex-1 truncate italic">
        Lesson plan
      </span>

      <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-surface border border-border-subtle text-muted-foreground shrink-0">
        auto
      </span>

      <span className={`text-xs shrink-0 ${hasLessonPlan ? 'text-green-primary' : 'text-muted-foreground'}`}>
        {hasLessonPlan ? 'set' : 'not set'}
      </span>
    </button>
  );
}
