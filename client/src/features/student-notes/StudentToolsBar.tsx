import { NotebookPen, Layers, Brain, BookOpen } from 'lucide-react';

export type StudentToolType = 'notes' | 'flashcards' | 'practice' | 'vocab';

export const TOOL_META: Record<StudentToolType, { label: string; longLabel: string; Icon: React.ComponentType<{ className?: string }> }> = {
  notes:      { label: 'Notes',    longLabel: 'My Notes',          Icon: NotebookPen },
  flashcards: { label: 'Cards',    longLabel: 'Flash Cards',       Icon: Layers },
  practice:   { label: 'Practice', longLabel: 'Practice Problems', Icon: Brain },
  vocab:      { label: 'Vocab',    longLabel: 'Vocabulary',        Icon: BookOpen },
};

interface StudentToolsBarProps {
  availableTools: StudentToolType[];
  activeTool: StudentToolType | null;
  onOpenTool: (tool: StudentToolType) => void;
  isQuizActive: boolean;
  /** Which layout to render. 'mobile' = bottom tab bar only, 'desktop' = vertical strip only, 'both' = both (default) */
  mode?: 'mobile' | 'desktop' | 'both';
}

export default function StudentToolsBar({ availableTools, activeTool, onOpenTool, isQuizActive, mode = 'both' }: StudentToolsBarProps) {
  if (isQuizActive || availableTools.length === 0) return null;

  return (
    <>
      {/* Desktop: vertical strip on the right edge */}
      {(mode === 'desktop' || mode === 'both') && (
        <aside className="hidden lg:flex lg:flex-col w-10 shrink-0 border-l border-border bg-surface items-center py-3 gap-2">
          {availableTools.map(tool => {
            const { longLabel, Icon } = TOOL_META[tool];
            const isActive = activeTool === tool;
            return (
              <button
                key={tool}
                onClick={() => onOpenTool(tool)}
                title={longLabel}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-subtle text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
                }`}
                aria-label={longLabel}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </aside>
      )}

      {/* Mobile: fixed bottom tab bar */}
      {(mode === 'mobile' || mode === 'both') && (
        <nav
          aria-label="Student tools"
          className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border flex lg:hidden"
        >
          {availableTools.map(tool => {
            const { label, longLabel, Icon } = TOOL_META[tool];
            const isActive = activeTool === tool;
            return (
              <button
                key={tool}
                role="tab"
                aria-selected={isActive}
                aria-label={longLabel}
                onClick={() => onOpenTool(tool)}
                className={`flex flex-col items-center gap-0.5 flex-1 py-2 min-h-[44px] transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px]">{label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </>
  );
}
