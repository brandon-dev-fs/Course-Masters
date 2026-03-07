import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, id, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        id={id}
        {...props}
        className={`
          rounded-md border bg-surface-raised px-3 py-2 text-foreground text-sm
          placeholder:text-muted-foreground focus:outline-none focus:ring-2
          ${error ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-primary'}
          disabled:opacity-50 ${className}
        `}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
