import { Link } from 'react-router-dom';
import type { Course } from '../../api/types.js';

interface CourseCardProps {
  course: Course;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CourseCard({ course, onEdit, onDelete }: CourseCardProps) {
  return (
    <div className="rounded-xl bg-surface border border-border p-5 flex flex-col gap-3 hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <Link to={`/courses/${course.id}`} className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
          {course.title}
        </Link>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-surface-raised transition-colors">
            Edit
          </button>
          <button onClick={onDelete} className="text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded hover:bg-surface-raised transition-colors">
            Delete
          </button>
        </div>
      </div>
      {course.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
      )}
      <p className="text-xs text-muted-foreground">
        {course._count?.units ?? 0} {course._count?.units === 1 ? 'unit' : 'units'}
      </p>
    </div>
  );
}
