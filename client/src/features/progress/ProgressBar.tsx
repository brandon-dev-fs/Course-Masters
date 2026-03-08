interface ProgressBarProps {
  percent: number;
  className?: string;
}

export default function ProgressBar({ percent, className = '' }: ProgressBarProps) {
  const color = percent >= 80 ? 'bg-primary' : percent >= 40 ? 'bg-warning' : 'bg-destructive';

  return (
    <div className={`w-full bg-surface rounded-full h-2 ${className}`}>
      <div
        className={`h-2 rounded-full transition-all duration-700 ease-out ${color}`}
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  );
}
