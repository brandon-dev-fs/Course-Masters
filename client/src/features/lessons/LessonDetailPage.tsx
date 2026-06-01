import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import useDisclosure from '../../hooks/useDisclosure.js';
import { Menu, ArrowLeft } from 'lucide-react';
import { assessmentsApi } from '../../api/assessments.js';
import { lessonResourcesApi } from '../../api/lesson-resources.js';
import { lessonToolsApi } from '../../api/lesson-tools.js';
import { resourceCompletionsApi } from '../../api/resource-completions.js';
import type { UpdateAssignmentPayload } from '../../api/assignments.js';
import useLesson from './hooks/useLesson.js';
import useResources from './hooks/useResources.js';
import useTools from './hooks/useTools.js';
import useAssignments, { completionKeyOf } from './hooks/useAssignments.js';
import type { AssignmentItem } from './AssignmentSection.js';
import UnitLessonSidebar from './UnitLessonSidebar.js';
import ActiveItemContent from './ActiveItemContent.js';
import LessonToolModals from './LessonToolModals.js';
import LessonSettingsModal from './LessonSettingsModal.js';
import LessonPlanModal from './LessonPlanModal.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import AssignmentStepper from './AssignmentStepper.js';
import type { StepperItem } from './AssignmentStepper.js';
import AssignmentSection from './AssignmentSection.js';
import StudentToolsBar from '../student-notes/StudentToolsBar.js';
import type { StudentToolType } from '../student-notes/StudentToolsBar.js';
import StudentMaterialsModal from '../student-notes/StudentMaterialsModal.js';
import AssignmentFormModal from '../assignments/AssignmentFormModal.js';
import ConfirmDialog from '../../components/ConfirmDialog.js';
import AssessmentSection from '../assessments/AssessmentSection.js';
import ErrorBoundary from '../../components/ErrorBoundary.js';

function contentAreaFallback(_error: Error, _reset: () => void) {
  return (
    <div className="rounded-lg bg-surface border border-border p-4 text-sm text-muted-foreground flex flex-col gap-3">
      <p>Something went wrong loading this content.</p>
      <div className="flex gap-3">
        <a
          href={window.location.href}
          className="text-primary underline text-sm"
        >
          Reload page
        </a>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="text-sm text-muted-foreground underline hover:text-foreground"
        >
          Go back
        </button>
      </div>
    </div>
  );
}

const testApi = {
  get: assessmentsApi.getUnitQuiz,
  create: assessmentsApi.createUnitQuiz,
  update: assessmentsApi.update,
  submitAttempt: assessmentsApi.submitAttempt,
  getAttempts: assessmentsApi.getAttempts,
};

function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem('cm-sidebar-collapsed') === 'true';
  } catch {
    return false;
  }
}

function writeSidebarCollapsed(value: boolean): void {
  try {
    localStorage.setItem('cm-sidebar-collapsed', String(value));
  } catch {
    // ignore — localStorage unavailable
  }
}

