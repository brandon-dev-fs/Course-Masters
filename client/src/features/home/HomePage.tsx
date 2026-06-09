import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Search, SearchX, X } from 'lucide-react';

import { coursesApi } from '../../api/courses.js';
import type { Course } from '../../api/types.js';

import CourseCard from '../courses/CourseCard.js';
import CourseFilters from '../courses/CourseFilters.js';
import type { CourseCategory } from '../courses/CourseFilters.js';
import { getCourseCategory } from '../courses/CourseFilters.js';
import CourseForm from '../courses/CourseForm.js';
import HeroSection from './HeroSection.js';
import HowItWorksSection from './HowItWorksSection.js';

import Modal from '../../components/Modal.js';
import ConfirmDialog from '../../components/ConfirmDialog.js';
import Button from '../../components/Button.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import EmptyState from '../../components/EmptyState.js';

import { useAuth } from '../../context/AuthContext.js';
import useCanEdit from '../../hooks/useCanEdit.js';

export default function HomePage() {
	const { user } = useAuth();
	const loggedIn = user !== null;
	const canEdit = useCanEdit();
	const [courses, setCourses] = useState<Course[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [showCreate, setShowCreate] = useState(false);
	const [editing, setEditing] = useState<Course | null>(null);
	const [deleting, setDeleting] = useState<Course | null>(null);

	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<CourseCategory | 'All'>('All');

	const filteredCourses = useMemo(() => {
		return courses.filter((course) => {
			const matchesSearch =
				searchQuery === '' ||
				course.title.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesCategory =
				selectedCategory === 'All' ||
				getCourseCategory(course.title) === selectedCategory;
			return matchesSearch && matchesCategory;
		});
	}, [courses, searchQuery, selectedCategory]);

	async function load() {
		setLoading(true);
		try {
			const data = await coursesApi.getAll();
			setCourses(data);
		} catch (err: unknown) {
			setError(
				err instanceof Error ? err.message : 'Failed to load courses',
			);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		if (loggedIn) void load();
	}, [loggedIn]);

	async function handleCreate(data: { title: string; description?: string }) {
		const course = await coursesApi.create(data);
		setCourses((prev) => [course, ...prev]);
		setShowCreate(false);
	}

	async function handleUpdate(data: { title: string; description?: string }) {
		if (!editing) return;
		const updated = await coursesApi.update(editing.id, data);
		setCourses((prev) =>
			prev.map((c) => (c.id === updated.id ? updated : c)),
		);
		setEditing(null);
	}

	async function handleDelete() {
		if (!deleting) return;
		await coursesApi.delete(deleting.id);
		setCourses((prev) => prev.filter((c) => c.id !== deleting.id));
		setDeleting(null);
	}

	if (loading) return <LoadingSpinner fullPage />;
	if (error) return <ErrorMessage message={error} />;

	return (
		<div>
			<HeroSection loggedIn={loggedIn} userName={user?.name ?? ''} />

			{!loggedIn && <HowItWorksSection />}

			{loggedIn && (
				<div
					id="courses"
					className="px-6 pt-8 scroll-mt-20"
				>
					<div className="flex items-center gap-3 mb-6">
						<h2 className="text-2xl font-bold text-foreground tracking-tight shrink-0">
							My Courses
						</h2>
						<div className="flex items-center gap-2 ml-auto">
							<div className="relative">
								<Search
									className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none"
									aria-hidden="true"
								/>
								<input
									type="text"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Search..."
									aria-label="Search courses"
									className="w-40 sm:w-48 pl-9 pr-8 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-green-primary focus:border-green-primary transition-colors"
								/>
								{searchQuery !== '' && (
									<button
										type="button"
										onClick={() => setSearchQuery('')}
										aria-label="Clear search"
										className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded text-text-secondary hover:text-text-primary transition-colors"
									>
										<X className="w-3.5 h-3.5" aria-hidden="true" />
									</button>
								)}
							</div>
							{canEdit && (
								<Button onClick={() => setShowCreate(true)}>
									+ New Course
								</Button>
							)}
						</div>
					</div>

					{courses.length === 0 ? (
						<EmptyState
							icon={<BookOpen className="w-8 h-8" />}
							title="No courses yet"
							description={
								canEdit
									? 'Create your first course to get started.'
									: 'No courses are available yet.'
							}
							action={
								canEdit
									? {
											label: '+ New Course',
											onClick: () => setShowCreate(true),
										}
									: undefined
							}
						/>
					) : (
						<>
							<CourseFilters
								selectedCategory={selectedCategory}
								onCategoryChange={setSelectedCategory}
							/>

							<div
								aria-live="polite"
								className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
							>
								{filteredCourses.length === 0 ? (
									<div className="col-span-full">
										<EmptyState
											icon={<SearchX className="w-8 h-8" />}
											title="No courses match your filters"
											description="Try a different search term or category"
										/>
									</div>
								) : (
									filteredCourses.map((course) => (
										<CourseCard
											key={course.id}
											course={course}
											canEdit={canEdit}
											onEdit={() => setEditing(course)}
											onDelete={() => setDeleting(course)}
										/>
									))
								)}
							</div>
						</>
					)}
				</div>
			)}

			{showCreate && (
				<Modal
					title="New Course"
					onClose={() => setShowCreate(false)}
				>
					<CourseForm
						onSubmit={handleCreate}
						onCancel={() => setShowCreate(false)}
					/>
				</Modal>
			)}

			{editing && (
				<Modal
					title="Edit Course"
					onClose={() => setEditing(null)}
				>
					<CourseForm
						initial={editing}
						onSubmit={handleUpdate}
						onCancel={() => setEditing(null)}
					/>
				</Modal>
			)}

			{deleting && (
				<ConfirmDialog
					title="Delete Course"
					message={`Delete "${deleting.title}"? This will also delete all its units and lessons.`}
					onConfirm={handleDelete}
					onClose={() => setDeleting(null)}
				/>
			)}
		</div>
	);
}
