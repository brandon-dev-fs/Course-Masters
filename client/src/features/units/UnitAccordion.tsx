import { useState } from 'react';
import { Layers } from 'lucide-react';
import type { Unit } from '../../api/types.js';
import UnitAccordionItem from './UnitAccordionItem.js';
import EmptyState from '../../components/EmptyState.js';

interface UnitAccordionProps {
  courseId: string;
  units: Unit[];
  onAddLesson: (unitId: string, data: { title: string; description?: string; order: number }) => Promise<void>;
}

export default function UnitAccordion({ courseId, units, onAddLesson }: UnitAccordionProps) {
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);

  if (units.length === 0) {
    return <EmptyState icon={<Layers className="w-8 h-8" />} title="No units yet" description="Add a unit to organize your lessons." />;
  }

  const sorted = [...units].sort((a, b) => a.order - b.order);

  function handleToggle(unitId: string) {
    setExpandedUnitId(prev => (prev === unitId ? null : unitId));
  }

  return (
    <div className="flex flex-col gap-2">
      {sorted.map(unit => (
        <UnitAccordionItem
          key={unit.id}
          courseId={courseId}
          unit={unit}
          isExpanded={expandedUnitId === unit.id}
          onToggle={() => handleToggle(unit.id)}
          onAddLesson={onAddLesson}
        />
      ))}
    </div>
  );
}
