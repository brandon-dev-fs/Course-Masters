import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { unitsApi } from '../../api/units.js';
import { progressApi } from '../../api/progress.js';
import type { Unit, Lesson, UnitProgress } from '../../api/types.js';
import LessonList from '../lessons/LessonList.js';
import TestSection from '../tests/TestSection.js';
import ProgressBar from '../progress/ProgressBar.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';

interface UnitAccordionItemProps {
  courseId: string;
  unit: Unit;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function UnitAccordionItem({
  courseId,
  unit,
  isExpanded,
  onToggle,
}: UnitAccordionItemProps) {
  const [loaded, setLoaded] = useState(false);
  const [loadingBody, setLoadingBody] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonCount, setLessonCount] = useState(unit._count?.lessons ?? 0);
  const [progress, setProgress] = useState<UnitProgress | null>(null);

  // Reset loaded when lesson count changes externally (e.g. added via settings modal)
  useEffect(() => {
    const newCount = unit._count?.lessons ?? 0;
    if (newCount !== lessonCount) {
      setLessonCount(newCount);
      setLoaded(false);
    }
  }, [unit._count?.lessons]);

  useEffect(() => {
    if (isExpanded && !loaded) {
      setLoadingBody(true);
      Promise.all([
        unitsApi.getOne(courseId, unit.id),
        progressApi.getUnit(courseId, unit.id),
      ])
        .then(([unitData, progressData]) => {
          setLessons(unitData.lessons ?? []);
          setProgress(progressData);
          setLoaded(true);
        })
        .catch(() => {})
        .finally(() => setLoadingBody(false));
    }
  }, [isExpanded, courseId, unit.id, loaded]);

  return (
    <div className={`rounded-xl bg-surface border transition-all ${isExpanded ? 'border-primary/40 shadow-warm-md' : 'border-border shadow-warm-sm'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onToggle}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary-subtle text-primary text-xs font-bold shrink-0">
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
          <div className="border-t border-border px-4 py-4 flex flex-col gap-4">
            {loadingBody ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner />
              </div>
            ) : (
              <>
                {progress && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{progress.completedLessons}/{progress.totalLessons} lessons complete</span>
                      <span className={progress.testPassed ? 'text-accent font-medium' : ''}>
                        Test: {progress.testPassed ? '✓ Passed' : '— Pending'}
                      </span>
                    </div>
                    <ProgressBar percent={progress.percentComplete} />
                  </div>
                )}

                <LessonList
                  courseId={courseId}
                  unitId={unit.id}
                  lessons={lessons}
                  lessonProgress={progress?.lessons}
                />

                <TestSection unitId={unit.id} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
