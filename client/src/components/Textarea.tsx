import { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export default function Textarea({ label, error, id, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-foreground">
          {label}
        </label>
      )}
      <textarea
        id={id}
        {...props}
        className={`
          rounded-xl border-2 bg-surface-raised px-3 py-2 text-foreground text-sm
          placeholder:text-muted-foreground focus:outline-none focus:ring-0 resize-y min-h-24
          ${error ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'}
          disabled:opacity-50 ${className}
        `}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
