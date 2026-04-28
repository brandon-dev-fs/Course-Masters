import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { lessonsApi } from '../../api/lessons.js';
import type { Unit } from '../../api/types.js';

interface UnitDropdownProps {
  units: Unit[];
  currentUnitId: string;
  courseId: string;
}

export default function UnitDropdown({ units, currentUnitId, courseId }: UnitDropdownProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const sorted = [...units].sort((a, b) => a.order - b.order);
  const current = units.find(u => u.id === currentUnitId);

  async function handleSelect(unitId: string) {
    if (unitId === currentUnitId) { setOpen(false); return; }
    setNavigating(true);
    setOpen(false);
    try {
      const lessons = await lessonsApi.getAll(unitId);
      const sorted = lessons.sort((a, b) => a.order - b.order);
      if (sorted[0]) {
        navigate(`/courses/${courseId}/units/${unitId}/lessons/${sorted[0].id}`);
      }
    } finally {
      setNavigating(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={navigating}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-surface-raised hover:bg-surface-raised/80 text-foreground transition-colors"
      >
        <span className="truncate">{navigating ? 'Loading…' : (current?.title ?? 'Select Unit')}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-lg border border-border bg-surface shadow-warm-md overflow-hidden">
            {sorted.map(unit => (
              <button
                key={unit.id}
                onClick={() => handleSelect(unit.id)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-surface-raised ${
                  unit.id === currentUnitId ? 'text-primary font-medium bg-primary-subtle' : 'text-foreground'
                }`}
              >
                {unit.order}. {unit.title}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