export default function LessonDetailPage() {
  const { courseId, unitId, lessonId } = useParams<{ courseId: string; unitId: string; lessonId: string }>();

  // Cross-cutting UI state
  const [activeStepKey, setActiveStepKey] = useState('lessonPlan');
  const [activeTool, setActiveTool] = useState<StudentToolType | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(readSidebarCollapsed);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const settingsDisclosure = useDisclosure();
  const planEditDisclosure = useDisclosure();
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  const {
    lesson, courseTitle, units, unitLessons, unitProgress,
    loading, error, canEdit,
    handleAddLesson, handleUpdate, handleDelete,
  } = useLesson({ courseId, unitId, lessonId }, settingsDisclosure.close);

  const {
    resources, completionsData, completedIds,
    editingVideoId, newNoteIdRef,
    setResources, setCompletionsData, setEditingVideoId,
    handleToggleCompletion, handleMoveResource,
  } = useResources(lessonId);

  const {
    tools, editingTool,
    setTools, setEditingTool,
    handleMoveTool,
  } = useTools(lessonId);

  const {
    assignments,
    assignmentItems, completedAssignmentIds, incompleteRequired, availableTools,
    isAddingAssignment, setIsAddingAssignment,
    editingAssignment, setEditingAssignment,
    deletingAssignmentId, setDeletingAssignmentId,
    handleCreateAssignment, handleUpdateAssignment, handleDeleteAssignment,
    handleMoveAssignment, handleToggleAssignmentCompletion,
  } = useAssignments({ lessonId, lesson, resources, tools, completedIds, setActiveStepKey });

  function handleToggleSidebar() {
    setSidebarCollapsed(prev => {
      const next = !prev;
      writeSidebarCollapsed(next);
      return next;
    });
  }

  function handleMobileClose() {
    setMobileDrawerOpen(false);
    hamburgerRef.current?.focus();
  }

  async function handleToggleRequired(item: AssignmentItem) {
    if (!lessonId || !item.id) return;
    const newRequired = !item.isRequired;
    if (item.kind === 'resource') {
      const updated = await lessonResourcesApi.update(item.id, { isRequired: newRequired });
      setResources(prev => prev.map(r => r.id === item.id ? updated : r));
    } else if (item.kind === 'tool') {
      const updated = await lessonToolsApi.update(item.id, { isRequired: newRequired });
      setTools(prev => prev.map(t => t.id === item.id ? updated : t));
    }
    const fresh = await resourceCompletionsApi.get(lessonId);
    setCompletionsData(fresh);
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!lesson) return null;

  const isQuizActive = activeStepKey === 'quiz';
  const unitTestActive = activeStepKey === 'unit-test';
  const activeItem = assignmentItems.find(item => item.key === activeStepKey) ?? assignmentItems[0];
  const activeIdx = assignmentItems.findIndex(item => item.key === activeItem?.key);

  const quizUnlocked = completionsData.requiredItems
    .filter(r => r.isRequired)
    .every(r => completedIds.has(r.resourceId));
  const quizPassed = unitProgress?.lessons.find(l => l.lessonId === lesson.id)?.quizPassed ?? false;
  const allLessonsComplete = unitProgress
    ? unitProgress.totalLessons > 0 && unitProgress.completedLessons === unitProgress.totalLessons
    : false;
  const completedLessonIds = new Set(
    unitProgress?.lessons.filter(l => l.completed).map(l => l.lessonId) ?? []
  );

  const stepperItems: StepperItem[] = assignmentItems.map(item => ({
    key: item.key,
    title: item.title,
    kind: item.kind,
    completionId: completionKeyOf(item, lesson.id),
    resourceType: item.resourceType,
    toolType: item.toolType,
    assignmentType: item.assignmentType,
  }));

  const sortedResources = [...resources].sort((a, b) => a.order - b.order);
  const sortedTools = [...tools].sort((a, b) => a.order - b.order);
  const sortedAssignments = [...assignments].sort((a, b) => a.order - b.order);
  let onMoveUp: (() => void) | undefined;
  let onMoveDown: (() => void) | undefined;
  if (activeItem?.kind === 'resource') {
    const ri = sortedResources.findIndex(r => r.id === activeItem.id);
    if (ri > 0) onMoveUp = () => handleMoveResource(activeItem.id!, 'up');
    if (ri < sortedResources.length - 1) onMoveDown = () => handleMoveResource(activeItem.id!, 'down');
  } else if (activeItem?.kind === 'tool') {
    const ti = sortedTools.findIndex(t => t.id === activeItem.id);
    if (ti > 0) onMoveUp = () => handleMoveTool(activeItem.id!, 'up');
    if (ti < sortedTools.length - 1) onMoveDown = () => handleMoveTool(activeItem.id!, 'down');
  } else if (activeItem?.kind === 'assignment') {
    const ai = sortedAssignments.findIndex(a => a.id === activeItem.id);
    if (ai > 0) onMoveUp = () => handleMoveAssignment(activeItem.id!, 'up');
    if (ai < sortedAssignments.length - 1) onMoveDown = () => handleMoveAssignment(activeItem.id!, 'down');
  }

  const isComplete = !activeItem ? false
    : activeItem.kind === 'quiz' ? quizPassed
    : activeItem.kind === 'assignment' && activeItem.id ? completedAssignmentIds.has(activeItem.id)
    : activeItem.id ? completedIds.has(activeItem.id) : false;

  const activeAssignment = activeItem?.kind === 'assignment'
    ? assignments.find(a => a.id === activeItem.id)
    : undefined;

  const onToggleCompletion = activeAssignment
    ? () => handleToggleAssignmentCompletion(activeAssignment)
    : () => activeItem && handleToggleCompletion(activeItem);

  const currentUnit = units.find(u => u.id === unitId);

  // Mobile tab bar excludes practice problems
  const mobileAvailableTools = availableTools.filter((t): t is StudentToolType => t !== 'practice');

  return (
    <>
      <div
        className="relative -mx-4 -mb-8 flex flex-col"
        style={{ width: '100vw', left: '50%', marginLeft: '-50vw', minHeight: 'calc(100vh - 4.5rem)' }}
      >
        {/* Desktop breadcrumb bar */}
        <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-surface border-b border-border shrink-0">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-sm min-w-0">
              <li className="shrink-0">
                <Link to={`/courses/${courseId}`} className="text-primary hover:underline font-medium">
                  {courseTitle}
                </Link>
              </li>
              <li aria-hidden className="shrink-0 text-muted-foreground">›</li>
              <li className="text-foreground font-medium truncate shrink min-w-0" aria-current="page">
                {lesson.title}
              </li>
            </ol>
          </nav>
        </div>

        {/* Mobile header */}
        <div className="lg:hidden flex flex-col bg-surface border-b border-border shrink-0">
          {/* Row 1: back arrow + course name + hamburger */}
          <div className="flex items-center gap-2 px-4 py-2">
            <Link
              to={`/courses/${courseId}`}
              className="text-primary shrink-0"
              aria-label={`Back to ${courseTitle}`}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Link
              to={`/courses/${courseId}`}
              className="text-xs text-primary hover:underline flex-1 truncate"
            >
              {courseTitle}
            </Link>
            <button
              ref={hamburgerRef}
              onClick={() => setMobileDrawerOpen(true)}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors shrink-0"
              aria-label="Open lesson navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
          {/* Row 2: lesson title */}
          <div className="px-4 pb-2">
            <h1 className="text-base font-bold text-foreground">{lesson.title}</h1>
          </div>
        </div>

        {/* Panel row — flex-col on mobile, flex-row on desktop */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0">
          <UnitLessonSidebar
            lessons={unitLessons}
            currentLessonId={lesson.id}
            courseId={courseId!}
            unitId={unitId!}
            courseTitle={courseTitle}
            unitTitle={currentUnit?.title ?? ''}
            units={units}
            canEdit={canEdit}
            onAddLesson={handleAddLesson}
            onUnitTestClick={() => setActiveStepKey('unit-test')}
            unitTestActive={unitTestActive}
            onLessonClick={() => setActiveStepKey('lessonPlan')}
            collapsed={sidebarCollapsed}
            mobileOpen={mobileDrawerOpen}
            onMobileClose={handleMobileClose}
            completedLessonIds={completedLessonIds}
            onToggle={handleToggleSidebar}
          />

          <div className="flex flex-col flex-1 min-w-0 min-h-0">
            {!unitTestActive && (
              <AssignmentStepper
                items={stepperItems}
                activeStepKey={activeStepKey}
                completedIds={completedIds}
                completedAssignmentIds={completedAssignmentIds}
                quizUnlocked={quizUnlocked}
                quizPassed={quizPassed}
                onStepClick={setActiveStepKey}
                onAdd={canEdit ? () => setIsAddingAssignment(true) : undefined}
              />
            )}

            <ErrorBoundary fallback={contentAreaFallback}>
              <main
                id="lesson-content"
                aria-live="polite"
                className="flex-1 min-w-0 overflow-y-auto px-4 py-6 pb-24 lg:pb-6"
              >
                {unitTestActive ? (
                  <AssessmentSection
                    parentId={unitId!}
                    api={testApi}
                    label="Unit Test"
                    createLabel="Create Test"
                    takeLabel="Take Test"
                    retakeLabel="Retake Test"
                    modalTitle="Unit Test"
                    resultsTitle="Test Results"
                    displayMode="inline"
                    canEdit={canEdit}
                    unlocked={allLessonsComplete}
                    lockedMessage="Complete all lessons to unlock the unit test."
                  />
                ) : (
                  activeItem && (
                    <AssignmentSection
                      key={activeItem.key}
                      item={activeItem}
                      isComplete={isComplete}
                      isLocked={activeItem.kind === 'quiz' && !quizUnlocked}
                      canEdit={canEdit}
                      isFirst={activeIdx === 0}
                      isLast={activeIdx === assignmentItems.length - 1}
                      incompleteRequired={incompleteRequired}
                      onToggleCompletion={onToggleCompletion}
                      onToggleRequired={() => handleToggleRequired(activeItem)}
                      onMoveUp={onMoveUp}
                      onMoveDown={onMoveDown}
                      onPrev={() => { const p = assignmentItems[activeIdx - 1]; if (p) setActiveStepKey(p.key); }}
                      onNext={() => { const n = assignmentItems[activeIdx + 1]; if (n) setActiveStepKey(n.key); }}
                      onEdit={canEdit && activeItem.kind === 'assignment' && activeAssignment
                        ? () => setEditingAssignment(activeAssignment)
                        : undefined}
                      onDelete={canEdit && activeItem.kind === 'assignment' && activeItem.id
                        ? () => setDeletingAssignmentId(activeItem.id)
                        : undefined}
                    >
                      <ActiveItemContent
                        item={activeItem}
                        lesson={lesson}
                        resources={resources}
                        tools={tools}
                        assignments={assignments}
                        canEdit={canEdit}
                        editingVideoId={editingVideoId}
                        newNoteIdRef={newNoteIdRef}
                        onVideoEditStart={id => setEditingVideoId(id)}
                        onVideoEditCancel={() => setEditingVideoId(null)}
                        onVideoUpdated={updated => {
                          setResources(prev => prev.map(r => r.id === updated.id ? updated : r).sort((a, b) => a.order - b.order));
                          setEditingVideoId(null);
                        }}
                        onVideoDeleted={id => setResources(prev => prev.filter(r => r.id !== id))}
                        onNoteUpdated={updated => setResources(prev => prev.map(r => r.id === updated.id ? updated : r))}
                        onEditTool={t => setEditingTool(t)}
                        onToolDeleted={id => setTools(prev => prev.filter(t => t.id !== id))}
                        onToolUpdated={updated => setTools(prev => prev.map(t => t.id === updated.id ? updated : t))}
                        onToggleAssignmentCompletion={handleToggleAssignmentCompletion}
                        onPlanEdit={planEditDisclosure.open}
                      />
                    </AssignmentSection>
                  )
                )}
              </main>
            </ErrorBoundary>
          </div>

          <StudentToolsBar
            availableTools={availableTools}
            activeTool={activeTool}
            onOpenTool={tool => setActiveTool(prev => prev === tool ? null : tool)}
            isQuizActive={isQuizActive}
            mode="desktop"
          />
        </div>

        {/* Mobile bottom tab bar */}
        <StudentToolsBar
          availableTools={mobileAvailableTools}
          activeTool={activeTool}
          onOpenTool={tool => setActiveTool(prev => prev === tool ? null : tool)}
          isQuizActive={isQuizActive}
          mode="mobile"
        />
      </div>

      <StudentMaterialsModal
        lessonId={lesson.id}
        isOpen={activeTool !== null}
        activeTool={activeTool}
        availableTools={availableTools}
        onSwitchTool={setActiveTool}
        onClose={() => setActiveTool(null)}
      />

      {settingsDisclosure.isOpen && (
        <LessonSettingsModal
          lesson={lesson}
          onClose={settingsDisclosure.close}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
      {planEditDisclosure.isOpen && (
        <LessonPlanModal
          lesson={lesson}
          onClose={planEditDisclosure.close}
          onUpdate={handleUpdate}
        />
      )}

      <LessonToolModals
        canEdit={canEdit}
        editingTool={editingTool}
        onClose={() => setEditingTool(null)}
        onToolUpdated={updated => setTools(prev => prev.map(t => t.id === updated.id ? updated : t).sort((a, b) => a.order - b.order))}
      />

      {canEdit && isAddingAssignment && (
        <AssignmentFormModal
          onSubmit={async payload => { await handleCreateAssignment(payload as Parameters<typeof handleCreateAssignment>[0]); }}
          onClose={() => setIsAddingAssignment(false)}
        />
      )}
      {canEdit && editingAssignment !== null && (
        <AssignmentFormModal
          initial={editingAssignment}
          onSubmit={async payload => { await handleUpdateAssignment(editingAssignment.id, payload as UpdateAssignmentPayload); }}
          onClose={() => setEditingAssignment(null)}
        />
      )}
      {canEdit && deletingAssignmentId !== null && (
        <ConfirmDialog
          title="Delete assignment?"
          message={`This will permanently delete "${assignments.find(a => a.id === deletingAssignmentId)?.title ?? 'this assignment'}" and cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => handleDeleteAssignment(deletingAssignmentId, assignmentItems, activeIdx)}
          onClose={() => setDeletingAssignmentId(null)}
        />
      )}
    </>
  );
}
