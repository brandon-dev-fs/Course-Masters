import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Circle, CircleDot, CheckCircle2, Settings } from 'lucide-react';
import type { Lesson, LessonProgress } from '../../api/types.js';
import EmptyState from '../../components/EmptyState.js';
import LessonSettingsModal from './LessonSettingsModal.js';

interface LessonListProps {
  courseId: string;
  unitId: string;
  lessons: Lesson[];
  lessonProgress?: LessonProgress[];
  onUpdateLesson: (lesson: Lesson, data: { title: string; description?: string; order: number }) => Promise<void>;
  onDeleteLesson: (lesson: Lesson) => Promise<void>;
}

function LessonStatusIcon({ prog }: { prog?: LessonProgress }) {
  if (prog?.quizPassed) {
    return <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />;
  }
  if (prog?.attempted) {
    return <CircleDot className="w-5 h-5 text-warning shrink-0" />;
  }
  return <Circle className="w-5 h-5 text-muted-foreground shrink-0" />;
}

export default function LessonList({ courseId, unitId, lessons, lessonProgress, onUpdateLesson, onDeleteLesson }: LessonListProps) {
  const [settingsLesson, setSettingsLesson] = useState<Lesson | null>(null);

  if (lessons.length === 0) {
    return <EmptyState icon={<BookOpen className="w-8 h-8" />} title="No lessons yet" description="Add a lesson to start adding content." />;
  }

  const sorted = [...lessons].sort((a, b) => a.order - b.order);

  return (
    <>
      <div className="flex flex-col gap-2">
        {sorted.map(lesson => {
          const prog = lessonProgress?.find(p => p.lessonId === lesson.id);
          return (
            <div key={lesson.id} className="flex items-center justify-between rounded-xl bg-surface border border-border px-4 py-3 shadow-warm-sm hover:shadow-warm-md hover:-translate-y-px hover:border-primary/40 transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <LessonStatusIcon prog={prog} />
                <Link to={`/courses/${courseId}/units/${unitId}/lessons/${lesson.id}`} className="font-medium text-foreground hover:text-primary transition-colors truncate">
                  {lesson.title}
                </Link>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setSettingsLesson(lesson); }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors shrink-0 ml-2"
                aria-label={`Settings for ${lesson.title}`}
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {settingsLesson && (
        <LessonSettingsModal
          lesson={settingsLesson}
          onClose={() => setSettingsLesson(null)}
          onUpdate={async data => {
            await onUpdateLesson(settingsLesson, data);
            setSettingsLesson(null);
          }}
          onDelete={async () => {
            await onDeleteLesson(settingsLesson);
            setSettingsLesson(null);
          }}
        />
      )}
    </>
  );
}
