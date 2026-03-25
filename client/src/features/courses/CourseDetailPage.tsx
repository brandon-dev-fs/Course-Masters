import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { coursesApi } from '../../api/courses.js';
import { unitsApi } from '../../api/units.js';
import { lessonsApi } from '../../api/lessons.js';
import { progressApi } from '../../api/progress.js';
import type { Course, Unit, CourseProgress } from '../../api/types.js';
import UnitAccordion from '../units/UnitAccordion.js';
import UnitSettingsModal from '../units/UnitSettingsModal.js';
import CourseSettingsModal from './CourseSettingsModal.js';
import CourseHero from './CourseHero.js';
import SyllabusSection from './SyllabusSection.js';
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
	const [courses, setCourses] = useState<Course[]>([]);
	const [progress, setProgress] = useState<CourseProgress | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [showSettings, setShowSettings] = useState(false);
	const [showUnitSettings, setShowUnitSettings] = useState(false);

	async function load() {
		if (!courseId) return;
		try {
			const [data, allCourses, prog] = await Promise.all([
				coursesApi.getOne(courseId),
				coursesApi.getAll(),
				progressApi.getCourse(courseId),
			]);
			setCourse(data);
			setCourses(allCourses);
			setProgress(prog);
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
		syllabus?: Record<string, unknown> | null;
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
		const lesson = await lessonsApi.create(unitId, data);
		setCourse((prev) =>
			prev
				? {
						...prev,
						units: prev.units?.map((u) =>
							u.id === unitId
								? {
										...u,
										lessons: [...(u.lessons ?? []), lesson],
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
			<CourseHero
				course={course}
				progress={progress}
				courses={courses}
				canEdit={canEdit}
				onOpenSettings={() => setShowSettings(true)}
			/>

			<SyllabusSection
				syllabus={course.syllabus}
				canEdit={canEdit}
				onEditSyllabus={() => setShowSettings(true)}
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
				canEdit={canEdit}
				progress={progress}
				onAddLesson={handleAddLesson}
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
				/>
			)}
		</div>
	);
}
