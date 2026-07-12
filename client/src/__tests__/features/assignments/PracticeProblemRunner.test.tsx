import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PracticeProblemRunner from '../../../features/assignments/PracticeProblemRunner.js';
import type { PracticeQuestion } from '../../../api/types.js';

const mcQuestion: PracticeQuestion = {
  id: 'q1',
  type: 'multiple_choice',
  order: 1,
  content: {
    question: 'What is 2+2?',
    options: ['2', '3', '4', '5'],
    correctIndex: 2,
  },
};

const tfQuestion: PracticeQuestion = {
  id: 'q2',
  type: 'true_false',
  order: 2,
  content: {
    question: 'The sky is blue.',
    correct: true,
  },
};

const fibQuestion: PracticeQuestion = {
  id: 'q3',
  type: 'fill_in_blank',
  order: 3,
  content: {
    question: 'The capital of France is ___.',
    blanks: [{ answer: 'Paris', alternatives: ['paris'] }],
  },
};

const matchingQuestion: PracticeQuestion = {
  id: 'q4',
  type: 'matching',
  order: 4,
  content: {
    question: 'Match:',
    leftItems: ['Cat', 'Dog'],
    rightItems: ['Meows', 'Barks'],
    correctPairs: [[0, 0], [1, 1]],
  },
};

