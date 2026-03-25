import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { lessonsApi } from '../../api/lessons.js';
import { unitsApi } from '../../api/units.js';
import { coursesApi } from '../../api/courses.js';
import { videosApi } from '../../api/videos.js';
import { notesApi } from '../../api/notes.js';
import { resourceCompletionsApi } from '../../api/resource-completions.js';
import type { Lesson, Video, Note, ResourceCompletionItem } from '../../api/types.js';
import { useAuth } from '../../context/AuthContext.js';
import UnitLessonSidebar from './UnitLessonSidebar.js';
import LearningResourceNav from './LearningResourceNav.js';
import type { LearningResource } from './LearningResourceNav.js';
import PracticeResourceSidebar, { PracticeResourceMobileBar } from './PracticeResourceSidebar.js';
import LessonPlanView from './LessonPlanView.js';
import VideoCard from '../videos/VideoCard.js';
import NoteEditor from '../notes/NoteEditor.js';
import VocabList from '../vocab/VocabList.js';
import FlashCardList from '../flashcards/FlashCardList.js';
import PracticeProblemList from '../practice-problems/PracticeProblemList.js';
import QuizSection from '../quizzes/QuizSection.js';
import StudentNotePanel from '../student-notes/StudentNotePanel.js';
import LessonSettingsModal from './LessonSettingsModal.js';
import LessonPlanModal from './LessonPlanModal.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import ResourceCompletionCheckbox from '../../components/ResourceCompletionCheckbox.js';

