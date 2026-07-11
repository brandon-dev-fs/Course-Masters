import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AssessmentTaker from '../../../features/assessments/AssessmentTaker.js';
import type { AssessmentQuestion } from '../../../api/types.js';

const questions: AssessmentQuestion[] = [
  {
    id: 'q1',
    type: 'multiple_choice',
    question: 'What is 2+2?',
    content: { options: ['3', '4', '5', '6'], correctIndex: 1 },
    order: 1,
    calculatorEnabled: false,
  },
  {
    id: 'q2',
    type: 'multiple_choice',
    question: 'What is 3+3?',
    content: { options: ['5', '6', '7', '8'], correctIndex: 1 },
    order: 2,
    calculatorEnabled: false,
  },
];

describe('AssessmentTaker', () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders first question', () => {
    render(<AssessmentTaker questions={questions} onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByText(/what is 2\+2/i)).toBeInTheDocument();
  });

  it('shows question counter', () => {
    render(<AssessmentTaker questions={questions} onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('renders answer options', () => {
    render(<AssessmentTaker questions={questions} onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('navigates to next question when Next is clicked', () => {
    render(<AssessmentTaker questions={questions} onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /^next/i }));
    expect(screen.getByText(/what is 3\+3/i)).toBeInTheDocument();
  });

  it('shows Previous button on second question', () => {
    render(<AssessmentTaker questions={questions} onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /^next/i }));
    expect(screen.getByRole('button', { name: /previous/i })).not.toBeDisabled();
  });

  it('navigates back when Previous is clicked', () => {
    render(<AssessmentTaker questions={questions} onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /^next/i }));
    fireEvent.click(screen.getByRole('button', { name: /previous/i }));
    expect(screen.getByText(/what is 2\+2/i)).toBeInTheDocument();
  });

  it('shows error when submitting without all answers', async () => {
    // Use single question, don't answer, and submit
    render(<AssessmentTaker questions={[questions[0]]} onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Submit'));
    await waitFor(() => {
      expect(screen.getByText(/please answer all questions/i)).toBeInTheDocument();
    });
  });

  it('calls onSubmit when all questions are answered', async () => {
    render(<AssessmentTaker questions={[questions[0]]} onSubmit={onSubmit} onCancel={onCancel} />);
    // Select an answer - click the label text which triggers the radio onChange
    const options = screen.getAllByRole('radio');
    fireEvent.click(options[1]);
    fireEvent.click(screen.getByText('Submit'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
  });

  it('calls onCancel when Cancel is clicked', () => {
    render(<AssessmentTaker questions={questions} onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows calculator button when question has calculatorEnabled', () => {
    const questionsWithCalc: AssessmentQuestion[] = [
      { ...questions[0], calculatorEnabled: true },
    ];
    render(<AssessmentTaker questions={questionsWithCalc} onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByLabelText(/open calculator/i)).toBeInTheDocument();
  });

  it('does not show calculator button when calculatorEnabled is false', () => {
    render(<AssessmentTaker questions={questions} onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.queryByLabelText(/calculator/i)).not.toBeInTheDocument();
  });

  it('toggles calculator button label when clicked', () => {
    const questionsWithCalc: AssessmentQuestion[] = [
      { ...questions[0], calculatorEnabled: true },
    ];
    render(<AssessmentTaker questions={questionsWithCalc} onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.click(screen.getByLabelText(/open calculator/i));
    expect(screen.getByLabelText(/close calculator/i)).toBeInTheDocument();
  });

  it('shows error message when onSubmit throws', async () => {
    const failingSubmit = vi.fn().mockRejectedValue(new Error('Submission failed'));
    const singleQ = [{ ...questions[0] }];
    render(<AssessmentTaker questions={singleQ} onSubmit={failingSubmit} onCancel={onCancel} />);
    fireEvent.click(screen.getAllByRole('radio')[0]);
    fireEvent.click(screen.getByText('Submit'));
    await waitFor(() => expect(screen.getByText('Submission failed')).toBeInTheDocument());
  });
});

// ── True/False questions ──────────────────────────────────────────────────────

describe('AssessmentTaker — true_false', () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  const tfQuestion: AssessmentQuestion = {
    id: 'q-tf',
    type: 'true_false',
    question: 'Is the sky blue?',
    content: { correct: true },
    order: 1,
    calculatorEnabled: false,
  };

  beforeEach(() => vi.clearAllMocks());

  it('renders True and False buttons', () => {
    render(<AssessmentTaker questions={[tfQuestion]} onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByRole('button', { name: 'True' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'False' })).toBeInTheDocument();
  });

  it('submits after selecting True', async () => {
    render(<AssessmentTaker questions={[tfQuestion]} onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: 'True' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith([true]));
  });

  it('submits after selecting False', async () => {
    render(<AssessmentTaker questions={[tfQuestion]} onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: 'False' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith([false]));
  });

  it('shows error when submitting without answering', async () => {
    render(<AssessmentTaker questions={[tfQuestion]} onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() =>
      expect(screen.getByText(/please answer all questions/i)).toBeInTheDocument(),
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

// ── Fill-in-blank questions ───────────────────────────────────────────────────

describe('AssessmentTaker — fill_in_blank', () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  const fibQuestion: AssessmentQuestion = {
    id: 'q-fib',
    type: 'fill_in_blank',
    question: 'Complete: {{blank_1}} is the capital of France.',
    content: { blanks: [{ answer: 'Paris', alternatives: [] }] },
    order: 1,
    calculatorEnabled: false,
  };

  beforeEach(() => vi.clearAllMocks());

  it('renders blank input fields', () => {
    render(<AssessmentTaker questions={[fibQuestion]} onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByLabelText(/blank 1/i)).toBeInTheDocument();
  });

  it('accepts text input for blanks', () => {
    render(<AssessmentTaker questions={[fibQuestion]} onSubmit={onSubmit} onCancel={onCancel} />);
    const input = screen.getByLabelText(/blank 1/i);
    fireEvent.change(input, { target: { value: 'Paris' } });
    expect(input).toHaveValue('Paris');
  });

  it('submits after filling all blanks', async () => {
    render(<AssessmentTaker questions={[fibQuestion]} onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.change(screen.getByLabelText(/blank 1/i), { target: { value: 'Paris' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith([['Paris']]));
  });

  it('shows error when blank is left empty', async () => {
    render(<AssessmentTaker questions={[fibQuestion]} onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() =>
      expect(screen.getByText(/please answer all questions/i)).toBeInTheDocument(),
    );
  });

  it('shows error when blank contains only whitespace', async () => {
    render(<AssessmentTaker questions={[fibQuestion]} onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.change(screen.getByLabelText(/blank 1/i), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() =>
      expect(screen.getByText(/please answer all questions/i)).toBeInTheDocument(),
    );
  });
});

// ── Matching questions ────────────────────────────────────────────────────────

describe('AssessmentTaker — matching', () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  const matchQuestion: AssessmentQuestion = {
    id: 'q-m',
    type: 'matching',
    question: 'Match countries to capitals.',
    content: {
      pairs: [
        { id: 'p1', left: 'France', right: 'Paris' },
        { id: 'p2', left: 'Germany', right: 'Berlin' },
      ],
    },
    order: 1,
    calculatorEnabled: false,
  };

  beforeEach(() => vi.clearAllMocks());

  it('renders left-side terms', () => {
    render(<AssessmentTaker questions={[matchQuestion]} onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByText('France')).toBeInTheDocument();
    expect(screen.getByText('Germany')).toBeInTheDocument();
  });

  it('renders select dropdowns for each pair', () => {
    render(<AssessmentTaker questions={[matchQuestion]} onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByLabelText(/match for: france/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/match for: germany/i)).toBeInTheDocument();
  });

  it('shows error when no pairs are matched', async () => {
    render(<AssessmentTaker questions={[matchQuestion]} onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() =>
      expect(screen.getByText(/please answer all questions/i)).toBeInTheDocument(),
    );
  });

  it('submits once all pairs are selected', async () => {
    render(<AssessmentTaker questions={[matchQuestion]} onSubmit={onSubmit} onCancel={onCancel} />);
    const franceSelect = screen.getByLabelText(/match for: france/i);
    const germanySelect = screen.getByLabelText(/match for: germany/i);
    // Right-side options are shuffled, but the original values are always present as options
    fireEvent.change(franceSelect, { target: { value: 'Paris' } });
    fireEvent.change(germanySelect, { target: { value: 'Berlin' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
  });
});
