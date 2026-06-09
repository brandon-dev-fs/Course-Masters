import type { AssignmentType } from '../../api/types.js';
import type { TYPE_CONFIG } from './AssignmentFormModal.js';

interface AssignmentTypePickerProps {
  config: typeof TYPE_CONFIG;
  onSelect: (type: AssignmentType) => void;
}

export default function AssignmentTypePicker({ config, onSelect }: AssignmentTypePickerProps) {
  const types = Object.entries(config) as [AssignmentType, (typeof TYPE_CONFIG)[AssignmentType]][];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {types.map(([type, { label, icon: Icon }]) => (
        <button
          key={type}
          type="button"
          aria-label={`Add ${label} assignment`}
          onClick={() => onSelect(type)}
          className={[
            'flex flex-col items-center justify-center gap-2 p-4 rounded-xl',
            'border border-border bg-surface-raised cursor-pointer transition-colors',
            'min-h-[80px] sm:min-h-[80px]',
            'hover:bg-surface hover:border-primary/50',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
            'active:scale-[0.98]',
          ].join(' ')}
        >
          <Icon className="w-6 h-6 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </button>
      ))}
    </div>
  );
}
