import { useState } from 'react';
import { Layers, PenTool, ChevronLeft, ChevronRight } from 'lucide-react';

interface PracticeResourceSidebarProps {
  activeResource: string | null;
  onResourceChange: (resource: string) => void;
}

const practiceItems = [
  { key: 'flashcards', label: 'Flash Cards', icon: Layers },
  { key: 'practice', label: 'Practice Problems', icon: PenTool },
] as const;

export function PracticeResourceMobileBar({ activeResource, onResourceChange }: PracticeResourceSidebarProps) {
  return (
    <div className="lg:hidden flex gap-2 px-4 py-2 border-b border-border bg-surface">
      {practiceItems.map(item => {
        const Icon = item.icon;
        const isActive = activeResource === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onResourceChange(item.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-primary-subtle text-primary font-medium'
                : 'bg-surface-raised text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export default function PracticeResourceSidebar({ activeResource, onResourceChange }: PracticeResourceSidebarProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      className={`hidden lg:flex lg:flex-col shrink-0 border-l border-border bg-surface py-4 gap-3 transition-all duration-200 ease-in-out ${
        expanded ? 'w-64 px-3' : 'w-14 px-2'
      }`}
    >
      {/* Toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="self-center p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
        aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {expanded ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Header — only when expanded */}
      {expanded && (
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2">Practice</p>
      )}

      {/* Items */}
      {practiceItems.map(item => {
        const Icon = item.icon;
        const isActive = activeResource === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onResourceChange(item.key)}
            title={expanded ? undefined : item.label}
            className={`w-full flex items-center rounded-lg transition-colors text-left ${
              expanded ? 'gap-3 px-3 py-3' : 'justify-center py-3'
            } ${
              isActive
                ? 'bg-primary-subtle text-primary font-medium shadow-warm-sm'
                : 'bg-surface-raised text-muted-foreground hover:text-foreground hover:bg-surface-raised/80'
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {expanded && <span className="text-sm whitespace-nowrap">{item.label}</span>}
          </button>
        );
      })}
    </aside>
  );
}
