import type { Assignment } from '../../api/types.js';
import NoteAssignmentView from '../assignments/NoteAssignmentView.js';
import VideoAssignmentView from '../assignments/VideoAssignmentView.js';
import ReadingAssignmentView from '../assignments/ReadingAssignmentView.js';
import VocabAssignmentView from '../assignments/VocabAssignmentView.js';
import PracticeProblemRunner from '../assignments/PracticeProblemRunner.js';

interface LessonAssignmentContentProps {
  assignment: Assignment;
  onToggleAssignmentCompletion: (assignment: Assignment) => Promise<void>;
}

export default function LessonAssignmentContent({
  assignment,
  onToggleAssignmentCompletion,
}: LessonAssignmentContentProps) {
  if (assignment.type === 'note' && assignment.noteAssignment) {
    return <NoteAssignmentView content={assignment.noteAssignment.content} />;
  }
  if (assignment.type === 'video' && assignment.videoAssignment) {
    return (
      <VideoAssignmentView
        url={assignment.videoAssignment.url}
        title={assignment.videoAssignment.title}
      />
    );
  }
  if (assignment.type === 'reading' && assignment.readingAssignment) {
    return (
      <ReadingAssignmentView
        url={assignment.readingAssignment.url}
        description={assignment.readingAssignment.description}
        estimatedMinutes={assignment.readingAssignment.estimatedMinutes}
      />
    );
  }
  if (assignment.type === 'vocab' && assignment.vocabAssignment) {
    return <VocabAssignmentView entries={assignment.vocabAssignment.entries} />;
  }
  if (assignment.type === 'practice_problem' && assignment.practiceProblemAssignment) {
    return (
      <PracticeProblemRunner
        questions={assignment.practiceProblemAssignment.questions}
        passingPercentage={assignment.practiceProblemAssignment.passingPercentage}
        onAutoComplete={() => onToggleAssignmentCompletion({ ...assignment, completed: false })}
        onManualComplete={() => onToggleAssignmentCompletion({ ...assignment, completed: false })}
      />
    );
  }

  return null;
}
