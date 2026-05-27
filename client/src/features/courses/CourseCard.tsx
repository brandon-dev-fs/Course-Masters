import { Link } from 'react-router-dom';
import { BookOpen, FlaskConical, Music, LayoutGrid } from 'lucide-react';

import type { Course } from '../../api/types.js';

import { getCourseCategory } from './CourseFilters.js';
import type { CourseCategory } from './CourseFilters.js';
import CourseCardMenu from './CourseCardMenu.js';

interface CourseCardProps {
  course: Course;
  index?: number;
  canEdit?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

// Icon color variants by index % 3
const ICON_VARIANTS = [
  {
    containerClass: 'bg-green-surface',
    iconClass: 'text-green-primary',
    Icon: BookOpen,
  },
  {
    containerClass: 'bg-blue-surface',
    iconClass: 'text-blue-accent',
    Icon: FlaskConical,
  },
  {
    containerClass: 'bg-orange-surface',
    iconClass: 'text-orange-surface-text',
    Icon: Music,
  },
] as const;

// Category pill colors
const CATEGORY_PILL_CLASS: Record<CourseCategory, string> = {
  Mathematics: 'bg-blue-surface text-blue-surface-text',
  Science: 'bg-green-surface text-green-surface-text',
  Language: 'bg-orange-surface text-orange-surface-text',
  Music: 'bg-blue-surface text-blue-surface-text',
  Other: 'bg-surface border border-border-subtle text-text-secondary',
};

export default function CourseCard({
  course,
  index = 0,
  canEdit = true,
  onEdit,
  onDelete,
}: CourseCardProps) {
  const unitCount = course._count?.units ?? 0;
  const variant = ICON_VARIANTS[index % 3];
  const { Icon } = variant;
  const category = getCourseCategory(course.title);
  const categoryPillClass = CATEGORY_PILL_CLASS[category];

  return (
    <div className="rounded-2xl bg-surface border border-border-subtle shadow-warm-sm hover:shadow-warm-md hover:-translate-y-0.5 transition-all overflow-hidden flex flex-row md:flex-col p-4 gap-3">
      {/* Icon + menu row (desktop: full-width row; mobile: icon column) */}
      <div className="flex items-start justify-between gap-2 md:mb-3 shrink-0 md:w-full">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${variant.containerClass}`}
        >
          <Icon
            className={`w-6 h-6 ${variant.iconClass}`}
            aria-hidden="true"
          />
        </div>
        {canEdit && (
          <div className="md:block">
            <CourseCardMenu onEdit={onEdit} onDelete={onDelete} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 min-w-0">
        <Link
          to={`/courses/${course.id}`}
          className="text-base font-semibold text-text-primary hover:text-green-primary transition-colors mb-1"
        >
          {course.title}
        </Link>

        {course.description && (
          <p className="text-sm text-text-secondary line-clamp-2 mb-3">
            {course.description}
          </p>
        )}

        {/* Category pill */}
        <span
          className={`inline-block self-start text-xs font-semibold px-2.5 py-0.5 rounded-full mb-3 ${categoryPillClass}`}
        >
          {category}
        </span>

        {/* Footer: unit count */}
        <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-auto pt-3 border-t border-border-subtle">
          <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
          <span>
            {unitCount} {unitCount === 1 ? 'unit' : 'units'}
          </span>
        </div>
      </div>
    </div>
  );
}