describe('PracticeProblemRunner', () => {
  it('shows no questions message when questions array is empty', () => {
    render(
      <PracticeProblemRunner
        questions={[]}
        onAutoComplete={vi.fn()}
        onManualComplete={vi.fn()}
      />,
    );
    expect(screen.getByText(/no questions available/i)).toBeInTheDocument();
  });

  it('renders first multiple choice question', () => {
    render(
      <PracticeProblemRunner
        questions={[mcQuestion]}
        onAutoComplete={vi.fn()}
        onManualComplete={vi.fn()}
      />,
    );
    expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 1')).toBeInTheDocument();
  });

  it('submit button is disabled until an answer is selected', () => {
    render(
      <PracticeProblemRunner
        questions={[mcQuestion]}
        onAutoComplete={vi.fn()}
        onManualComplete={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
  });

  it('enables submit button after selecting an answer', () => {
    render(
      <PracticeProblemRunner
        questions={[mcQuestion]}
        onAutoComplete={vi.fn()}
        onManualComplete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByRole('radio')[2]); // index 2 is option '4' (correctIndex)
    expect(screen.getByRole('button', { name: /submit/i })).not.toBeDisabled();
  });

  it('shows correct feedback after selecting correct answer', () => {
    render(
      <PracticeProblemRunner
        questions={[mcQuestion]}
        onAutoComplete={vi.fn()}
        onManualComplete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByRole('radio')[2]); // index 2 is correct
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(screen.getByText(/correct!/i)).toBeInTheDocument();
  });

  it('shows incorrect feedback after selecting wrong answer', () => {
    render(
      <PracticeProblemRunner
        questions={[mcQuestion]}
        onAutoComplete={vi.fn()}
        onManualComplete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByRole('radio')[0]); // index 0 is wrong
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
  });

  it('shows results summary after last question', () => {
    render(
      <PracticeProblemRunner
        questions={[mcQuestion]}
        onAutoComplete={vi.fn()}
        onManualComplete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByRole('radio')[2]);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    fireEvent.click(screen.getByRole('button', { name: /see results/i }));
    expect(screen.getByText('1 / 1')).toBeInTheDocument();
  });

  it('shows retry button on summary', () => {
    render(
      <PracticeProblemRunner
        questions={[mcQuestion]}
        onAutoComplete={vi.fn()}
        onManualComplete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByRole('radio')[2]);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    fireEvent.click(screen.getByRole('button', { name: /see results/i }));
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('shows mark complete button when no passing percentage', () => {
    render(
      <PracticeProblemRunner
        questions={[mcQuestion]}
        onAutoComplete={vi.fn()}
        onManualComplete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByRole('radio')[2]);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    fireEvent.click(screen.getByRole('button', { name: /see results/i }));
    expect(screen.getByRole('button', { name: /mark complete/i })).toBeInTheDocument();
  });

  it('renders true/false question', () => {
    render(
      <PracticeProblemRunner
        questions={[tfQuestion]}
        onAutoComplete={vi.fn()}
        onManualComplete={vi.fn()}
      />,
    );
    expect(screen.getByText('The sky is blue.')).toBeInTheDocument();
    expect(screen.getByText('True')).toBeInTheDocument();
    expect(screen.getByText('False')).toBeInTheDocument();
  });

  it('renders fill in blank question', () => {
    render(
      <PracticeProblemRunner
        questions={[fibQuestion]}
        onAutoComplete={vi.fn()}
        onManualComplete={vi.fn()}
      />,
    );
    expect(screen.getByText('The capital of France is ___.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your answer...')).toBeInTheDocument();
  });

  it('renders matching question', () => {
    render(
      <PracticeProblemRunner
        questions={[matchingQuestion]}
        onAutoComplete={vi.fn()}
        onManualComplete={vi.fn()}
      />,
    );
    expect(screen.getByText('Cat')).toBeInTheDocument();
    expect(screen.getByText('Dog')).toBeInTheDocument();
  });

  it('shows passing percentage on summary', () => {
    render(
      <PracticeProblemRunner
        questions={[mcQuestion]}
        passingPercentage={80}
        onAutoComplete={vi.fn().mockResolvedValue(undefined)}
        onManualComplete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByRole('radio')[2]);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    fireEvent.click(screen.getByRole('button', { name: /see results/i }));
    expect(screen.getByText(/passing: 80%/i)).toBeInTheDocument();
  });

  it('calls onManualComplete when Mark complete is clicked', async () => {
    const onManualComplete = vi.fn().mockResolvedValue(undefined);
    render(
      <PracticeProblemRunner
        questions={[mcQuestion]}
        onAutoComplete={vi.fn()}
        onManualComplete={onManualComplete}
      />,
    );
    fireEvent.click(screen.getAllByRole('radio')[0]); // answer (any)
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    fireEvent.click(screen.getByRole('button', { name: /see results/i }));
    fireEvent.click(screen.getByRole('button', { name: /mark complete/i }));
    await waitFor(() => expect(onManualComplete).toHaveBeenCalledOnce());
  });

  it('shows "Assignment completed!" after auto-complete succeeds', async () => {
    const onAutoComplete = vi.fn().mockResolvedValue(undefined);
    render(
      <PracticeProblemRunner
        questions={[mcQuestion]}
        passingPercentage={50}
        onAutoComplete={onAutoComplete}
        onManualComplete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByRole('radio')[2]); // correct answer
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    fireEvent.click(screen.getByRole('button', { name: /see results/i }));
    await waitFor(() => expect(screen.getByText(/assignment completed/i)).toBeInTheDocument());
  });

  it('shows "did not meet passing threshold" when score is below passing', async () => {
    render(
      <PracticeProblemRunner
        questions={[mcQuestion]}
        passingPercentage={80}
        onAutoComplete={vi.fn()}
        onManualComplete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByRole('radio')[0]); // wrong answer
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    fireEvent.click(screen.getByRole('button', { name: /see results/i }));
    expect(screen.getByText(/did not meet the passing threshold/i)).toBeInTheDocument();
  });

  it('resets to question 1 when Retry is clicked', () => {
    render(
      <PracticeProblemRunner
        questions={[mcQuestion]}
        onAutoComplete={vi.fn()}
        onManualComplete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByRole('radio')[2]);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    fireEvent.click(screen.getByRole('button', { name: /see results/i }));
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(screen.getByText('Question 1 of 1')).toBeInTheDocument();
    expect(screen.queryByText(/results/i)).not.toBeInTheDocument();
  });
});

// ── Submission feedback ───────────────────────────────────────────────────────

describe('PracticeProblemRunner — submission feedback', () => {
  it('shows incorrect feedback styling for wrong true/false answer', () => {
    const tfQ: PracticeQuestion = {
      id: 'q-tf',
      type: 'true_false',
      order: 1,
      content: { question: 'Is the sky blue?', correct: true },
    };
    render(
      <PracticeProblemRunner
        questions={[tfQ]}
        onAutoComplete={vi.fn()}
        onManualComplete={vi.fn()}
      />,
    );
    // Select False (wrong) and submit
    const falseLabel = screen.getByText('False').closest('label')!;
    fireEvent.click(falseLabel.querySelector('input')!);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
  });

  it('shows correct feedback styling for correct true/false answer', () => {
    const tfQ: PracticeQuestion = {
      id: 'q-tf',
      type: 'true_false',
      order: 1,
      content: { question: 'Is the sky blue?', correct: true },
    };
    render(
      <PracticeProblemRunner
        questions={[tfQ]}
        onAutoComplete={vi.fn()}
        onManualComplete={vi.fn()}
      />,
    );
    const trueLabel = screen.getByText('True').closest('label')!;
    fireEvent.click(trueLabel.querySelector('input')!);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(screen.getByText(/correct/i)).toBeInTheDocument();
  });

  it('shows "Correct answer" hint when fill-in-blank answer is wrong', () => {
    render(
      <PracticeProblemRunner
        questions={[fibQuestion]}
        onAutoComplete={vi.fn()}
        onManualComplete={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText('Your answer...'), { target: { value: 'London' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(screen.getByText(/correct answer: paris/i)).toBeInTheDocument();
  });

  it('accepts alternative answers for fill-in-blank', () => {
    render(
      <PracticeProblemRunner
        questions={[fibQuestion]}
        onAutoComplete={vi.fn()}
        onManualComplete={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText('Your answer...'), { target: { value: 'paris' } }); // lowercase alternative
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(screen.getByText(/correct!/i)).toBeInTheDocument();
  });

  it('shows correct pairs after matching question is submitted', () => {
    render(
      <PracticeProblemRunner
        questions={[matchingQuestion]}
        onAutoComplete={vi.fn()}
        onManualComplete={vi.fn()}
      />,
    );
    // Select both pairs (left 0 → right 0, left 1 → right 1)
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '0' } });
    fireEvent.change(selects[1], { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(screen.getByText(/correct pairs/i)).toBeInTheDocument();
  });

  it('navigates to next question in multi-question set', () => {
    render(
      <PracticeProblemRunner
        questions={[mcQuestion, tfQuestion]}
        onAutoComplete={vi.fn()}
        onManualComplete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByRole('radio')[0]);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText('The sky is blue.')).toBeInTheDocument();
    expect(screen.getByText('Question 2 of 2')).toBeInTheDocument();
  });
});
