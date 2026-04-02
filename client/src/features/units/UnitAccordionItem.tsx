import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Unit, LessonProgress } from '../../api/types.js';
import LessonList from '../lessons/LessonList.js';
import UnitTestCard from '../tests/UnitTestCard.js';

interface UnitProgressEntry {
  unitId: string;
  title: string;
  order: number;
  isComplete: boolean;
  totalLessons: number;
  completedLessons: number;
  testPassed: boolean;
  lessons: LessonProgress[];
}

interface UnitAccordionItemProps {
  courseId: string;
  unit: Unit;
  canEdit: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  unitProgress: UnitProgressEntry | null;
}

export default function UnitAccordionItem({
  courseId,
  unit,
  canEdit,
  isExpanded,
  onToggle,
  unitProgress,
}: UnitAccordionItemProps) {
  const lessons = unit.lessons ?? [];
  const lessonCount = unit._count?.lessons ?? lessons.length;
  const allLessonsComplete = unitProgress
    ? unitProgress.totalLessons > 0 && unitProgress.completedLessons === unitProgress.totalLessons
    : false;

  return (
    <div className={`rounded-xl bg-surface border transition-all ${isExpanded ? 'border-primary/40 shadow-warm-md' : 'border-border shadow-warm-sm'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onToggle}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold shrink-0 transition-colors ${
            unitProgress?.isComplete
              ? 'bg-green-500 text-white'
              : 'bg-surface-raised text-muted-foreground border border-border'
          }`}>
            {unit.order}
          </span>
          <span className="font-medium text-foreground truncate">{unit.title}</span>
        </button>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground">{lessonCount} lessons</span>
          <button onClick={onToggle} className="text-muted-foreground hover:text-foreground transition-colors">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Accordion body */}
      <div
        className="grid transition-[grid-template-rows] duration-300"
        style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden min-h-0">
          <div className="border-t border-border px-4 py-4">
            <LessonList
              courseId={courseId}
              unitId={unit.id}
              lessons={lessons}
              lessonProgress={unitProgress?.lessons}
              trailingContent={
                <UnitTestCard unitId={unit.id} allLessonsComplete={allLessonsComplete} />
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
