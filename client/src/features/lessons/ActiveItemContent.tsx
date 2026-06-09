import type { Assignment, Bookmark, LessonResource, LessonTool } from '../../api/types.js';
import type { AssignmentItem } from './AssignmentSection.js';
import LessonPlanView from './LessonPlanView.js';
import LessonResourceContent from './LessonResourceContent.js';
import LessonToolContent from './LessonToolContent.js';
import LessonAssignmentContent from './LessonAssignmentContent.js';
import AssessmentSection from '../assessments/AssessmentSection.js';
import { assessmentsApi } from '../../api/assessments.js';
import type { Lesson } from '../../api/types.js';

const quizApi = {
  get: assessmentsApi.getLessonQuiz,
  create: assessmentsApi.createLessonQuiz,
  update: assessmentsApi.update,
  submitAttempt: assessmentsApi.submitAttempt,
  getAttempts: assessmentsApi.getAttempts,
};

interface ActiveItemContentProps {
  item: AssignmentItem;
  lesson: Lesson;
  resources: LessonResource[];
  tools: LessonTool[];
  assignments: Assignment[];
  canEdit: boolean;
  editingVideoId: string | null;
  newNoteIdRef: React.RefObject<string | null>;
  onVideoEditStart: (id: string) => void;
  onVideoEditCancel: () => void;
  onVideoUpdated: (updated: LessonResource) => void;
  onVideoDeleted: (id: string) => void;
  onNoteUpdated: (updated: LessonResource) => void;
  onEditTool: (tool: LessonTool) => void;
  onToolDeleted: (id: string) => void;
  onToolUpdated: (updated: LessonTool) => void;
  onToggleAssignmentCompletion: (assignment: Assignment) => Promise<void>;
  onBookmarkChange: (assignmentId: string, bookmark: Bookmark | null) => void;
  isStudent: boolean;
  onPlanEdit: () => void;
}

export default function ActiveItemContent({
  item,
  lesson,
  resources,
  tools,
  assignments,
  canEdit,
  editingVideoId,
  newNoteIdRef,
  onVideoEditStart,
  onVideoEditCancel,
  onVideoUpdated,
  onVideoDeleted,
  onNoteUpdated,
  onEditTool,
  onToolDeleted,
  onToolUpdated,
  onToggleAssignmentCompletion,
  onBookmarkChange,
  isStudent,
  onPlanEdit,
}: ActiveItemContentProps) {
  if (item.kind === 'lessonPlan') {
    return (
      <LessonPlanView
        lesson={lesson}
        canEdit={canEdit}
        onEdit={onPlanEdit}
      />
    );
  }

  if (item.kind === 'quiz') {
    return (
      <AssessmentSection
        parentId={lesson.id}
        api={quizApi}
        label="Lesson Quiz"
        createLabel="Create Quiz"
        takeLabel="Take Quiz"
        retakeLabel="Retake Quiz"
        modalTitle="Lesson Quiz"
        resultsTitle="Quiz Results"
        displayMode="inline"
      />
    );
  }

  if (item.kind === 'resource') {
    const resource = resources.find(r => r.id === item.id);
    if (!resource) return null;
    return (
      <LessonResourceContent
        resource={resource}
        canEdit={canEdit}
        editingVideoId={editingVideoId}
        newNoteIdRef={newNoteIdRef}
        onVideoEditStart={onVideoEditStart}
        onVideoEditCancel={onVideoEditCancel}
        onVideoUpdated={onVideoUpdated}
        onVideoDeleted={onVideoDeleted}
        onNoteUpdated={onNoteUpdated}
      />
    );
  }

  if (item.kind === 'tool') {
    const tool = tools.find(t => t.id === item.id);
    if (!tool) return null;
    return (
      <LessonToolContent
        tool={tool}
        canEdit={canEdit}
        onEditRequest={onEditTool}
        onDeleted={onToolDeleted}
        onToolUpdated={onToolUpdated}
      />
    );
  }

  if (item.kind === 'assignment') {
    const assignment = assignments.find(a => a.id === item.id);
    if (!assignment) return null;
    return (
      <LessonAssignmentContent
        assignment={assignment}
        onToggleAssignmentCompletion={onToggleAssignmentCompletion}
        onBookmarkChange={onBookmarkChange}
        isStudent={isStudent}
      />
    );
  }

  return null;
}
