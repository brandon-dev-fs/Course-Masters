import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { lessonsApi } from '../../api/lessons.js';
import { unitsApi } from '../../api/units.js';
import { coursesApi } from '../../api/courses.js';
import { lessonResourcesApi } from '../../api/lesson-resources.js';
import { lessonToolsApi } from '../../api/lesson-tools.js';
import { resourceCompletionsApi } from '../../api/resource-completions.js';
import { progressApi } from '../../api/progress.js';
import type { CompletionsResponse, Lesson, LessonResource, LessonTool, Unit, UnitProgress } from '../../api/types.js';
import { useAuth } from '../../context/AuthContext.js';
import UnitLessonSidebar from './UnitLessonSidebar.js';
import LessonPlanView from './LessonPlanView.js';
import VideoCard from '../videos/VideoCard.js';
import VideoForm from '../videos/VideoForm.js';
import NoteEditor from '../notes/NoteEditor.js';
import FlashCard from '../flashcards/FlashCard.js';
import PracticeProblemCard from '../practice-problems/PracticeProblemCard.js';
import VocabCard from '../vocab/VocabCard.js';
import FlashCardList from '../flashcards/FlashCardList.js';
import VocabList from '../vocab/VocabList.js';
import QuizSection from '../quizzes/QuizSection.js';
import TestSection from '../tests/TestSection.js';
import LessonSettingsModal from './LessonSettingsModal.js';
import LessonPlanModal from './LessonPlanModal.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import AssignmentStepper from './AssignmentStepper.js';
import type { StepperItem } from './AssignmentStepper.js';
import AssignmentSection from './AssignmentSection.js';
import type { AssignmentItem } from './AssignmentSection.js';
import StudentToolsBar from '../student-notes/StudentToolsBar.js';
import type { StudentToolType } from '../student-notes/StudentToolsBar.js';
import StudentMaterialsModal from '../student-notes/StudentMaterialsModal.js';

function buildAssignmentItems(
  lesson: Lesson,
  resources: LessonResource[],
  tools: LessonTool[],
): AssignmentItem[] {
  const items: AssignmentItem[] = [];

  items.push({
    key: 'lessonPlan',
    kind: 'lessonPlan',
    id: lesson.id,
    title: 'Lesson Plan',
    isRequired: true,
    order: -1,
  });

  for (const r of [...resources].sort((a, b) => a.order - b.order)) {
    items.push({
      key: `resource:${r.id}`,
      kind: 'resource',
      id: r.id,
      title: r.title,
      isRequired: r.isRequired,
      order: r.order,
      resourceType: r.type,
    });
  }

  for (const t of [...tools].sort((a, b) => a.order - b.order)) {
    items.push({
      key: `tool:${t.id}`,
      kind: 'tool',
      id: t.id,
      title: t.title,
      isRequired: t.isRequired,
      order: t.order,
      toolType: t.type,
    });
  }

  items.push({
    key: 'quiz',
    kind: 'quiz',
    id: null,
    title: 'Lesson Quiz',
    isRequired: true,
    order: Infinity,
  });

  return items;
}

