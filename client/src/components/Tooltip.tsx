import { ReactNode, useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export default function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [above, setAbove] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setAbove(rect.bottom + 120 > window.innerHeight);
    }
  }, [visible]);

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={`absolute z-50 left-0 w-64 px-3 py-2 rounded-lg bg-surface-raised border border-border shadow-warm-md text-xs text-foreground pointer-events-none ${above ? 'bottom-full mb-2' : 'top-full mt-2'}`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
