import { BookOpen, Play, FileText, Languages, Layers, PenTool, ClipboardCheck, Dumbbell } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarGroup {
  key: string;
  label: string;
  icon: LucideIcon;
  items: SidebarItem[];
}

const LESSON_NAV_GROUPS: SidebarGroup[] = [
  {
    key: 'learn',
    label: 'Learn',
    icon: BookOpen,
    items: [
      { id: 'videos', label: 'Videos', icon: Play },
      { id: 'notes', label: 'Lecture Notes', icon: FileText },
      { id: 'vocab', label: 'Vocabulary', icon: Languages },
    ],
  },
  {
    key: 'practice',
    label: 'Practice',
    icon: Dumbbell,
    items: [
      { id: 'flashcards', label: 'Flash Cards', icon: Layers },
      { id: 'practice', label: 'Practice Problems', icon: PenTool },
    ],
  },
  {
    key: 'assess',
    label: 'Assess',
    icon: ClipboardCheck,
    items: [
      { id: 'quiz', label: 'Quiz', icon: ClipboardCheck },
    ],
  },
];

interface LessonSidebarProps {
  activeSection: string;
  onSectionChange: (id: string) => void;
}

export default function LessonSidebar({ activeSection, onSectionChange }: LessonSidebarProps) {
  return (
    <nav
      aria-label="Lesson sections"
      className="shrink-0 border-border bg-surface
        flex flex-row overflow-x-auto border-b pb-0
        lg:flex-col lg:w-52 lg:border-b-0 lg:border-r lg:overflow-x-visible lg:overflow-y-auto lg:py-2 lg:-ml-6 lg:pl-6 lg:pr-2"
    >
      {/* Mobile: flat scrollable list of all items */}
      <div className="flex flex-row gap-1 px-2 py-2 lg:hidden">
        {LESSON_NAV_GROUPS.flatMap(group =>
          group.items.map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-primary-subtle text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            );
          })
        )}
      </div>

      {/* Desktop: grouped vertical nav */}
      <div className="hidden lg:flex lg:flex-col lg:gap-4 lg:py-1">
        {LESSON_NAV_GROUPS.map((group, i) => {
          const GroupIcon = group.icon;
          return (
          <div key={group.key}>
            {i > 0 && <div className="border-t border-border mx-1 mb-3" />}
            <div className="flex items-center gap-2 px-3 py-1.5 mb-1">
              <GroupIcon className="w-4 h-4 text-foreground" />
              <span className="text-sm font-bold text-foreground tracking-wide">{group.label}</span>
            </div>
            {group.items.map(item => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-sm transition-colors text-left ${
                    isActive
                      ? 'bg-primary-subtle text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>
          );
        })}
      </div>
    </nav>
  );
}
