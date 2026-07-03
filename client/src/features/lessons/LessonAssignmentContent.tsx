import type { Assignment, Bookmark } from '../../api/types.js';
import NoteAssignmentView from '../assignments/NoteAssignmentView.js';
import VideoAssignmentView from '../assignments/VideoAssignmentView.js';
import ExternalLinkAssignmentView from '../assignments/ExternalLinkAssignmentView.js';
import VocabAssignmentView from '../assignments/VocabAssignmentView.js';
import PracticeProblemRunner from '../assignments/PracticeProblemRunner.js';
import FileAssignmentView from '../assignments/FileAssignmentView.js';
import BookmarkButton from './BookmarkButton.js';

interface LessonAssignmentContentProps {
  assignment: Assignment;
  onToggleAssignmentCompletion: (assignment: Assignment) => Promise<void>;
  onBookmarkChange: (assignmentId: string, bookmark: Bookmark | null) => void;
  isStudent: boolean;
}

export default function LessonAssignmentContent({
  assignment,
  onToggleAssignmentCompletion,
}: LessonAssignmentContentProps) {
  let content: React.ReactNode = null;

  if (assignment.type === 'note' && assignment.noteAssignment) {
    content = <NoteAssignmentView content={assignment.noteAssignment.content} />;
  } else if (assignment.type === 'video' && assignment.videoAssignment) {
    content = (
      <VideoAssignmentView
        url={assignment.videoAssignment.url}
        title={assignment.title}
      />
    );
  } else if (assignment.type === 'reading' && assignment.readingAssignment) {
    content = (
      <ExternalLinkAssignmentView
        url={assignment.readingAssignment.url}
        estimatedMinutes={assignment.readingAssignment.estimatedMinutes}
      />
    );
  } else if (assignment.type === 'vocab' && assignment.vocabAssignment) {
    content = <VocabAssignmentView entries={assignment.vocabAssignment.entries} lessonId={assignment.lessonId} />;
  } else if (assignment.type === 'practice_problem' && assignment.practiceProblemAssignment) {
    content = (
      <PracticeProblemRunner
        questions={assignment.practiceProblemAssignment.questions}
        passingPercentage={assignment.practiceProblemAssignment.passingPercentage}
        onAutoComplete={() => onToggleAssignmentCompletion({ ...assignment, completed: false })}
        onManualComplete={() => onToggleAssignmentCompletion({ ...assignment, completed: false })}
      />
    );
  } else if (assignment.type === 'file' && assignment.fileAssignment) {
    content = (
      <FileAssignmentView
        assignmentId={assignment.id}
        fileAssignment={assignment.fileAssignment}
      />
    );
  }

  return content;
}
