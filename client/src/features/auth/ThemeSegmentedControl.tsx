import { useRef } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

import type { ThemePreference } from '../../api/types.js';

interface ThemeSegmentedControlProps {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
}

interface Segment {
  value: ThemePreference;
  label: string;
  Icon: typeof Sun;
}

const SEGMENTS: Segment[] = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
];

export default function ThemeSegmentedControl({ value, onChange }: ThemeSegmentedControlProps) {
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (index + 1) % SEGMENTS.length;
      onChange(SEGMENTS[next].value);
      btnRefs.current[next]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (index - 1 + SEGMENTS.length) % SEGMENTS.length;
      onChange(SEGMENTS[prev].value);
      btnRefs.current[prev]?.focus();
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(SEGMENTS[index].value);
    }
  }

  return (
    <div role="radiogroup" aria-label="Theme preference" className="inline-flex bg-surface-raised rounded-xl p-1 border border-border">
      {SEGMENTS.map((segment, index) => {
        const isActive = value === segment.value;
        return (
          <button
            key={segment.value}
            ref={(el) => { btnRefs.current[index] = el; }}
            role="radio"
            aria-checked={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(segment.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={
              `px-4 py-2 text-sm font-medium flex items-center gap-2 cursor-pointer transition-all rounded-lg ${
                isActive
                  ? 'bg-green-surface text-green-surface-text shadow-warm-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <segment.Icon className="w-4 h-4" aria-hidden="true" />
            {segment.label}
          </button>
        );
      })}
    </div>
  );
}
