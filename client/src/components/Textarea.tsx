import { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export default function Textarea({ label, error, id, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <textarea
        id={id}
        {...props}
        className={`
          rounded-md border bg-surface-raised px-3 py-2 text-foreground text-sm
          placeholder:text-muted-foreground focus:outline-none focus:ring-2 resize-y min-h-24
          ${error ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-primary'}
          disabled:opacity-50 ${className}
        `}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
