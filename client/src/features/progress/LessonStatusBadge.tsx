interface LessonStatusBadgeProps {
  quizPassed: boolean;
  hasQuiz: boolean;
}

export default function LessonStatusBadge({ quizPassed, hasQuiz }: LessonStatusBadgeProps) {
  if (!hasQuiz) return null;
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${quizPassed ? 'bg-accent/20 text-accent' : 'bg-surface text-muted-foreground'}`}>
      {quizPassed ? '✓' : '○'}
    </span>
  );
}
