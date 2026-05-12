interface ErrorMessageProps {
  message: string;
  className?: string;
  variant?: 'default' | 'inline';
}

export default function ErrorMessage({ message, className = '', variant = 'default' }: ErrorMessageProps) {
  if (variant === 'inline') {
    return (
      <p role="alert" className={`text-sm text-destructive ${className}`}>
        {message}
      </p>
    );
  }
  return (
    <div role="alert" className={`rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-destructive text-sm ${className}`}>
      {message}
    </div>
  );
}
