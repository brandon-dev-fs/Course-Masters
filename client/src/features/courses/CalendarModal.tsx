import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../../components/Modal.js';
import MonthGrid from './MonthGrid.js';
import type { Course, CourseProgress } from '../../api/types.js';
import type { UnitMarker } from './MonthGrid.js';

const UNIT_COLORS = [
  '#138808', // primary green
  '#085287', // accent blue
  '#b45309', // amber
  '#7c3aed', // violet
  '#0891b2', // cyan
  '#be185d', // pink
  '#16a34a', // emerald
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface CalendarModalProps {
  course: Course;
  progress: CourseProgress | null;
  onClose: () => void;
}

export default function CalendarModal({ course, progress, onClose }: CalendarModalProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  // Build a sorted unit list from course units (prefer) or progress units
  const rawUnits = course.units
    ? course.units.map((u) => ({ id: u.id, title: u.title, order: u.order }))
    : (progress?.units.map((u) => ({ id: u.unitId, title: u.title, order: u.order })) ?? []);
  const sortedUnits = [...rawUnits].sort((a, b) => a.order - b.order);

  const markers: UnitMarker[] = sortedUnits.map((unit, i) => ({
    label: `${unit.order}. ${unit.title}`,
    color: UNIT_COLORS[i % UNIT_COLORS.length],
    weekIndex: i % 5, // spread across ~5 weeks
  }));

  return (
    <Modal title={`Course Calendar — ${course.title}`} onClose={onClose} size="lg">
      <div className="flex flex-col gap-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-base font-semibold text-foreground">
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar grid */}
        <div className="rounded-xl border border-border bg-surface-raised p-4">
          <MonthGrid year={year} month={month} markers={markers} />
        </div>

        {/* Legend */}
        {markers.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Units</p>
            <div className="flex flex-wrap gap-2">
              {markers.map((m, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full text-white font-medium"
                  style={{ backgroundColor: m.color }}
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground italic">
          Due dates coming soon — this calendar currently shows a suggested schedule.
        </p>
      </div>
    </Modal>
  );
}
