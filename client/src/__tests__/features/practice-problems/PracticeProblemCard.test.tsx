import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PracticeProblemCard from '../../../features/practice-problems/PracticeProblemCard.js';
import type { LessonTool } from '../../../api/types.js';

const practiceTool: LessonTool = {
  id: 't1',
  type: 'practice_problem',
  title: 'Q1',
  content: {
    question: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctIndex: 1,
    calculatorEnabled: false,
  },
  order: 1,
  lessonId: 'l1',
  isRequired: false,
};

describe('PracticeProblemCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<PracticeProblemCard problem={practiceTool} />);
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
  });

  it('shows all answer options', () => {
    render(<PracticeProblemCard problem={practiceTool} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows Check Answer button initially', () => {
    render(<PracticeProblemCard problem={practiceTool} />);
    expect(screen.getByRole('button', { name: /check answer/i })).toBeInTheDocument();
  });

  it('enables check button after selecting an option', () => {
    render(<PracticeProblemCard problem={practiceTool} />);
    const checkBtn = screen.getByRole('button', { name: /check answer/i });
    expect(checkBtn).toBeDisabled();
    fireEvent.click(screen.getByLabelText('4'));
    expect(checkBtn).not.toBeDisabled();
  });

  it('shows correct after checking the right answer', () => {
    render(<PracticeProblemCard problem={practiceTool} />);
    fireEvent.click(screen.getByLabelText('4'));
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }));
    expect(screen.getByText(/correct!/i)).toBeInTheDocument();
  });

  it('shows unsupported message for wrong type', () => {
    const wrong = { ...practiceTool, type: 'vocab' } as unknown as LessonTool;
    render(<PracticeProblemCard problem={wrong} />);
    expect(screen.getByText(/unsupported tool type/i)).toBeInTheDocument();
  });
});
