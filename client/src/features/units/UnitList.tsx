import { Link } from 'react-router-dom';
import type { Unit } from '../../api/types.js';
import EmptyState from '../../components/EmptyState.js';

interface UnitListProps {
  courseId: string;
  units: Unit[];
  onEdit: (unit: Unit) => void;
  onDelete: (unit: Unit) => void;
}

export default function UnitList({ courseId, units, onEdit, onDelete }: UnitListProps) {
  if (units.length === 0) {
    return <EmptyState icon="📦" title="No units yet" description="Add a unit to organize your lessons." />;
  }

  const sorted = [...units].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col gap-2">
      {sorted.map(unit => (
        <div key={unit.id} className="flex items-center justify-between rounded-xl bg-surface border border-border px-4 py-3 shadow-warm-sm hover:shadow-warm-md hover:-translate-y-px hover:border-primary/40 transition-all">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary-subtle text-primary text-xs font-bold shrink-0">
              {unit.order}
            </span>
            <Link to={`/courses/${courseId}/units/${unit.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
              {unit.title}
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{unit._count?.lessons ?? 0} lessons</span>
            <div className="flex gap-1">
              <button onClick={() => onEdit(unit)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-surface-raised transition-colors">Edit</button>
              <button onClick={() => onDelete(unit)} className="text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded hover:bg-surface-raised transition-colors">Delete</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
