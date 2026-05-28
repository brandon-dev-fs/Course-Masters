import { Link } from 'react-router-dom';

import { Check, Lock, Trophy } from 'lucide-react';

import type { Unit, CourseProgress } from '../../api/types.js';

import RoadmapUnitCard from './RoadmapUnitCard.js';

import EmptyState from '../../components/EmptyState.js';

export type UnitState = 'completed' | 'in-progress' | 'locked';

interface UnitRoadmapProps {
  courseId: string;
  units: Unit[];
  progress: CourseProgress | null;
  canEdit: boolean;
  onEditUnit: (unit: Unit) => void;
}

function computeUnitStates(
  units: Unit[],
  progress: CourseProgress | null,
): Array<{ unit: Unit; state: UnitState }> {
  const sorted = [...units].sort((a, b) => a.order - b.order);
  let foundInProgress = false;

  return sorted.map((unit) => {
    const unitProg = progress?.units.find((u) => u.unitId === unit.id);
    const isComplete = unitProg?.isComplete ?? false;

    if (isComplete) {
      return { unit, state: 'completed' as const };
    }

    if (!foundInProgress) {
      foundInProgress = true;
      return { unit, state: 'in-progress' as const };
    }

    return { unit, state: 'locked' as const };
  });
}

function StateDot({ state }: { state: UnitState }) {
  if (state === 'completed') {
    return (
      <div className="w-6 h-6 rounded-full bg-green-primary flex items-center justify-center">
        <Check className="w-3.5 h-3.5 text-white" />
      </div>
    );
  }

  if (state === 'in-progress') {
    return <div className="w-6 h-6 rounded-full bg-blue-accent border-2 border-blue-accent" />;
  }

  return (
    <div className="w-6 h-6 rounded-full bg-surface border-2 border-border-subtle flex items-center justify-center">
      <Lock className="w-3 h-3 text-text-secondary" />
    </div>
  );
}

export default function UnitRoadmap({
  courseId,
  units,
  progress,
  canEdit,
  onEditUnit,
}: UnitRoadmapProps) {
  if (units.length === 0) {
    return (
      <EmptyState
        title="No units yet"
        description="This course has no units. Add a unit to get started."
      />
    );
  }

  const entries = computeUnitStates(units, progress);

  const allUnitsComplete =
    (progress?.completedUnits ?? 0) === (progress?.totalUnits ?? 1) &&
    (progress?.totalUnits ?? 0) > 0;

  return (
    <div>
      <ol aria-label="Course units" className="relative flex flex-col gap-0">
        {entries.map(({ unit, state }, index) => (
          <li key={unit.id} className="relative flex gap-4">
            {/* Dot column */}
            <div className="flex flex-col items-center">
              <StateDot state={state} />
              {index < entries.length - 1 && (
                <div aria-hidden="true" className="w-0.5 flex-1 bg-border-subtle mt-1" />
              )}
            </div>

            {/* Content column */}
            <div className="flex-1 pb-6">
              <RoadmapUnitCard
                courseId={courseId}
                unit={unit}
                unitProgress={progress?.units.find((u) => u.unitId === unit.id)}
                state={state}
                canEdit={canEdit}
                onEditUnit={() => onEditUnit(unit)}
              />
            </div>
          </li>
        ))}
      </ol>

      {/* Final Exam item */}
      <div className={allUnitsComplete ? undefined : 'opacity-60'}>
        {allUnitsComplete ? (
          <Link
            to="#exam"
            className="flex items-center gap-2 text-text-primary font-medium"
          >
            <Trophy className="w-4 h-4" />
            <span>Final exam</span>
          </Link>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-text-primary font-medium">
              <Trophy className="w-4 h-4" />
              <span>Final exam</span>
              <Lock className="w-4 h-4 text-text-secondary" />
            </div>
            <p className="text-sm text-text-secondary">Complete all units to unlock</p>
          </div>
        )}
      </div>
    </div>
  );
}
