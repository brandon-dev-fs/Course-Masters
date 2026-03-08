import { useEffect, useState } from 'react';
import { progressApi } from '../../api/progress.js';
import type { UnitProgress } from '../../api/types.js';
import ProgressBar from './ProgressBar.js';

export default function UnitProgressCard({ courseId, unitId }: { courseId: string; unitId: string }) {
  const [progress, setProgress] = useState<UnitProgress | null>(null);

  useEffect(() => {
    progressApi.getUnit(courseId, unitId).then(setProgress).catch(() => {});
  }, [courseId, unitId]);

  if (!progress) return null;

  return (
    <div className="rounded-2xl bg-surface border border-border p-5 mb-6 shadow-warm-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Unit Progress</h3>
        <span className="text-sm font-bold text-primary">{progress.percentComplete}%</span>
      </div>
      <ProgressBar percent={progress.percentComplete} className="mb-4" />
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="bg-surface-raised rounded-xl border border-border p-3">
          <p className="text-lg mb-1">📖</p>
          <p className="text-xl font-bold text-foreground">{progress.completedLessons}/{progress.totalLessons}</p>
          <p className="text-xs text-muted-foreground">Lessons Passed</p>
        </div>
        <div className="bg-surface-raised rounded-xl border border-border p-3">
          <p className="text-lg mb-1">📝</p>
          <p className={`text-xl font-bold ${progress.testPassed ? 'text-accent' : 'text-muted-foreground'}`}>
            {progress.testPassed ? '✓ Passed' : '— Pending'}
          </p>
          <p className="text-xs text-muted-foreground">Unit Test</p>
        </div>
      </div>
    </div>
  );
}
