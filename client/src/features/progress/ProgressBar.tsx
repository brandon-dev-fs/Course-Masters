interface ProgressBarProps {
  percent: number;
  className?: string;
}

export default function ProgressBar({ percent, className = '' }: ProgressBarProps) {
  const color = percent >= 80 ? 'bg-accent' : percent >= 40 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className={`w-full bg-surface rounded-full h-2 ${className}`}>
      <div
        className={`h-2 rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  );
}
