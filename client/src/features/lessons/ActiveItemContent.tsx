import type { Assignment, Bookmark, Lesson } from '../../api/types.js';
import type { AssignmentItem } from './AssignmentSection.js';
import LessonPlanView from './LessonPlanView.js';
import LessonAssignmentContent from './LessonAssignmentContent.js';
import AssessmentSection from '../assessments/AssessmentSection.js';
import { assessmentsApi } from '../../api/assessments.js';

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
  assignments: Assignment[];
  canEdit: boolean;
  onToggleAssignmentCompletion: (assignment: Assignment) => Promise<void>;
  onBookmarkChange: (assignmentId: string, bookmark: Bookmark | null) => void;
  isStudent: boolean;
  onPlanEdit: () => void;
}

export default function ActiveItemContent({
  item,
  lesson,
  assignments,
  canEdit,
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
        canEdit={canEdit}
        lessonId={lesson.id}
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
