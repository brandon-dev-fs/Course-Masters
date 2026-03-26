import { useRef, useEffect, useState } from 'react';
import { BookOpen, Play, FileText, Languages, Check, ChevronLeft, ChevronRight, ClipboardCheck, Lock, Plus, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface LearningResource {
  key: string;
  type: 'lessonPlan' | 'video' | 'note' | 'vocab';
  title: string;
  id: string;
}

const typeIcons: Record<string, LucideIcon> = {
  lessonPlan: BookOpen,
  video: Play,
  note: FileText,
  vocab: Languages,
};

interface LearningResourceNavProps {
  resources: LearningResource[];
  activeResourceKey: string;
  onResourceChange: (key: string) => void;
  completedKeys: Set<string>;
  quizUnlocked: boolean;
  canEdit?: boolean;
  onAddResource?: (type: 'note' | 'video' | 'vocab') => void;
  onDeleteResource?: (resource: LearningResource) => void;
  onMoveResource?: (resource: LearningResource, direction: 'left' | 'right') => void;
}

export default function LearningResourceNav({ resources, activeResourceKey, onResourceChange, completedKeys, quizUnlocked, canEdit, onAddResource, onDeleteResource, onMoveResource }: LearningResourceNavProps) {
  const isQuizActive = activeResourceKey === 'quiz';
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const reorderableResources = resources.filter(r => r.type === 'video' || r.type === 'note' || r.type === 'vocab');

  useEffect(() => {
    if (!showMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  return (
    <nav
      aria-label="Learning resources"
      className="flex items-center gap-1 px-4 py-2 border-b border-border bg-surface"
    >
      {/* Scrollable resource list */}
      <div className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0">
        {resources.map((resource, i) => {
          const Icon = typeIcons[resource.type] || FileText;
          const isActive = activeResourceKey === resource.key;
          const isComplete = completedKeys.has(resource.key);

          const isDeletable = resource.type !== 'lessonPlan';
          const isReorderable = resource.type !== 'lessonPlan';
          const reorderIdx = isReorderable ? reorderableResources.findIndex(r => r.key === resource.key) : -1;
          const canMoveLeft = reorderIdx > 0;
          const canMoveRight = reorderIdx !== -1 && reorderIdx < reorderableResources.length - 1;

          return (
            <div key={resource.key} className="flex items-center shrink-0">
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-border mx-0.5 shrink-0" />}
              <div className="group/item flex items-center">
                <button
                  onClick={() => onResourceChange(resource.key)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-primary-subtle text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{resource.title}</span>
                  {isComplete && <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                </button>
                {canEdit && isDeletable && (
                  <div className="flex items-center opacity-0 group-hover/item:opacity-100 transition-opacity">
                    {isReorderable && (
                      <>
                        <button
                          onClick={() => onMoveResource?.(resource, 'left')}
                          disabled={!canMoveLeft}
                          title="Move left"
                          className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onMoveResource?.(resource, 'right')}
                          disabled={!canMoveRight}
                          title="Move right"
                          className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => onDeleteResource?.(resource)}
                      title="Delete resource"
                      className="p-0.5 rounded text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add resource button — teacher/admin only */}
      {canEdit && onAddResource && (
        <div ref={menuRef} className="relative shrink-0 ml-2">
          <button
            onClick={() => setShowMenu(prev => !prev)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
          {showMenu && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-surface border border-border rounded-lg shadow-warm-md py-1 min-w-[140px]">
              {(['note', 'video', 'vocab'] as const).map(type => {
                const Icon = typeIcons[type];
                const label = type === 'note' ? 'Note' : type === 'video' ? 'Video' : 'Vocabulary';
                return (
                  <button
                    key={type}
                    onClick={() => { onAddResource(type); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-foreground hover:bg-surface-raised transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Quiz — final nav item, separated visually */}
      <div className="flex items-center shrink-0 pl-2 border-l border-border">
        <button
          onClick={() => { if (quizUnlocked) onResourceChange('quiz'); }}
          disabled={!quizUnlocked}
          title={quizUnlocked ? 'Take Quiz' : 'Complete all learning resources to unlock'}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm whitespace-nowrap transition-colors ${
            isQuizActive
              ? 'bg-primary-subtle text-primary font-medium'
              : quizUnlocked
                ? 'text-foreground hover:bg-surface-raised font-medium'
                : 'text-muted-foreground/50 cursor-not-allowed'
          }`}
        >
          {quizUnlocked
            ? <ClipboardCheck className="w-3.5 h-3.5 shrink-0" />
            : <Lock className="w-3.5 h-3.5 shrink-0" />
          }
          <span>Quiz</span>
        </button>
      </div>
    </nav>
  );
}
