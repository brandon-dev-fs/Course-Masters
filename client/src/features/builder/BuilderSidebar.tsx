import type { BuilderOutline } from '../../api/types.js';

interface BuilderSidebarProps {
  outline: BuilderOutline;
}

export default function BuilderSidebar({ outline }: BuilderSidebarProps) {
  const unitCount = outline.units.length;
  const lessonCount = outline.units.reduce((sum, u) => sum + u.lessons.length, 0);
  const activityCount = outline.units.reduce(
    (sum, u) => sum + u.lessons.reduce((ls, l) => ls + l.assignments.length, 0),
    0,
  );
  const unitTestCount = outline.units.filter((u) => u.assessment !== null).length;
  const hasExam = outline.courseAssessment !== null;

  return (
    <aside className="hidden lg:block w-80 shrink-0">
      <div className="sticky top-24 flex flex-col gap-4">
        {/* Course title */}
        <div className="bg-surface rounded-xl border border-border-subtle p-5 shadow-warm-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Course</p>
          <p className="text-sm font-semibold text-text-primary">{outline.course.title}</p>
          {outline.course.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{outline.course.description}</p>
          )}
        </div>

        {/* Structure stats */}
        <div className="bg-surface rounded-xl border border-border-subtle p-5 shadow-warm-sm">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Structure
          </h3>

          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Units</dt>
              <dd className="font-semibold text-text-primary">{unitCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Lessons</dt>
              <dd className="font-semibold text-text-primary">{lessonCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Activities</dt>
              <dd className="font-semibold text-text-primary">{activityCount}</dd>
            </div>
            <div className="border-t border-border-subtle pt-2 mt-1 flex justify-between">
              <dt className="text-muted-foreground">Unit tests</dt>
              <dd className="font-semibold text-text-primary">{unitTestCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Course exam</dt>
              <dd className={`font-semibold ${hasExam ? 'text-green-primary' : 'text-muted-foreground'}`}>
                {hasExam ? 'Yes' : 'Not set'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </aside>
  );
}
