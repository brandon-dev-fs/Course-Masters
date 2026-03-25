import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Course } from '../../api/types.js';

interface CourseDropdownProps {
  courses: Course[];
  currentCourseId: string;
  courseTitle: string;
}

export default function CourseDropdown({ courses, currentCourseId, courseTitle }: CourseDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleSelect(courseId: string) {
    setOpen(false);
    if (courseId !== currentCourseId) {
      navigate(`/courses/${courseId}`);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-1.5 group"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <h1 className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
          {courseTitle}
        </h1>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground group-hover:text-primary transition-all ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full mt-2 z-50 min-w-64 max-w-xs rounded-xl border border-border bg-surface shadow-warm-lg overflow-hidden"
        >
          <div className="py-1 max-h-72 overflow-y-auto">
            {courses.map(course => (
              <button
                key={course.id}
                role="option"
                aria-selected={course.id === currentCourseId}
                onClick={() => handleSelect(course.id)}
                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-surface-raised transition-colors"
              >
                <span className={`text-sm truncate ${course.id === currentCourseId ? 'font-semibold text-primary' : 'text-foreground'}`}>
                  {course.title}
                </span>
                {course.id === currentCourseId && (
                  <Check className="w-4 h-4 text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
