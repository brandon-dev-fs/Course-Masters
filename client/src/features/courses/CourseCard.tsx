import { Link } from 'react-router-dom';
import { Pencil, X } from 'lucide-react';
import type { Course } from '../../api/types.js';

interface CourseCardProps {
  course: Course;
  canEdit?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CourseCard({ course, canEdit = true, onEdit, onDelete }: CourseCardProps) {
  const unitCount = course._count?.units ?? 0;

  return (
    <div className="group rounded-2xl bg-surface border border-border flex flex-col shadow-warm-sm hover:shadow-warm-md hover:-translate-y-0.5 transition-all overflow-hidden">
      <div className="h-1.5 bg-primary" />
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/courses/${course.id}`} className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
            {course.title}
          </Link>
          {canEdit && (
            <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={onEdit}
                className="text-muted-foreground hover:text-foreground w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-raised transition-colors"
                aria-label="Edit course"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onDelete}
                className="text-muted-foreground hover:text-destructive w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-raised transition-colors"
                aria-label="Delete course"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        {course.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
        )}
        <div className="mt-auto">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-subtle text-primary">
            {unitCount} {unitCount === 1 ? 'unit' : 'units'}
          </span>
        </div>
      </div>
    </div>
  );
}
