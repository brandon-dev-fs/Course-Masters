interface ErrorMessageProps {
  message: string;
  className?: string;
}

export default function ErrorMessage({ message, className = '' }: ErrorMessageProps) {
  return (
    <div className={`rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-destructive text-sm ${className}`}>
      {message}
    </div>
  );
}
