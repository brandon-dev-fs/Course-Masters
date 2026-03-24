import { BookOpen, Play, FileText, Languages, Check, ChevronRight, ClipboardCheck, Lock } from 'lucide-react';
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
}

export default function LearningResourceNav({ resources, activeResourceKey, onResourceChange, completedKeys, quizUnlocked }: LearningResourceNavProps) {
  const isQuizActive = activeResourceKey === 'quiz';

  return (
    <nav
      aria-label="Learning resources"
      className="flex items-center gap-1 px-4 py-2 border-b border-border bg-surface overflow-x-auto"
    >
      {resources.map((resource, i) => {
        const Icon = typeIcons[resource.type] || FileText;
        const isActive = activeResourceKey === resource.key;
        const isComplete = completedKeys.has(resource.key);

        return (
          <div key={resource.key} className="flex items-center shrink-0">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-border mx-0.5 shrink-0" />}
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
          </div>
        );
      })}

      {/* Quiz — final nav item, separated visually */}
      <div className="flex items-center shrink-0 ml-auto pl-2 border-l border-border">
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
