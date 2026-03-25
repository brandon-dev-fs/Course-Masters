import { Settings, CheckCircle2, Circle, User } from 'lucide-react';
import type { Course, CourseProgress } from '../../api/types.js';
import CourseDropdown from './CourseDropdown.js';

interface CourseHeroProps {
  course: Course;
  progress: CourseProgress | null;
  courses: Course[];
  canEdit: boolean;
  onOpenSettings: () => void;
}

export default function CourseHero({
  course,
  progress,
  courses,
  canEdit,
  onOpenSettings,
}: CourseHeroProps) {
  return (
    <div className="w-full bg-surface border border-border rounded-2xl overflow-hidden mb-6 shadow-warm-md">
      {/* Hero header — title + description */}
      <div className="px-6 pt-6 pb-5 border-b border-border">
        <div className="flex items-start justify-between gap-4 mb-3">
          <CourseDropdown
            courses={courses}
            currentCourseId={course.id}
            courseTitle={course.title}
          />
          {canEdit && (
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors shrink-0 mt-1"
              aria-label="Course settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
        {course.description && (
          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
            {course.description}
          </p>
        )}
        {course.author && (
          <div className="flex items-center gap-1.5 mt-3">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Taught by <span className="font-medium text-foreground">{course.author.name}</span>
            </span>
          </div>
        )}
      </div>

      {/* Unit progress tracker */}
      {progress && progress.units.length > 0 && (
        <div className="px-6 py-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Unit Progress
          </p>

          {/* Horizontal on md+ */}
          <div className="hidden md:flex items-center">
            {progress.units.map((unit) => (
              <div key={unit.unitId} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  {unit.isComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span
                    className={`text-xs text-center max-w-20 leading-tight ${
                      unit.isComplete ? 'text-foreground font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    {unit.title}
                  </span>
                </div>
                <div className={`flex-1 h-px mx-2 mb-5 ${unit.isComplete ? 'bg-primary/40' : 'bg-border'}`} />
              </div>
            ))}
            {/* Final exam terminal node */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              {progress.examPassed ? (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground" />
              )}
              <span className={`text-xs text-center max-w-20 leading-tight ${progress.examPassed ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                Final Exam
              </span>
            </div>
          </div>

          {/* Vertical on small screens */}
          <div className="flex md:hidden flex-col gap-0">
            {progress.units.map((unit, index) => (
              <div key={unit.unitId} className="flex flex-col items-start">
                {index > 0 && (
                  <div className={`w-px h-3 ml-2.5 ${progress.units[index - 1].isComplete ? 'bg-primary/40' : 'bg-border'}`} />
                )}
                <div className="flex items-center gap-3">
                  {unit.isComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                  )}
                  <span className={`text-sm ${unit.isComplete ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {unit.title}
                  </span>
                </div>
              </div>
            ))}
            {/* Final exam terminal node */}
            <div className="flex flex-col items-start">
              <div className={`w-px h-3 ml-2.5 ${progress.completedUnits === progress.totalUnits && progress.totalUnits > 0 ? 'bg-primary/40' : 'bg-border'}`} />
              <div className="flex items-center gap-3">
                {progress.examPassed ? (
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                )}
                <span className={`text-sm ${progress.examPassed ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  Final Exam
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
