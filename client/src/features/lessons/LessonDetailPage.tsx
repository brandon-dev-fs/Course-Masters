import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Settings, ArrowLeft } from 'lucide-react';
import { lessonsApi } from '../../api/lessons.js';
import { coursesApi } from '../../api/courses.js';
import type { Lesson } from '../../api/types.js';
import { useAuth } from '../../context/AuthContext.js';
import NoteEditor from '../notes/NoteEditor.js';
import FlashCardList from '../flashcards/FlashCardList.js';
import PracticeProblemList from '../practice-problems/PracticeProblemList.js';
import QuizSection from '../quizzes/QuizSection.js';
import VocabList from '../vocab/VocabList.js';
import VideoList from '../videos/VideoList.js';
import StudentNotePanel from '../student-notes/StudentNotePanel.js';
import LessonSettingsModal from './LessonSettingsModal.js';
import LessonSidebar from './LessonSidebar.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';

export default function LessonDetailPage() {
  const { courseId, unitId, lessonId } = useParams<{ courseId: string; unitId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role === 'teacher' || user?.role === 'admin';
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('videos');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!unitId || !lessonId || !courseId) return;
    Promise.all([
      lessonsApi.getOne(unitId, lessonId),
      coursesApi.getOne(courseId),
    ])
      .then(([lessonData, courseData]) => {
        setLesson(lessonData);
        setCourseTitle(courseData.title);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load lesson'))
      .finally(() => setLoading(false));
  }, [unitId, lessonId, courseId]);

  async function handleUpdate(data: { title: string; description?: string; order: number }) {
    if (!unitId || !lessonId) return;
    const updated = await lessonsApi.update(unitId, lessonId, data);
    setLesson(updated);
    setShowSettings(false);
  }

  async function handleDelete() {
    if (!unitId || !lessonId) return;
    await lessonsApi.delete(unitId, lessonId);
    navigate(`/courses/${courseId}`);
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!lesson) return null;

  return (
    <>
    <div className="flex flex-col lg:flex-row gap-0 -mr-4 -ml-4">
      {/* Sidebar navigation */}
      <LessonSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Main content */}
      <div className="flex-1 min-w-0 px-6 pt-4 lg:pt-0">
        <Link
          to={`/courses/${courseId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {courseTitle}
        </Link>

        <div className="flex items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold text-foreground">{lesson.order}. {lesson.title}</h1>
          {canEdit && (
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors shrink-0"
              aria-label="Lesson settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>

        {activeSection === 'videos' && <VideoList lessonId={lesson.id} />}
        {activeSection === 'notes' && <NoteEditor lessonId={lesson.id} />}
        {activeSection === 'vocab' && <VocabList lessonId={lesson.id} />}
        {activeSection === 'flashcards' && <FlashCardList lessonId={lesson.id} />}
        {activeSection === 'practice' && <PracticeProblemList lessonId={lesson.id} />}
        {activeSection === 'quiz' && <QuizSection lessonId={lesson.id} />}

        {showSettings && (
          <LessonSettingsModal
            lesson={lesson}
            onClose={() => setShowSettings(false)}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        )}
      </div>

    </div>

    {/* Floating student notes drawer */}
    <StudentNotePanel lessonId={lesson.id} disabled={activeSection === 'quiz'} />
    </>
  );
}
