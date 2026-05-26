import { Check } from 'lucide-react';
import type { LessonProgress } from '../api/types.js';

export default function LessonStatusIcon({ prog }: { prog?: LessonProgress }) {
  if (prog?.quizPassed) {
    return (
      <div className="w-4 h-4 rounded-[3px] bg-green-primary border border-green-primary flex items-center justify-center shrink-0">
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
