interface ProgressBarProps {
  percent: number;
  className?: string;
  role?: string;
  'aria-valuenow'?: number;
  'aria-valuemin'?: number;
  'aria-valuemax'?: number;
  'aria-label'?: string;
}

export default function ProgressBar({
  percent,
  className = '',
  role,
  'aria-valuenow': ariaValuenow,
  'aria-valuemin': ariaValuemin,
  'aria-valuemax': ariaValuemax,
  'aria-label': ariaLabel,
}: ProgressBarProps) {
  const color = percent >= 80 ? 'bg-primary' : percent >= 40 ? 'bg-warning' : 'bg-destructive';

  return (
    <div
      className={`w-full bg-surface rounded-full h-2 ${className}`}
      role={role}
      aria-valuenow={ariaValuenow}
      aria-valuemin={ariaValuemin}
      aria-valuemax={ariaValuemax}
      aria-label={ariaLabel}
    >
      <div
        className={`h-2 rounded-full transition-all duration-700 ease-out ${color}`}
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  );
}
