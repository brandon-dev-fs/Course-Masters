import { useState } from 'react';
import { Layers } from 'lucide-react';
import type { Unit, CourseProgress } from '../../api/types.js';
import UnitAccordionItem from './UnitAccordionItem.js';
import ExamAccordionItem from '../exams/ExamAccordionItem.js';
import EmptyState from '../../components/EmptyState.js';

interface UnitAccordionProps {
  courseId: string;
  units: Unit[];
  canEdit: boolean;
  progress: CourseProgress | null;
  onAddLesson: (unitId: string, data: { title: string; description?: string; order: number }) => Promise<void>;
}

export default function UnitAccordion({ courseId, units, canEdit, progress, onAddLesson }: UnitAccordionProps) {
  const sorted = [...units].sort((a, b) => a.order - b.order);
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(
    sorted.length > 0 ? sorted[0].id : null,
  );

  if (units.length === 0) {
    return <EmptyState icon={<Layers className="w-8 h-8" />} title="No units yet" description="Add a unit to organize your lessons." />;
  }

  function handleToggle(unitId: string) {
    setExpandedUnitId(prev => (prev === unitId ? null : unitId));
  }

  const allUnitsMastered =
    progress !== null &&
    progress !== undefined &&
    progress.totalUnits > 0 &&
    progress.completedUnits === progress.totalUnits;

  return (
    <div className="flex flex-col gap-2">
      {sorted.map(unit => (
        <UnitAccordionItem
          key={unit.id}
          courseId={courseId}
          unit={unit}
          canEdit={canEdit}
          isExpanded={expandedUnitId === unit.id}
          onToggle={() => handleToggle(unit.id)}
          onAddLesson={onAddLesson}
          unitProgress={progress?.units.find(u => u.unitId === unit.id) ?? null}
        />
      ))}
      <ExamAccordionItem
        courseId={courseId}
        allUnitsMastered={allUnitsMastered}
        progress={progress}
        canEdit={canEdit}
      />
    </div>
  );
}
