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
import CourseHeader from './CourseHeader.js';
import UnitRoadmap from './UnitRoadmap.js';
import MobileProgressBar from './MobileProgressBar.js';
import CourseProgressSidebar from './CourseProgressSidebar.js';

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

	// Clear stale course data immediately when navigating to a different course
	useEffect(() => {
		setCourse(null);
		setProgress(null);
	}, [courseId]);

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

	function handleOpenSyllabus() {
		if (course?.syllabus) {
			syllabusViewDisclosure.open();
		} else {
			syllabusEditDisclosure.open();
		}
	}

	function handleReviewFlashCards() {
		if (!course?.units) return;
		const sortedUnits = [...course.units].sort((a, b) => a.order - b.order);
		for (const unit of sortedUnits) {
			const sortedLessons = [...(unit.lessons ?? [])].sort((a, b) => a.order - b.order);
			if (sortedLessons.length > 0) {
				navigate(`/courses/${course.id}/units/${unit.id}/lessons/${sortedLessons[0].id}`);
				return;
			}
		}
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

	return (
		<div className="bg-background min-h-screen">
			<div className="container mx-auto px-4 md:px-6 py-6">
				{loading && <LoadingSpinner />}
				{error && <ErrorMessage message={error} />}

				{course && (
					<>
						<CourseHeader
							course={course}
							courses={courses}
							canEdit={canEdit}
							onOpenSettings={settingsDisclosure.open}
							onOpenCalendar={calendarDisclosure.open}
						/>

						<div className="flex gap-6 mt-6 items-start">
							<main className="flex-1 min-w-0">
								<MobileProgressBar
									progress={progress}
									onOpenSyllabus={handleOpenSyllabus}
									onReviewFlashCards={handleReviewFlashCards}
								/>
								<UnitRoadmap
									courseId={course.id}
									units={course.units ?? []}
									progress={progress}
									canEdit={canEdit}
									onEditUnit={handleEditUnit}
								/>
							</main>
							<aside className="w-[260px] shrink-0 hidden md:block sticky top-[72px]">
								<CourseProgressSidebar
									progress={progress}
									canEdit={canEdit}
									onOpenSyllabus={handleOpenSyllabus}
									onOpenCalendar={calendarDisclosure.open}
									onReviewFlashCards={handleReviewFlashCards}
									onAddUnit={unitSettingsDisclosure.open}
								/>
							</aside>
						</div>
					</>
				)}
			</div>

			{settingsDisclosure.isOpen && course && (
				<CourseSettingsModal
					course={course}
					onClose={settingsDisclosure.close}
					onUpdateCourse={handleCourseUpdate}
					onDeleteCourse={handleCourseDelete}
				/>
			)}
			{syllabusViewDisclosure.isOpen && course?.syllabus && (
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
			{syllabusEditDisclosure.isOpen && course && (
				<SyllabusEditModal
					course={course}
					onClose={syllabusEditDisclosure.close}
					onUpdateCourse={handleCourseUpdate}
				/>
			)}
			{unitSettingsDisclosure.isOpen && course && (
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
					unit={editingUnit ?? undefined}
				/>
			)}
			{calendarDisclosure.isOpen && course && (
				<CalendarModal
					course={course}
					progress={progress}
					onClose={calendarDisclosure.close}
				/>
			)}
		</div>
	);
}
