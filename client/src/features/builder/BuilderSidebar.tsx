import { Calendar, FileText, Users, Settings } from 'lucide-react';

import type { BuilderOutline } from '../../api/types.js';

interface BuilderSidebarProps {
  outline: BuilderOutline;
}

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
}

function QuickAction({ icon, label }: QuickActionProps) {
  return (
    <button
      type="button"
      disabled
      title="Coming soon"
      aria-label={`${label} (coming soon)`}
      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground rounded-lg
        cursor-not-allowed opacity-60 hover:bg-surface transition-colors"
    >
      <span className="w-4 h-4 shrink-0" aria-hidden="true">{icon}</span>
      {label}
      <span className="ml-auto text-xs bg-surface border border-border-subtle px-1.5 py-0.5 rounded-full">
        Soon
      </span>
    </button>
  );
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
        {/* Course Details */}
        <div className="bg-surface rounded-xl border border-border-subtle p-5 shadow-warm-sm">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Course Details
          </h2>

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

        {/* Quick Actions */}
        <div className="bg-surface rounded-xl border border-border-subtle p-5 shadow-warm-sm">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Quick Actions
          </h2>

          <div className="flex flex-col gap-1">
            <QuickAction icon={<Calendar className="w-4 h-4" />} label="Calendar" />
            <QuickAction icon={<FileText className="w-4 h-4" />} label="Syllabus" />
            <QuickAction icon={<Users className="w-4 h-4" />} label="Manage Students" />
            <QuickAction icon={<Settings className="w-4 h-4" />} label="Course Settings" />
          </div>
        </div>
      </div>
    </aside>
  );
}