export default function LessonDetailPage() {
  const { courseId, unitId, lessonId } = useParams<{ courseId: string; unitId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role === 'teacher' || user?.role === 'admin';

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [unitTitle, setUnitTitle] = useState('');
  const [unitLessons, setUnitLessons] = useState<Lesson[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [completions, setCompletions] = useState<ResourceCompletionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeResourceKey, setActiveResourceKey] = useState('lessonPlan');
  const [showSettings, setShowSettings] = useState(false);
  const [showPlanEdit, setShowPlanEdit] = useState(false);

  useEffect(() => {
    if (!unitId || !lessonId || !courseId) return;
    setLoading(true);
    setError('');
    Promise.all([
      lessonsApi.getOne(unitId, lessonId),
      unitsApi.getOne(courseId, unitId),
      coursesApi.getOne(courseId),
      lessonsApi.getAll(unitId),
      videosApi.getAll(lessonId),
      notesApi.getAll(lessonId),
      resourceCompletionsApi.get(lessonId),
    ])
      .then(([lessonData, unitData, courseData, lessons, vids, nts, comp]) => {
        setLesson(lessonData);
        setCourseTitle(courseData.title);
        setUnitTitle(unitData.title);
        setUnitLessons(lessons);
        setVideos(vids.sort((a, b) => a.order - b.order));
        setNotes(nts.sort((a, b) => a.order - b.order));
        setCompletions(comp.completions);
        setActiveResourceKey('lessonPlan');
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load lesson'))
      .finally(() => setLoading(false));
  }, [unitId, lessonId, courseId]);

  // Build learning resources array
  const learningResources = useMemo<LearningResource[]>(() => {
    const resources: LearningResource[] = [];
    // Lesson Plan is always first
    resources.push({ key: 'lessonPlan', type: 'lessonPlan', title: 'Lesson Plan', id: lessonId ?? '' });
    // Interleave videos and notes by order
    const interleaved: LearningResource[] = [
      ...videos.map(v => ({ key: `video:${v.id}`, type: 'video' as const, title: v.title, id: v.id })),
      ...notes.map(n => ({ key: `note:${n.id}`, type: 'note' as const, title: n.title, id: n.id })),
    ].sort((a, b) => {
      const aOrder = a.type === 'video' ? videos.find(v => v.id === a.id)!.order : notes.find(n => n.id === a.id)!.order;
      const bOrder = b.type === 'video' ? videos.find(v => v.id === b.id)!.order : notes.find(n => n.id === b.id)!.order;
      return aOrder - bOrder;
    });
    resources.push(...interleaved);
    // Vocab is always last
    resources.push({ key: 'vocab', type: 'vocab', title: 'Vocabulary', id: lessonId ?? '' });
    return resources;
  }, [videos, notes, lessonId]);

  const completedKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const c of completions) {
      if (c.resourceType === 'lessonPlan') keys.add('lessonPlan');
      else if (c.resourceType === 'vocab') keys.add('vocab');
      else keys.add(`${c.resourceType}:${c.resourceId}`);
    }
    return keys;
  }, [completions]);

  const allResourcesComplete = useMemo(
    () => learningResources.every(r => completedKeys.has(r.key)),
    [learningResources, completedKeys],
  );

  const handleToggleCompletion = useCallback(async (resourceType: string, resourceId: string) => {
    if (!lessonId) return;
    const result = await resourceCompletionsApi.toggle(lessonId, resourceType, resourceId);
    setCompletions(result.completions);
  }, [lessonId]);

  async function handleUpdate(data: { title: string; description?: string; order: number; objective?: string; planContent?: Record<string, unknown> }) {
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

  // Determine what to render in center content
  const practiceResource = activeResourceKey === 'flashcards' || activeResourceKey === 'practice' ? activeResourceKey : null;
  const isQuiz = activeResourceKey === 'quiz';

  function renderContent() {
    if (isQuiz) return <QuizSection lessonId={lesson!.id} />;
    if (activeResourceKey === 'flashcards') return <FlashCardList lessonId={lesson!.id} />;
    if (activeResourceKey === 'practice') return <PracticeProblemList lessonId={lesson!.id} />;
    if (activeResourceKey === 'lessonPlan') {
      return (
        <LessonPlanView
          lesson={lesson!}
          isComplete={completedKeys.has('lessonPlan')}
          onToggleComplete={() => handleToggleCompletion('lessonPlan', lesson!.id)}
          canEdit={canEdit}
          onEdit={() => setShowPlanEdit(true)}
        />
      );
    }
    if (activeResourceKey === 'vocab') {
      return (
        <div className="flex flex-col gap-4">
          <VocabList lessonId={lesson!.id} />
          <div className="pt-2 border-t border-border">
            <ResourceCompletionCheckbox
              isComplete={completedKeys.has('vocab')}
              onToggle={() => handleToggleCompletion('vocab', lesson!.id)}
            />
          </div>
        </div>
      );
    }
    if (activeResourceKey.startsWith('video:')) {
      const videoId = activeResourceKey.slice(6);
      const video = videos.find(v => v.id === videoId);
      if (!video) return null;
      return (
        <VideoCard
          video={video}
          isComplete={completedKeys.has(activeResourceKey)}
          onToggleComplete={() => handleToggleCompletion('video', video.id)}
        />
      );
    }
    if (activeResourceKey.startsWith('note:')) {
      const noteId = activeResourceKey.slice(5);
      const note = notes.find(n => n.id === noteId);
      if (!note) return null;
      return (
        <NoteEditor
          note={note}
          isComplete={completedKeys.has(activeResourceKey)}
          onToggleComplete={() => handleToggleCompletion('note', note.id)}
        />
      );
    }
    return null;
  }

  return (
    <>
      {/* Break out of Layout's container to go edge-to-edge */}
      <div className="relative -mx-4 -mt-8 -mb-8 flex flex-col lg:flex-row min-h-[calc(100vh-4.5rem)]" style={{ width: '100vw', left: '50%', marginLeft: '-50vw' }}>
        {/* Left sidebar: unit lesson navigation */}
        <UnitLessonSidebar
          lessons={unitLessons}
          currentLessonId={lesson.id}
          courseId={courseId!}
          unitId={unitId!}
          courseTitle={courseTitle}
          unitTitle={unitTitle}
        />

        {/* Center content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border">
            <div className="flex flex-col min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">{lesson.order}. {lesson.title}</h1>
              {lesson.description && (
                <p className="text-sm text-muted-foreground truncate">{lesson.description}</p>
              )}
            </div>
            {canEdit && (
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors shrink-0"
                aria-label="Lesson settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
          </header>

          {/* Learning resource nav bar */}
          <LearningResourceNav
            resources={learningResources}
            activeResourceKey={activeResourceKey}
            onResourceChange={setActiveResourceKey}
            completedKeys={completedKeys}
            quizUnlocked={allResourcesComplete}
          />

          {/* Mobile practice resource row */}
          <PracticeResourceMobileBar
            activeResource={practiceResource}
            onResourceChange={setActiveResourceKey}
          />

          {/* Main content area */}
          <main className="flex-1 overflow-y-auto px-4 py-4">
            {renderContent()}
          </main>

        </div>

        {/* Right sidebar: practice resources */}
        <PracticeResourceSidebar
          activeResource={practiceResource}
          onResourceChange={setActiveResourceKey}
        />
      </div>

      {/* Floating student notes drawer */}
      <StudentNotePanel lessonId={lesson.id} disabled={isQuiz} />

      {showSettings && (
        <LessonSettingsModal
          lesson={lesson}
          onClose={() => setShowSettings(false)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
      {showPlanEdit && (
        <LessonPlanModal
          lesson={lesson}
          onClose={() => setShowPlanEdit(false)}
          onUpdate={handleUpdate}
        />
      )}
    </>
  );
}
