import { useRef, useState, useEffect, useCallback } from 'react';
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Unit, CourseProgress } from '../../api/types.js';
import UnitCard from './UnitCard.js';
import ExamCard from '../exams/ExamCard.js';
import EmptyState from '../../components/EmptyState.js';
import { Layers } from 'lucide-react';

interface UnitCardStripProps {
  courseId: string;
  units: Unit[];
  canEdit: boolean;
  progress: CourseProgress | null;
}

export default function UnitCardStrip({ courseId, units, canEdit, progress }: UnitCardStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const sorted = [...units].sort((a, b) => a.order - b.order);
  const allUnitsMastered =
    progress ? progress.completedUnits === progress.totalUnits && progress.totalUnits > 0 : false;

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState, sorted.length]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  function scrollLeft() {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: -(el.clientWidth * 0.7), behavior: 'smooth' });
  }

  function scrollRight() {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * 0.7, behavior: 'smooth' });
  }

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={<Layers className="w-8 h-8" />}
        title="No units yet"
        description={canEdit ? 'Add a unit to get started.' : 'No units have been added yet.'}
      />
    );
  }

  function Connector() {
    if (isMobile) {
      return (
        <div className="flex justify-center py-1">
          <ChevronDown className="w-5 h-5 text-muted-foreground/50" />
        </div>
      );
    }
    return (
      <div className="flex items-center shrink-0 self-center px-1">
        <ArrowRight className="w-5 h-5 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Left fade + button (desktop only) */}
      {!isMobile && canScrollLeft && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none rounded-l-2xl" />
          <button
            onClick={scrollLeft}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-surface border border-border shadow-warm-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex flex-col md:flex-row md:items-stretch gap-2 md:gap-0 overflow-x-auto scroll-smooth scrollbar-hide pb-1"
      >
        {sorted.map((unit, index) => {
          const unitProgress = progress?.units.find((u) => u.unitId === unit.id) ?? null;
          return (
            <div key={unit.id} className="flex flex-col md:flex-row md:items-center">
              {index > 0 && <Connector />}
              <UnitCard
                courseId={courseId}
                unit={unit}
                unitProgress={unitProgress}
              />
            </div>
          );
        })}

        {/* Arrow + exam card */}
        <div className="flex flex-col md:flex-row md:items-center">
          <Connector />
          <ExamCard
            courseId={courseId}
            allUnitsMastered={allUnitsMastered}
            progress={progress}
            canEdit={canEdit}
          />
        </div>
      </div>

      {/* Right fade + button (desktop only) */}
      {!isMobile && canScrollRight && (
        <>
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none rounded-r-2xl" />
          <button
            onClick={scrollRight}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-surface border border-border shadow-warm-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}
