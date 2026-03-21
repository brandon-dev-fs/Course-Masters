import { useEffect, useState } from 'react';
import { Layers, GraduationCap, CheckCircle2, XCircle } from 'lucide-react';
import { progressApi } from '../../api/progress.js';
import type { CourseProgress } from '../../api/types.js';
import ProgressBar from './ProgressBar.js';
import Button from '../../components/Button.js';
import Tooltip from '../../components/Tooltip.js';

interface CourseProgressCardProps {
	courseId: string;
	onTakeExam?: () => void;
}

export default function CourseProgressCard({ courseId, onTakeExam }: CourseProgressCardProps) {
	const [progress, setProgress] = useState<CourseProgress | null>(null);

	useEffect(() => {
		progressApi
			.getCourse(courseId)
			.then(setProgress)
			.catch(() => {});
	}, [courseId]);

	if (!progress) return null;

	const hasAttempt = progress.examScore !== null;
	const allUnitsMastered = progress.totalUnits > 0 && progress.completedUnits === progress.totalUnits;

	return (
		<div className="rounded-2xl bg-surface border border-border p-5 mb-6 shadow-warm-md">
			<div className="flex items-center justify-between mb-3">
				<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
					Course Progress
				</h3>
				<span className="text-sm font-bold text-primary">
					{progress.percentComplete}%
				</span>
			</div>
			<ProgressBar
				percent={progress.percentComplete}
				className="mb-4"
			/>
			<div className="grid grid-cols-2 gap-3">
				<div className="bg-surface-raised rounded-xl border border-border p-3 text-center">
					<div className="flex justify-center mb-1">
						<Layers className="w-5 h-5 text-primary" />
					</div>
					<p className="text-xl font-bold text-foreground">
						{progress.completedUnits}/{progress.totalUnits}
					</p>
					<p className="text-xs text-muted-foreground">Units Mastered</p>
				</div>
				<div className="bg-surface-raised rounded-xl border border-border p-3 flex flex-col items-center justify-between gap-2">
					<div className="flex flex-col items-center gap-1">
						<GraduationCap className="w-5 h-5 text-primary" />
					</div>
					{hasAttempt ? (
						<div className="flex items-center gap-1">
							{progress.examPassed ? (
								<CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
							) : (
								<XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
							)}
							<span className={`text-sm font-semibold ${progress.examPassed ? 'text-success' : 'text-destructive'}`}>
								{progress.examPassed ? 'Passed' : 'Failed'} · {Math.round(progress.examScore! * 100)}%
							</span>
						</div>
					) : (
						<p className="text-xs text-muted-foreground">No attempts yet</p>
					)}
					{onTakeExam && (
						<Tooltip content={`Complete all units before taking the final exam (${progress.completedUnits}/${progress.totalUnits} mastered)`}>
							<Button size="sm" variant="secondary" onClick={onTakeExam} disabled={!allUnitsMastered}>
								{hasAttempt ? 'Retake Exam' : 'Take Exam'}
							</Button>
						</Tooltip>
					)}
				</div>
			</div>
		</div>
	);
}
