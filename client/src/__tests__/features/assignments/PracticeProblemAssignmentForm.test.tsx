vi.mock('../../../features/assignments/question-editors/index.js', () => ({
  MultipleChoiceEditor: ({ onChange }: { onChange: (c: Record<string, unknown>) => void }) => (
    <div data-testid="mc-editor">
      <button type="button" onClick={() => onChange({ options: ['updated', 'option'], correctIndex: 0 })}>
        MC Change
      </button>
    </div>
  ),
  TrueFalseEditor: () => <div data-testid="tf-editor" />,
  MatchingEditor: () => <div data-testid="matching-editor" />,
  FillInBlankEditor: () => <div data-testid="fib-editor" />,
}));

import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PracticeProblemAssignmentForm, {
  type PracticeQuestionDraft,
} from '../../../features/assignments/PracticeProblemAssignmentForm.js';

const baseSubFormProps = {
  noteContent: null, url: '',
  estimatedMinutes: '', passingPercentage: '', entries: [],
  fetchingVideoTitle: false, handleVideoUrlBlur: async () => {},
  onNoteContentChange: () => {}, onUrlChange: () => {},
  onEstimatedMinutesChange: () => {},
  onPassingPercentageChange: () => {}, onEntriesChange: () => {},
};

function Wrapper({ initial = [] }: { initial?: PracticeQuestionDraft[] }) {
  const [questions, setQuestions] = useState(initial);
  return (
    <PracticeProblemAssignmentForm {...baseSubFormProps} questions={questions} onQuestionsChange={setQuestions} />
  );
}

const baseQuestion: PracticeQuestionDraft = {
  type: 'multiple_choice',
  order: 1,
  content: { question: '', options: ['', ''], correctIndex: 0 },
};

describe('PracticeProblemAssignmentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error when no questions', () => {
    render(<Wrapper />);
    expect(screen.getByText(/at least one question is required/i)).toBeInTheDocument();
  });

  it('shows Add question button', () => {
    render(<Wrapper />);
    expect(screen.getByRole('button', { name: /add question/i })).toBeInTheDocument();
  });

  it('renders a question card when questions exist', () => {
    render(<Wrapper initial={[baseQuestion]} />);
    expect(screen.getByText('Question 1')).toBeInTheDocument();
  });

  it('adds a question when Add question is clicked', () => {
    render(<Wrapper initial={[baseQuestion]} />);
    fireEvent.click(screen.getByRole('button', { name: /add question/i }));
    expect(screen.getByText('Question 2')).toBeInTheDocument();
  });

  it('removes a question when remove button is clicked', () => {
    render(<Wrapper initial={[baseQuestion, { ...baseQuestion, order: 2 }]} />);
    expect(screen.getByText('Question 2')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /remove question 1/i })[0]);
    expect(screen.queryByText('Question 2')).not.toBeInTheDocument();
  });

  it('disables move up for first question', () => {
    render(<Wrapper initial={[baseQuestion, { ...baseQuestion, order: 2 }]} />);
    expect(screen.getByRole('button', { name: /move question 1 up/i })).toBeDisabled();
  });

  it('disables move down for last question', () => {
    render(<Wrapper initial={[baseQuestion, { ...baseQuestion, order: 2 }]} />);
    expect(screen.getByRole('button', { name: /move question 2 down/i })).toBeDisabled();
  });

  it('moves question down when move down is clicked', () => {
    render(<Wrapper initial={[baseQuestion, { ...baseQuestion, order: 2 }]} />);
    fireEvent.click(screen.getByRole('button', { name: /move question 1 down/i }));
    // Both still exist — just reordered
    expect(screen.getByText('Question 1')).toBeInTheDocument();
    expect(screen.getByText('Question 2')).toBeInTheDocument();
  });

  it('moves question up when move up is clicked', () => {
    render(<Wrapper initial={[baseQuestion, { ...baseQuestion, order: 2 }]} />);
    fireEvent.click(screen.getByRole('button', { name: /move question 2 up/i }));
    expect(screen.getByText('Question 1')).toBeInTheDocument();
  });

  it('shows multiple choice editor by default', () => {
    render(<Wrapper initial={[baseQuestion]} />);
    expect(screen.getByTestId('mc-editor')).toBeInTheDocument();
  });

  it('shows true/false editor when type changed to true_false', () => {
    render(<Wrapper initial={[baseQuestion]} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'true_false' } });
    expect(screen.getByTestId('tf-editor')).toBeInTheDocument();
  });

  it('shows matching editor when type changed to matching', () => {
    render(<Wrapper initial={[baseQuestion]} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'matching' } });
    expect(screen.getByTestId('matching-editor')).toBeInTheDocument();
  });

  it('shows fill-in-blank editor when type changed to fill_in_blank', () => {
    render(<Wrapper initial={[baseQuestion]} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'fill_in_blank' } });
    expect(screen.getByTestId('fib-editor')).toBeInTheDocument();
  });

  it('updates question content when editor onChange fires', () => {
    const onQuestionsChange = vi.fn();
    render(
      <PracticeProblemAssignmentForm
        {...baseSubFormProps}
        questions={[baseQuestion]}
        onQuestionsChange={onQuestionsChange}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /mc change/i }));
    expect(onQuestionsChange).toHaveBeenCalledWith([
      expect.objectContaining({
        content: { options: ['updated', 'option'], correctIndex: 0 },
      }),
    ]);
  });

  it('does not error after removing one of two questions', () => {
    render(<Wrapper initial={[baseQuestion, { ...baseQuestion, order: 2 }]} />);
    fireEvent.click(screen.getAllByRole('button', { name: /remove question/i })[1]);
    expect(screen.getByText('Question 1')).toBeInTheDocument();
    expect(screen.queryByText('Question 2')).not.toBeInTheDocument();
  });
});
