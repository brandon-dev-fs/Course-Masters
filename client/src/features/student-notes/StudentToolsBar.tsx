import { NotebookPen, Layers, Brain, BookOpen } from 'lucide-react';

export type StudentToolType = 'notes' | 'flashcards' | 'practice' | 'vocab';

export const TOOL_META: Record<StudentToolType, { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
  notes:     { label: 'My Notes',          Icon: NotebookPen },
  flashcards:{ label: 'Flash Cards',       Icon: Layers },
  practice:  { label: 'Practice Problems', Icon: Brain },
  vocab:     { label: 'Vocabulary',        Icon: BookOpen },
};

interface StudentToolsBarProps {
  availableTools: StudentToolType[];
  activeTool: StudentToolType | null;
  onOpenTool: (tool: StudentToolType) => void;
  isQuizActive: boolean;
}

export default function StudentToolsBar({ availableTools, activeTool, onOpenTool, isQuizActive }: StudentToolsBarProps) {
  if (isQuizActive || availableTools.length === 0) return null;

  return (
    <>
      {/* Desktop: vertical strip */}
      <aside className="hidden lg:flex lg:flex-col w-10 shrink-0 border-l border-border bg-surface items-center py-3 gap-2">
        {availableTools.map(tool => {
          const { label, Icon } = TOOL_META[tool];
          const isActive = activeTool === tool;
          return (
            <button
              key={tool}
              onClick={() => onOpenTool(tool)}
              title={label}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-subtle text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
              }`}
              aria-label={label}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </aside>

      {/* Mobile: horizontal row above content */}
      <div className="lg:hidden flex gap-2 px-4 py-2 border-b border-border bg-surface overflow-x-auto">
        {availableTools.map(tool => {
          const { label, Icon } = TOOL_META[tool];
          const isActive = activeTool === tool;
          return (
            <button
              key={tool}
              onClick={() => onOpenTool(tool)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                isActive
                  ? 'bg-primary-subtle text-primary'
                  : 'bg-surface-raised text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          );
        })}
      </div>
    </>
  );
}
