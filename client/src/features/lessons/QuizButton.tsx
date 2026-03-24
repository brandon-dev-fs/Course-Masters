import { Lock } from 'lucide-react';
import Button from '../../components/Button.js';

interface QuizButtonProps {
  allComplete: boolean;
  onTakeQuiz: () => void;
}

export default function QuizButton({ allComplete, onTakeQuiz }: QuizButtonProps) {
  if (!allComplete) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-surface-raised rounded-lg text-muted-foreground">
        <Lock className="w-4 h-4 shrink-0" />
        <span className="text-sm">Complete all learning resources to unlock the quiz</span>
      </div>
    );
  }

  return (
    <Button onClick={onTakeQuiz}>
      Take Quiz
    </Button>
  );
}
