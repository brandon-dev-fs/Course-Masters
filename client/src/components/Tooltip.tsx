import { ReactNode, useState, useRef } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export default function Tooltip({ content, children }: TooltipProps) {
  const [pos, setPos] = useState<{ top: number; left: number; above: boolean } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  function show() {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const above = window.innerHeight - rect.bottom < 120;
    setPos({
      top: above ? rect.top : rect.bottom + 8,
      left: Math.min(rect.left, window.innerWidth - 264),
      above,
    });
  }

  return (
    <div ref={triggerRef} onMouseEnter={show} onMouseLeave={() => setPos(null)}>
      {children}
      {pos && (
        <div
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            transform: pos.above ? 'translateY(calc(-100% - 8px))' : undefined,
          }}
          className="z-50 w-64 px-3 py-2 rounded-lg bg-surface-raised border border-border shadow-warm-md text-xs text-foreground pointer-events-none"
        >
          {content}
        </div>
      )}
    </div>
  );
}
