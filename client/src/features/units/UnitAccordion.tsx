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
}

export default function UnitAccordion({ courseId, units, canEdit, progress }: UnitAccordionProps) {
  const sorted = [...units].sort((a, b) => a.order - b.order);
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(
    sorted.length > 0 ? sorted[0].id : null,
  );

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
      {units.length === 0 ? (
        <EmptyState icon={<Layers className="w-8 h-8" />} title="No units yet" description="Add a unit to organize your lessons." />
      ) : (
        sorted.map(unit => (
          <UnitAccordionItem
            key={unit.id}
            courseId={courseId}
            unit={unit}
            canEdit={canEdit}
            isExpanded={expandedUnitId === unit.id}
            onToggle={() => handleToggle(unit.id)}
            unitProgress={progress?.units.find(u => u.unitId === unit.id) ?? null}
          />
        ))
      )}
      <ExamAccordionItem
        courseId={courseId}
        allUnitsMastered={allUnitsMastered}
        progress={progress}
        canEdit={canEdit}
      />
    </div>
  );
}
