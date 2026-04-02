import { Link } from 'react-router-dom';
import { Settings, User, Calendar, ArrowRight, BookOpen } from 'lucide-react';
import type { Course, CourseProgress } from '../../api/types.js';
import CourseDropdown from './CourseDropdown.js';

interface CourseHeroProps {
  course: Course;
  progress: CourseProgress | null;
  courses: Course[];
  canEdit: boolean;
  onOpenSettings: () => void;
  onOpenCalendar: () => void;
}

function getCtaDestination(course: Course, progress: CourseProgress | null): { to: string; label: string } | null {
  const sortedUnits = [...(course.units ?? [])].sort((a, b) => a.order - b.order);
  if (sortedUnits.length === 0) return null;

  const hasStarted =
    progress !== null &&
    (progress.completedLessons > 0 || progress.units.some((u) => u.lessons.some((l) => l.attempted)));

  if (!hasStarted) {
    // Start Learning → unit 1, lesson 1
    const firstUnit = sortedUnits[0];
    const firstLesson = [...(firstUnit.lessons ?? [])].sort((a, b) => a.order - b.order)[0];
    if (!firstLesson) return null;
    return {
      to: `/courses/${course.id}/units/${firstUnit.id}/lessons/${firstLesson.id}`,
      label: 'Start Learning',
    };
  }

  // Continue → find first incomplete lesson
  for (const unit of sortedUnits) {
    const unitProg = progress?.units.find((u) => u.unitId === unit.id);
    const sortedLessons = [...(unit.lessons ?? [])].sort((a, b) => a.order - b.order);
    for (const lesson of sortedLessons) {
      const lessonProg = unitProg?.lessons.find((l) => l.lessonId === lesson.id);
      if (!lessonProg?.quizPassed) {
        return {
          to: `/courses/${course.id}/units/${unit.id}/lessons/${lesson.id}`,
          label: 'Continue Learning',
        };
      }
    }
  }

  return null;
}

export default function CourseHero({
  course,
  progress,
  courses,
  canEdit,
  onOpenSettings,
  onOpenCalendar,
}: CourseHeroProps) {
  const cta = getCtaDestination(course, progress);

  return (
    <div className="w-full bg-surface border-b border-border mb-6">
      <div className="container mx-auto px-6 pt-6 pb-5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <CourseDropdown
            courses={courses}
            currentCourseId={course.id}
            courseTitle={course.title}
          />
          <div className="flex items-center gap-1 shrink-0 mt-1">
            <button
              onClick={onOpenCalendar}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
              aria-label="Course calendar"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-medium">Calendar</span>
            </button>
            {canEdit && (
              <button
                onClick={onOpenSettings}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
                aria-label="Course settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        {course.description && (
          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
            {course.description}
          </p>
        )}

        {/* Author */}
        {course.author && (
          <div className="flex items-center gap-1.5 mt-2">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Taught by <span className="font-medium text-foreground">{course.author.name}</span>
            </span>
          </div>
        )}

        {/* CTA */}
        {cta && (
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
            <Link
              to={cta.to}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-xl hover:brightness-110 transition-all"
            >
              <BookOpen className="w-4 h-4" />
              {cta.label}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
