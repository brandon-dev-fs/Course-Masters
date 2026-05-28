import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coursesApi } from '../../api/courses.js';
import { unitsApi } from '../../api/units.js';
import { progressApi } from '../../api/progress.js';
import type { Course, Unit, CourseProgress } from '../../api/types.js';
import UnitSettingsModal from '../units/UnitSettingsModal.js';
import CourseSettingsModal from './CourseSettingsModal.js';
import SyllabusEditModal from './SyllabusEditModal.js';
import SyllabusViewModal from './SyllabusViewModal.js';
import CalendarModal from './CalendarModal.js';
import CourseHero from './CourseHero.js';
import UnitCardStrip from '../units/UnitCardStrip.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import useFetch from '../../hooks/useFetch.js';
import useCanEdit from '../../hooks/useCanEdit.js';
import useDisclosure from '../../hooks/useDisclosure.js';

interface CoursePageData {
  course: Course;
  courses: Course[];
  progress: CourseProgress;
}

export default function CourseDetailPage() {
	const canEdit = useCanEdit();
	const { courseId } = useParams<{ courseId: string }>();
	const navigate = useNavigate();

	const { data, loading, error } = useFetch<CoursePageData>(
		() => Promise.all([
			coursesApi.getOne(courseId!),
			coursesApi.getAll(),
			progressApi.getCourse(courseId!),
		]).then(([course, courses, progress]) => ({ course, courses, progress })),
		[courseId],
	);

	const [course, setCourse] = useState<Course | null>(null);
	const [courses, setCourses] = useState<Course[]>([]);
	const [progress, setProgress] = useState<CourseProgress | null>(null);

	// Sync state from fetch result on initial load and courseId change
	useEffect(() => {
		if (data) {
			setCourse(data.course);
			setCourses(data.courses);
			setProgress(data.progress);
		}
	}, [data]);

	const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

	const settingsDisclosure = useDisclosure();
	const syllabusViewDisclosure = useDisclosure();
	const syllabusEditDisclosure = useDisclosure();
	const unitSettingsDisclosure = useDisclosure();
	const calendarDisclosure = useDisclosure();

	function handleEditUnit(unit: Unit) {
		setEditingUnit(unit);
		unitSettingsDisclosure.open();
	}

	async function handleCourseUpdate(updateData: {
		title: string;
		description?: string;
		syllabus?: Record<string, unknown> | null;
	}) {
		if (!courseId) return;
		const updated = await coursesApi.update(courseId, updateData);
		setCourse((prev) => (prev ? { ...prev, ...updated } : null));
	}

	async function handleCourseDelete() {
		if (!courseId) return;
		await coursesApi.delete(courseId);
		navigate('/');
	}

	async function handleAddUnit(unitData: { title: string; order: number }) {
		if (!courseId || !course) return;
		const unit = await unitsApi.create(courseId, unitData);
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
		unitData: { title: string; order: number },
	) {
		if (!courseId) return;
		const updated = await unitsApi.update(courseId, unit.id, unitData);
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
		setEditingUnit(null);
		setCourse((prev) =>
			prev
				? {
						...prev,
						units: prev.units?.filter((u) => u.id !== unit.id),
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
				onOpenSettings={settingsDisclosure.open}
				onOpenCalendar={calendarDisclosure.open}
			/>

			<div className="container mx-auto py-6">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-lg font-semibold text-foreground">Units</h2>
				<div className="flex items-center gap-2">
					{(course.syllabus || canEdit) && (
						<Button
							size="sm"
							variant="secondary"
							onClick={() =>
								course.syllabus
									? syllabusViewDisclosure.open()
									: syllabusEditDisclosure.open()
							}
						>
							{course.syllabus
								? 'View Syllabus'
								: '+ Add Syllabus'}
						</Button>
					)}
					{canEdit && (
						<Button
							size="sm"
							variant="secondary"
							onClick={unitSettingsDisclosure.open}
						>
							+ Add Unit
						</Button>
					)}
				</div>
			</div>

			<UnitCardStrip
				courseId={courseId!}
				units={course.units ?? []}
				canEdit={canEdit}
				progress={progress}
			/>
			</div>

			{settingsDisclosure.isOpen && (
				<CourseSettingsModal
					course={course}
					onClose={settingsDisclosure.close}
					onUpdateCourse={handleCourseUpdate}
					onDeleteCourse={handleCourseDelete}
				/>
			)}
			{syllabusViewDisclosure.isOpen && course.syllabus && (
				<SyllabusViewModal
					syllabus={course.syllabus as Record<string, unknown>}
					canEdit={canEdit}
					onClose={syllabusViewDisclosure.close}
					onEdit={() => {
						syllabusViewDisclosure.close();
						syllabusEditDisclosure.open();
					}}
				/>
			)}
			{syllabusEditDisclosure.isOpen && (
				<SyllabusEditModal
					course={course}
					onClose={syllabusEditDisclosure.close}
					onUpdateCourse={handleCourseUpdate}
				/>
			)}
			{unitSettingsDisclosure.isOpen && (
				<UnitSettingsModal
					course={course}
					onClose={() => {
						setEditingUnit(null);
						unitSettingsDisclosure.close();
					}}
					onAddUnit={handleAddUnit}
					onUpdateUnit={handleUpdateUnit}
					onDeleteUnit={handleDeleteUnit}
					initialAdding={editingUnit === null}
					// @ts-expect-error -- unit prop will be added to UnitSettingsModal in a subsequent task
					unit={editingUnit ?? undefined}
				/>
			)}
			{calendarDisclosure.isOpen && (
				<CalendarModal
					course={course}
					progress={progress}
					onClose={calendarDisclosure.close}
				/>
			)}
		</div>
	);
}