export default function LessonDetailPage() {
  const { courseId, unitId, lessonId } = useParams<{ courseId: string; unitId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role === 'teacher' || user?.role === 'admin';

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitLessons, setUnitLessons] = useState<Lesson[]>([]);
  const [resources, setResources] = useState<LessonResource[]>([]);
  const [tools, setTools] = useState<LessonTool[]>([]);
  const [completionsData, setCompletionsData] = useState<CompletionsResponse>({ completions: [], requiredItems: [] });
  const [unitProgress, setUnitProgress] = useState<UnitProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStepKey, setActiveStepKey] = useState('lessonPlan');
  const [activeTool, setActiveTool] = useState<StudentToolType | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPlanEdit, setShowPlanEdit] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const newNoteIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!unitId || !lessonId || !courseId) return;
    setLoading(true);
    setError('');
    Promise.all([
      lessonsApi.getOne(unitId, lessonId),
      unitsApi.getAll(courseId),
      coursesApi.getOne(courseId),
      lessonsApi.getAll(unitId),
      lessonResourcesApi.getAll(lessonId),
      lessonToolsApi.getAll(lessonId),
      resourceCompletionsApi.get(lessonId),
      progressApi.getUnit(courseId, unitId),
    ])
      .then(([lessonData, allUnits, courseData, lessons, allResources, allTools, comp, unitProg]) => {
        setLesson(lessonData);
        setCourseTitle(courseData.title);
        setUnits(allUnits);
        setUnitLessons(lessons);
        setResources(allResources.sort((a, b) => a.order - b.order));
        setTools(allTools.sort((a, b) => a.order - b.order));
        setCompletionsData(comp);
        setUnitProgress(unitProg);
        setActiveStepKey('lessonPlan');
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load lesson'))
      .finally(() => setLoading(false));
  }, [unitId, lessonId, courseId]);

  const assignmentItems = useMemo(
    () => lesson ? buildAssignmentItems(lesson, resources, tools) : [],
    [lesson, resources, tools],
  );

  const completedIds = useMemo(
    () => new Set(completionsData.completions.map(c => c.resourceId)),
    [completionsData.completions],
  );

  const quizUnlocked = useMemo(
    () => completionsData.requiredItems
      .filter(r => r.isRequired)
      .every(r => completedIds.has(r.resourceId)),
    [completionsData.requiredItems, completedIds],
  );

  const quizPassed = useMemo(
    () => unitProgress?.lessons.find(l => l.lessonId === lesson?.id)?.quizPassed ?? false,
    [unitProgress, lesson],
  );

  const availableTools = useMemo((): StudentToolType[] => {
    const result: StudentToolType[] = ['notes'];
    if (tools.some(t => t.type === 'flash_card')) result.push('flashcards');
    if (tools.some(t => t.type === 'practice_problem')) result.push('practice');
    if (tools.some(t => t.type === 'vocab')) result.push('vocab');
    return result;
  }, [tools]);

  const incompleteRequired = useMemo(
    () => assignmentItems.filter(
      item => item.isRequired && item.kind !== 'quiz' && item.id !== null && !completedIds.has(item.id)
    ),
    [assignmentItems, completedIds],
  );

  function completionKeyOf(item: AssignmentItem): string | null {
    if (item.kind === 'lessonPlan') return lesson?.id ?? null;
    if (item.id) return item.id;
    return null;
  }

  const handleToggleCompletion = useCallback(async (item: AssignmentItem) => {
    if (!lessonId || !item.id) return;
    let resourceType: string;
    if (item.kind === 'lessonPlan') resourceType = 'lessonPlan';
    else if (item.kind === 'resource') resourceType = item.resourceType ?? 'note';
    else resourceType = item.toolType ?? 'tool';
    const result = await resourceCompletionsApi.toggle(lessonId, resourceType, item.id);
    setCompletionsData(result);
  }, [lessonId]);

  const handleToggleRequired = useCallback(async (item: AssignmentItem) => {
    if (!item.id) return;
    const newRequired = !item.isRequired;
    if (item.kind === 'resource') {
      const updated = await lessonResourcesApi.update(item.id, { isRequired: newRequired });
      setResources(prev => prev.map(r => r.id === item.id ? updated : r));
    } else if (item.kind === 'tool') {
      const updated = await lessonToolsApi.update(item.id, { isRequired: newRequired });
      setTools(prev => prev.map(t => t.id === item.id ? updated : t));
    }
    const fresh = await resourceCompletionsApi.get(lessonId!);
    setCompletionsData(fresh);
  }, [lessonId]);

  function scrollToItem(key: string) {
    document.getElementById(`assignment-${key}`)?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleStepClick(key: string) {
    scrollToItem(key);
  }

  async function handleAddLesson(data: { title: string; description: string; order: number }) {
    if (!unitId || !courseId) return;
    const newLesson = await lessonsApi.create(unitId, data);
    setUnitLessons(prev => [...prev, newLesson]);
    navigate(`/courses/${courseId}/units/${unitId}/lessons/${newLesson.id}`);
  }

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

  function renderContent(item: AssignmentItem) {
    if (item.kind === 'lessonPlan') {
      return (
        <LessonPlanView
          lesson={lesson!}
          isComplete={completedIds.has(lesson!.id)}
          onToggleComplete={() => handleToggleCompletion(item)}
          canEdit={canEdit}
          onEdit={() => setShowPlanEdit(true)}
        />
      );
    }

    if (item.kind === 'quiz') {
      const isUnitTest = false;
      if (isUnitTest) {
        const allLessonsComplete = unitProgress
          ? unitProgress.totalLessons > 0 && unitProgress.completedLessons === unitProgress.totalLessons
          : false;
        return <TestSection unitId={unitId!} canEdit={canEdit} allLessonsComplete={allLessonsComplete} />;
      }
      return <QuizSection lessonId={lesson!.id} />;
    }

    if (item.kind === 'resource') {
      const resource = resources.find(r => r.id === item.id);
      if (!resource) return null;

      if (resource.type === 'video') {
        if (editingVideoId === resource.id) {
          return (
            <VideoForm
              initial={resource}
              onSubmit={async ({ title, url, order }) => {
                const updated = await lessonResourcesApi.update(resource.id, { title, content: { url }, order });
                setResources(prev => prev.map(r => r.id === resource.id ? updated : r).sort((a, b) => a.order - b.order));
                setEditingVideoId(null);
              }}
              onCancel={() => setEditingVideoId(null)}
            />
          );
        }
        if (showAddVideo && item === assignmentItems.find(i => i.kind === 'resource' && i.id === null)) {
          return (
            <VideoForm
              nextOrder={resources.length + 1}
              onSubmit={async ({ title, url, order }) => {
                const video = await lessonResourcesApi.create(lesson!.id, { type: 'video', title, content: { url }, order });
                setResources(prev => [...prev, video].sort((a, b) => a.order - b.order));
                setShowAddVideo(false);
              }}
              onCancel={() => setShowAddVideo(false)}
            />
          );
        }
        return (
          <VideoCard
            video={resource}
            isComplete={completedIds.has(resource.id)}
            onToggleComplete={() => handleToggleCompletion(item)}
            onEdit={canEdit ? () => setEditingVideoId(resource.id) : undefined}
            onDelete={canEdit ? async () => {
              await lessonResourcesApi.delete(resource.id);
              setResources(prev => prev.filter(r => r.id !== resource.id));
            } : undefined}
          />
        );
      }

      if (resource.type === 'note' || resource.type === 'lecture') {
        const isNew = newNoteIdRef.current === resource.id;
        if (isNew) newNoteIdRef.current = null;
        return (
          <NoteEditor
            key={resource.id}
            note={resource}
            isComplete={completedIds.has(resource.id)}
            onToggleComplete={() => handleToggleCompletion(item)}
            onUpdate={updated => setResources(prev => prev.map(r => r.id === updated.id ? updated : r))}
            initialEditing={isNew}
          />
        );
      }
    }

    if (item.kind === 'tool') {
      const tool = tools.find(t => t.id === item.id);
      if (!tool) return null;

      if (tool.type === 'flash_card') {
        return (
          <FlashCard
            card={tool}
            editMode={canEdit}
            onUpdate={canEdit ? async (id, data) => {
              const updated = await lessonToolsApi.update(id, { content: data });
              setTools(prev => prev.map(t => t.id === id ? updated : t));
            } : undefined}
            onDelete={canEdit ? async () => {
              await lessonToolsApi.delete(tool.id);
              setTools(prev => prev.filter(t => t.id !== tool.id));
            } : undefined}
          />
        );
      }

      if (tool.type === 'practice_problem') {
        return (
          <PracticeProblemCard
            problem={tool}
            onEdit={canEdit ? () => {} : undefined}
            onDelete={canEdit ? async () => {
              await lessonToolsApi.delete(tool.id);
              setTools(prev => prev.filter(t => t.id !== tool.id));
            } : undefined}
          />
        );
      }

      if (tool.type === 'vocab') {
        return (
          <VocabCard
            vocab={tool}
            onEdit={canEdit ? () => {} : undefined}
            onDelete={canEdit ? async () => {
              await lessonToolsApi.delete(tool.id);
              setTools(prev => prev.filter(t => t.id !== tool.id));
            } : undefined}
          />
        );
      }
    }

    return null;
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!lesson) return null;

  const isQuizActive = activeStepKey === 'quiz';
  const unitTestActive = activeStepKey === 'unit-test';

  const stepperItems: StepperItem[] = assignmentItems.map(item => ({
    key: item.key,
    title: item.title,
    kind: item.kind,
    completionId: completionKeyOf(item),
  }));

  return (
    <>
      <div
        className="relative -mx-4 -mb-8 flex min-h-[calc(100vh-4.5rem)]"
        style={{ width: '100vw', left: '50%', marginLeft: '-50vw' }}
      >
        {/* Left sidebar: units + lessons */}
        <UnitLessonSidebar
          lessons={unitLessons}
          currentLessonId={lesson.id}
          courseId={courseId!}
          unitId={unitId!}
          courseTitle={courseTitle}
          unitTitle={units.find(u => u.id === unitId)?.title ?? ''}
          units={units}
          canEdit={canEdit}
          onAddLesson={handleAddLesson}
          onUnitTestClick={() => setActiveStepKey('unit-test')}
          unitTestActive={unitTestActive}
          onLessonClick={() => setActiveStepKey('lessonPlan')}
        />

        {/* Center: header + stepper + assignment scroll */}
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border shrink-0">
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

          {/* Mobile tool bar (above stepper) */}
          <StudentToolsBar
            availableTools={availableTools}
            activeTool={activeTool}
            onOpenTool={tool => setActiveTool(prev => prev === tool ? null : tool)}
            isQuizActive={isQuizActive}
          />

          {unitTestActive ? (
            <main className="flex-1 overflow-y-auto px-4 py-4">
              <TestSection
                unitId={unitId!}
                canEdit={canEdit}
                allLessonsComplete={
                  unitProgress
                    ? unitProgress.totalLessons > 0 && unitProgress.completedLessons === unitProgress.totalLessons
                    : false
                }
              />
            </main>
          ) : (
            <>
              <AssignmentStepper
                items={stepperItems}
                activeStepKey={activeStepKey}
                completedIds={completedIds}
                quizUnlocked={quizUnlocked}
                quizPassed={quizPassed}
                onStepClick={handleStepClick}
              />
              <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                {assignmentItems.map((item, idx) => (
                  <AssignmentSection
                    key={item.key}
                    item={item}
                    isComplete={item.kind === 'quiz' ? quizPassed : (item.id ? completedIds.has(item.id) : false)}
                    isLocked={item.kind === 'quiz' && !quizUnlocked}
                    canEdit={canEdit}
                    isLast={idx === assignmentItems.length - 1}
                    incompleteRequired={incompleteRequired}
                    onVisible={setActiveStepKey}
                    onToggleCompletion={() => handleToggleCompletion(item)}
                    onToggleRequired={() => handleToggleRequired(item)}
                    onNext={() => {
                      const next = assignmentItems[idx + 1];
                      if (next) scrollToItem(next.key);
                    }}
                  >
                    {renderContent(item)}
                  </AssignmentSection>
                ))}
              </main>
            </>
          )}
        </div>

        {/* Right: desktop tool bar */}
        <StudentToolsBar
          availableTools={availableTools}
          activeTool={activeTool}
          onOpenTool={tool => setActiveTool(prev => prev === tool ? null : tool)}
          isQuizActive={isQuizActive}
        />
      </div>

      {/* Floating student materials modal */}
      <StudentMaterialsModal
        lessonId={lesson.id}
        isOpen={activeTool !== null}
        activeTool={activeTool}
        availableTools={availableTools}
        onSwitchTool={setActiveTool}
        onClose={() => setActiveTool(null)}
      />

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
