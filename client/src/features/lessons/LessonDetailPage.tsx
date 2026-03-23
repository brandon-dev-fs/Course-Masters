import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Settings, NotebookPen } from 'lucide-react';
import { lessonsApi } from '../../api/lessons.js';
import { coursesApi } from '../../api/courses.js';
import type { Lesson } from '../../api/types.js';
import { useAuth } from '../../context/AuthContext.js';
import { Tabs, TabList, Tab, TabPanel } from '../../components/Tabs.js';
import NoteEditor from '../notes/NoteEditor.js';
import FlashCardList from '../flashcards/FlashCardList.js';
import PracticeProblemList from '../practice-problems/PracticeProblemList.js';
import QuizSection from '../quizzes/QuizSection.js';
import VocabList from '../vocab/VocabList.js';
import VideoList from '../videos/VideoList.js';
import StudentNotePanel from '../student-notes/StudentNotePanel.js';
import LessonSettingsModal from './LessonSettingsModal.js';
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
  const [showSettings, setShowSettings] = useState(false);
  const [showStudentNotes, setShowStudentNotes] = useState(false);

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
    <div className="flex gap-0 -mr-6">
      {/* Main content */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-foreground">Courses</Link>
          <span>/</span>
          <Link to={`/courses/${courseId}`} className="hover:text-foreground">{courseTitle}</Link>
          <span>/</span>
          <span className="text-foreground">{lesson.title}</span>
        </div>

        <div className="flex items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold text-foreground">{lesson.order}. {lesson.title}</h1>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setShowStudentNotes(prev => !prev)}
              className={`p-2 rounded-lg transition-colors ${showStudentNotes ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'}`}
              aria-label="My Notes"
              title="My Notes"
            >
              <NotebookPen className="w-5 h-5" />
            </button>
            {canEdit && (
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
                aria-label="Lesson settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <Tabs defaultTab="videos">
          <TabList>
            <Tab id="videos">Videos</Tab>
            <Tab id="notes">Lecture Notes</Tab>
            <Tab id="vocab">Vocabulary</Tab>
            <Tab id="flashcards">Flash Cards</Tab>
            <Tab id="practice">Practice Problems</Tab>
            <Tab id="quiz">Quiz</Tab>
          </TabList>
          <TabPanel id="videos">
            <VideoList lessonId={lesson.id} />
          </TabPanel>
          <TabPanel id="notes">
            <NoteEditor lessonId={lesson.id} />
          </TabPanel>
          <TabPanel id="vocab">
            <VocabList lessonId={lesson.id} />
          </TabPanel>
          <TabPanel id="flashcards">
            <FlashCardList lessonId={lesson.id} />
          </TabPanel>
          <TabPanel id="practice">
            <PracticeProblemList lessonId={lesson.id} />
          </TabPanel>
          <TabPanel id="quiz">
            <QuizSection lessonId={lesson.id} />
          </TabPanel>
        </Tabs>

        {showSettings && (
          <LessonSettingsModal
            lesson={lesson}
            onClose={() => setShowSettings(false)}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Student notes panel — pushes content aside */}
      <StudentNotePanel
        lessonId={lesson.id}
        isOpen={showStudentNotes}
        onClose={() => setShowStudentNotes(false)}
      />
    </div>
  );
}
