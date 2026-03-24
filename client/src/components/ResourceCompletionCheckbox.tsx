import { Check } from 'lucide-react';

interface ResourceCompletionCheckboxProps {
  isComplete: boolean;
  onToggle: () => void;
}

export default function ResourceCompletionCheckbox({ isComplete, onToggle }: ResourceCompletionCheckboxProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
        isComplete
          ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
          : 'bg-surface-raised text-muted-foreground hover:text-foreground hover:bg-surface-raised/80'
      }`}
    >
      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
        isComplete
          ? 'bg-green-500 border-green-500'
          : 'border-border'
      }`}>
        {isComplete && <Check className="w-3 h-3 text-white" />}
      </div>
      {isComplete ? 'Completed' : 'Mark as complete'}
    </button>
  );
}
