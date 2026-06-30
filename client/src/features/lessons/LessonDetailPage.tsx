import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import useDisclosure from '../../hooks/useDisclosure.js';
import { useAuth } from '../../context/AuthContext.js';
import { Menu, ArrowLeft, Settings, PencilRuler } from 'lucide-react';
import { assessmentsApi } from '../../api/assessments.js';
import type { UpdateAssignmentPayload } from '../../api/assignments.js';
import useLesson from './hooks/useLesson.js';
import useAssignments, { completionKeyOf } from './hooks/useAssignments.js';
import type { AssignmentItem } from './AssignmentSection.js';
import UnitLessonSidebar from './UnitLessonSidebar.js';
import ActiveItemContent from './ActiveItemContent.js';
import LessonSettingsModal from './LessonSettingsModal.js';
import LessonPlanModal from './LessonPlanModal.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import AssignmentStepper from './AssignmentStepper.js';
import type { StepperItem } from './AssignmentStepper.js';
import AssignmentSection from './AssignmentSection.js';
import BookmarkButton from './BookmarkButton.js';
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

  const { user } = useAuth();
  const isStudent = user?.role === 'student';

  const {
    assignments,
    assignmentItems, completedAssignmentIds, incompleteRequired, availableTools,
    isAddingAssignment, setIsAddingAssignment,
    editingAssignment, setEditingAssignment,
    deletingAssignmentId, setDeletingAssignmentId,
    handleCreateAssignment, handleAddCreatedAssignment, handleUpdateAssignment, handleDeleteAssignment,
    handleMoveAssignment, handleToggleAssignmentCompletion, handleBookmarkChange,
  } = useAssignments({ lessonId, lesson, setActiveStepKey });

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

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!lesson) return null;

  const isQuizActive = activeStepKey === 'quiz';
  const unitTestActive = activeStepKey === 'unit-test';
  const activeItem = assignmentItems.find(item => item.key === activeStepKey) ?? assignmentItems[0];
  const activeIdx = assignmentItems.findIndex(item => item.key === activeItem?.key);

  const quizUnlocked = assignments.length === 0
    || assignments.every(a => completedAssignmentIds.has(a.id));
  const quizPassed = unitProgress?.lessons.find(l => l.lessonId === lesson.id)?.quizPassed ?? false;
  const allLessonsComplete = unitProgress
    ? unitProgress.totalLessons > 0 && unitProgress.completedLessons === unitProgress.totalLessons
    : false;
  const completedLessonIds = new Set(
    unitProgress?.lessons.filter(l => l.quizPassed).map(l => l.lessonId) ?? []
  );

  const stepperItems: StepperItem[] = assignmentItems.map(item => ({
    key: item.key,
    title: item.title,
    kind: item.kind,
    completionId: completionKeyOf(item, lesson.id),
    assignmentType: item.assignmentType,
  }));

  const sortedAssignments = [...assignments].sort((a, b) => a.order - b.order);
  let onMoveUp: (() => void) | undefined;
  let onMoveDown: (() => void) | undefined;
  if (activeItem?.kind === 'assignment') {
    const ai = sortedAssignments.findIndex(a => a.id === activeItem.id);
    if (ai > 0) onMoveUp = () => handleMoveAssignment(activeItem.id!, 'up');
    if (ai < sortedAssignments.length - 1) onMoveDown = () => handleMoveAssignment(activeItem.id!, 'down');
  }

  const isComplete = !activeItem ? false
    : activeItem.kind === 'quiz' ? quizPassed
    : activeItem.kind === 'assignment' && activeItem.id ? completedAssignmentIds.has(activeItem.id)
    : false;

  const activeAssignment = activeItem?.kind === 'assignment'
    ? assignments.find(a => a.id === activeItem.id)
    : undefined;

  const onToggleCompletion = activeAssignment
    ? () => handleToggleAssignmentCompletion(activeAssignment)
    : () => {};

  const currentUnit = units.find(u => u.id === unitId);

  // Mobile tab bar uses the same available tools as desktop
  const mobileAvailableTools = availableTools;

  return (
    <>
      {canEdit && courseId && (
        <div className="sticky top-0 z-40 bg-orange-surface border-b border-orange-accent/30">
          <div className="container mx-auto px-4 md:px-6 py-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-orange-surface-text">
              <PencilRuler className="w-4 h-4 shrink-0" aria-hidden="true" />
              Teacher Preview — you&apos;re viewing as a student
            </div>
            <Link
              to={`/courses/${courseId}/builder`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-xl
                bg-green-button text-green-button-text hover:opacity-90 transition-opacity shadow-warm-sm shrink-0"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Back to Builder
            </Link>
          </div>
        </div>
      )}
      <div
        className="relative -mx-4 flex flex-col flex-1"
        style={{ width: '100vw', left: '50%', marginLeft: '-50vw' }}
      >
        {/* Desktop top bar */}
        <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-surface border-b border-border shrink-0">
          <h1 className="sr-only">{lesson.title}</h1>
          <Link
            to={`/courses/${courseId}`}
            className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
            aria-label={`Back to ${currentUnit?.title ?? courseTitle}`}
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            {currentUnit?.title ?? courseTitle}
          </Link>
          <div className="flex-1" />
          {canEdit && (
            <button
              onClick={settingsDisclosure.open}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors shrink-0"
              aria-label="Lesson settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
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
          {/* Row 2: lesson title + settings */}
          <div className="flex items-center gap-2 px-4 pb-2">
            <h1 className="text-base font-bold text-foreground flex-1">{lesson.title}</h1>
            {canEdit && (
              <button
                onClick={settingsDisclosure.open}
                className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors shrink-0"
                aria-label="Lesson settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
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
                className="flex-1 min-w-0 overflow-y-auto px-4 py-6 pb-24 lg:pb-6"
              >
                {/* Scoped live region announces only step changes, not every child mutation */}
                <span
                  aria-live="polite"
                  aria-atomic="true"
                  className="sr-only"
                >
                  {activeItem?.title ?? ''}
                </span>
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
                      headerRight={isStudent && activeAssignment ? (
                        <BookmarkButton
                          assignmentId={activeAssignment.id}
                          bookmark={activeAssignment.bookmark ?? null}
                          onBookmarkChange={(bookmark) => handleBookmarkChange(activeAssignment.id, bookmark)}
                        />
                      ) : undefined}
                    >
                      <ActiveItemContent
                        item={activeItem}
                        lesson={lesson}
                        assignments={assignments}
                        canEdit={canEdit}
                        onToggleAssignmentCompletion={handleToggleAssignmentCompletion}
                        onBookmarkChange={handleBookmarkChange}
                        isStudent={isStudent}
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
        assignments={assignments}
        onNavigateToAssignment={(id) => setActiveStepKey(`assignment:${id}`)}
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

      {canEdit && isAddingAssignment && (
        <AssignmentFormModal
          lessonId={lessonId}
          onFileCreate={handleAddCreatedAssignment}
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
