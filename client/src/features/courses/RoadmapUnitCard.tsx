import type { Unit, CourseProgress } from '../../api/types.js';

import type { UnitState } from './UnitRoadmap.js';

interface RoadmapUnitCardProps {
  courseId: string;
  unit: Unit;
  unitProgress: CourseProgress['units'][number] | undefined;
  state: UnitState;
  canEdit: boolean;
  onEditUnit: () => void;
}

export default function RoadmapUnitCard({ unit }: RoadmapUnitCardProps) {
  return <div className="p-2 text-text-secondary text-sm">{unit.title}</div>;
}
