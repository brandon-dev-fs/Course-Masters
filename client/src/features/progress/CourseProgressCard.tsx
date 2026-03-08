import { useEffect, useState } from 'react';
import { progressApi } from '../../api/progress.js';
import type { CourseProgress } from '../../api/types.js';
import ProgressBar from './ProgressBar.js';

export default function CourseProgressCard({ courseId }: { courseId: string }) {
  const [progress, setProgress] = useState<CourseProgress | null>(null);

  useEffect(() => {
    progressApi.getCourse(courseId).then(setProgress).catch(() => {});
  }, [courseId]);

  if (!progress) return null;

  return (
    <div className="rounded-2xl bg-surface border border-border p-5 mb-6 shadow-warm-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Course Progress</h3>
        <span className="text-sm font-bold text-primary">{progress.percentComplete}%</span>
      </div>
      <ProgressBar percent={progress.percentComplete} className="mb-4" />
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-surface-raised rounded-xl border border-border p-3">
          <p className="text-lg mb-1">📖</p>
          <p className="text-xl font-bold text-foreground">{progress.completedLessons}/{progress.totalLessons}</p>
          <p className="text-xs text-muted-foreground">Lessons</p>
        </div>
        <div className="bg-surface-raised rounded-xl border border-border p-3">
          <p className="text-lg mb-1">📦</p>
          <p className="text-xl font-bold text-foreground">{progress.completedUnits}/{progress.totalUnits}</p>
          <p className="text-xs text-muted-foreground">Units</p>
        </div>
        <div className="bg-surface-raised rounded-xl border border-border p-3">
          <p className="text-lg mb-1">🎓</p>
          <p className={`text-xl font-bold ${progress.examPassed ? 'text-accent' : 'text-muted-foreground'}`}>
            {progress.examPassed ? '✓' : '—'}
          </p>
          <p className="text-xs text-muted-foreground">Exam</p>
        </div>
      </div>
    </div>
  );
}
