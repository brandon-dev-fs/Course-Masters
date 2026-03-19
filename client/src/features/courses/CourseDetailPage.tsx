import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { coursesApi } from '../../api/courses.js';
import { unitsApi } from '../../api/units.js';
import { lessonsApi } from '../../api/lessons.js';
import type { Course, Unit } from '../../api/types.js';
import UnitAccordion from '../units/UnitAccordion.js';
import UnitSettingsModal from '../units/UnitSettingsModal.js';
import ExamSection from '../exams/ExamSection.js';
import CourseProgressCard from '../progress/CourseProgressCard.js';
import CourseSettingsModal from './CourseSettingsModal.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import { useAuth } from '../../context/AuthContext.js';

export default function CourseDetailPage() {
	const { user } = useAuth();
	const canEdit = user?.role === 'teacher' || user?.role === 'admin';
	const { courseId } = useParams<{ courseId: string }>();
	const navigate = useNavigate();
	const [course, setCourse] = useState<Course | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [showSettings, setShowSettings] = useState(false);
	const [showUnitSettings, setShowUnitSettings] = useState(false);
	const [showExam, setShowExam] = useState(false);

	async function load() {
		if (!courseId) return;
		try {
			const data = await coursesApi.getOne(courseId);
			setCourse(data);
		} catch (err: unknown) {
			setError(
				err instanceof Error ? err.message : 'Failed to load course',
			);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		void load();
	}, [courseId]);

	async function handleCourseUpdate(data: {
		title: string;
		description?: string;
	}) {
		if (!courseId) return;
		const updated = await coursesApi.update(courseId, data);
		setCourse((prev) => (prev ? { ...prev, ...updated } : null));
	}

	async function handleCourseDelete() {
		if (!courseId) return;
		await coursesApi.delete(courseId);
		navigate('/');
	}

	async function handleAddUnit(data: { title: string; order: number }) {
		if (!courseId || !course) return;
		const unit = await unitsApi.create(courseId, data);
		setCourse((prev) =>
			prev
				? {
						...prev,
						units: [
							...(prev.units ?? []),
							{ ...unit, _count: { lessons: 0 } },
						],
					}
				: null,
		);
	}

	async function handleUpdateUnit(
		unit: Unit,
		data: { title: string; order: number },
	) {
		if (!courseId) return;
		const updated = await unitsApi.update(courseId, unit.id, data);
		setCourse((prev) =>
			prev
				? {
						...prev,
						units: prev.units?.map((u) =>
							u.id === updated.id ? { ...u, ...updated } : u,
						),
					}
				: null,
		);
	}

	async function handleDeleteUnit(unit: Unit) {
		if (!courseId) return;
		await unitsApi.delete(courseId, unit.id);
		setCourse((prev) =>
			prev
				? {
						...prev,
						units: prev.units?.filter((u) => u.id !== unit.id),
					}
				: null,
		);
	}

	async function handleAddLesson(
		unitId: string,
		data: { title: string; description?: string; order: number },
	) {
		await lessonsApi.create(unitId, data);
		setCourse((prev) =>
			prev
				? {
						...prev,
						units: prev.units?.map((u) =>
							u.id === unitId
								? {
										...u,
										_count: {
											lessons:
												(u._count?.lessons ?? 0) + 1,
										},
									}
								: u,
						),
					}
				: null,
		);
	}

	if (loading) return <LoadingSpinner />;
	if (error) return <ErrorMessage message={error} />;
	if (!course) return null;

	return (
		<div>
			<div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
				<Link
					to="/"
					className="hover:text-foreground"
				>
					Courses
				</Link>
				<span>/</span>
				<span className="text-foreground">{course.title}</span>
			</div>

			<div className="flex items-start justify-between mb-6 gap-4">
				<div>
					<h1 className="text-2xl font-bold text-foreground">
						{course.title}
					</h1>
					{course.description && (
						<p className="text-muted-foreground mt-1">
							{course.description}
						</p>
					)}
				</div>
				{canEdit && (
					<button
						onClick={() => setShowSettings(true)}
						className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
						aria-label="Course settings"
					>
						<Settings className="w-5 h-5" />
					</button>
				)}
			</div>

			<CourseProgressCard
				courseId={courseId!}
				onTakeExam={() => setShowExam(true)}
			/>

			<div className="flex items-center justify-between mb-4">
				<h2 className="text-lg font-semibold text-foreground">Units</h2>
				{canEdit && (
					<div className="flex items-center gap-2">
						<button
							onClick={() => setShowUnitSettings(true)}
							className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
							aria-label="Unit settings"
						>
							<Settings className="w-4 h-4" />
						</button>
					</div>
				)}
			</div>

			<UnitAccordion
				courseId={courseId!}
				units={course.units ?? []}
				onAddLesson={handleAddLesson}
			/>

			<ExamSection
				courseId={courseId!}
				open={showExam}
				onClose={() => setShowExam(false)}
			/>

			{showSettings && (
				<CourseSettingsModal
					course={course}
					onClose={() => setShowSettings(false)}
					onUpdateCourse={handleCourseUpdate}
					onDeleteCourse={handleCourseDelete}
				/>
			)}
			{showUnitSettings && (
				<UnitSettingsModal
					course={course}
					onClose={() => setShowUnitSettings(false)}
					onAddUnit={handleAddUnit}
					onUpdateUnit={handleUpdateUnit}
					onDeleteUnit={handleDeleteUnit}
					onAddLesson={handleAddLesson}
				/>
			)}
			</div>
	);
}
