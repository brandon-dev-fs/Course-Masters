import { Plus, Loader2 } from 'lucide-react';

interface AddItemButtonProps {
  label: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  indentClass?: string;
  ariaLabel?: string;
  ariaHasPopup?: boolean;
}

export default function AddItemButton({
  label,
  onClick,
  loading = false,
  disabled = false,
  indentClass = '',
  ariaLabel,
  ariaHasPopup = false,
}: AddItemButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      aria-label={ariaLabel ?? label}
      aria-haspopup={ariaHasPopup ? 'menu' : undefined}
      className={`flex items-center gap-1.5 w-full px-3 py-2 text-sm text-muted-foreground
        border border-dashed border-border rounded-lg
        hover:border-green-primary hover:text-green-primary
        transition-colors cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${indentClass}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 shrink-0 animate-spin" aria-hidden="true" />
      ) : (
        <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
      )}
      <span>{loading ? 'Adding...' : label}</span>
    </button>
  );
}
