import { Calendar, Settings, User, LayoutGrid, BookOpen } from 'lucide-react';
import { Calculator, FlaskConical, Languages, Music, GraduationCap } from 'lucide-react';

import type { Course } from '../../api/types.js';

import { getCourseCategory } from './CourseFilters.js';
import type { CourseCategory } from './CourseFilters.js';
import CourseDropdown from './CourseDropdown.js';

interface CourseHeaderProps {
  course: Course;
  courses: Course[];
  canEdit: boolean;
  onOpenSettings: () => void;
  onOpenCalendar: () => void;
}

const CATEGORY_ICON: Record<CourseCategory, typeof BookOpen> = {
  Mathematics: Calculator,
  Science: FlaskConical,
  Language: Languages,
  Music: Music,
  Other: GraduationCap,
};

export default function CourseHeader({
  course,
  courses,
  canEdit,
  onOpenSettings,
  onOpenCalendar,
}: CourseHeaderProps) {
  const category = getCourseCategory(course.title);
  const Icon = CATEGORY_ICON[category];

  const unitCount = course.units?.length ?? course._count?.units ?? 0;
  const lessonCount = course.units?.reduce(
    (sum, unit) => sum + (unit.lessons?.length ?? unit._count?.lessons ?? 0),
    0
  ) ?? 0;

  return (
    <div className="bg-surface border border-border-subtle rounded-xl p-4 shadow-warm-sm relative">
      {/* Top-right action buttons */}
      <div className="absolute top-3 right-3 flex items-center gap-1">
        <button
          type="button"
          onClick={onOpenCalendar}
          aria-label="Open course calendar"
          className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-accent"
        >
          <Calendar className="w-4 h-4" aria-hidden="true" />
        </button>
        {canEdit && (
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Course settings"
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-accent"
          >
            <Settings className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Icon + title row */}
      <div className="flex items-center gap-3 pr-20">
        <div className="p-2 rounded-lg bg-green-surface text-green-primary shrink-0">
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
        <CourseDropdown
          courses={courses}
          currentCourseId={course.id}
          courseTitle={course.title}
        />
      </div>

      {/* Description */}
      {course.description && (
        <p className="mt-2 text-sm text-text-primary line-clamp-2">
          {course.description}
        </p>
      )}

      {/* Meta row */}
      <div className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary flex-wrap">
        {course.author && (
          <>
            <User className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{course.author.name}</span>
            <span aria-hidden="true">·</span>
          </>
        )}
        <LayoutGrid className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>
          {unitCount} {unitCount === 1 ? 'unit' : 'units'}
        </span>
        <span aria-hidden="true">·</span>
        <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>
          {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}
        </span>
      </div>
    </div>
  );
}
