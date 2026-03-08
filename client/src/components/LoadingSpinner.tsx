import { GraduationCap } from 'lucide-react';

interface LoadingSpinnerProps {
  className?: string;
  fullPage?: boolean;
}

export default function LoadingSpinner({ className = '', fullPage = false }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-12 ${fullPage ? 'min-h-[50vh]' : ''} ${className}`}>
      <GraduationCap className="w-8 h-8 text-primary animate-pulse" />
      <div className="relative rounded-full bg-border overflow-hidden" style={{ width: 72, height: 3 }}>
        <div className="pencil-draw absolute inset-0 bg-primary rounded-full" />
      </div>
      <p className="text-xs text-muted-foreground tracking-wide">Loading…</p>
    </div>
  );
}
