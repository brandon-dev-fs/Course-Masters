import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import QuizButton from '../../../features/lessons/QuizButton.js';

describe('QuizButton', () => {
  const onTakeQuiz = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows locked message when not all complete', () => {
    render(<QuizButton allComplete={false} onTakeQuiz={onTakeQuiz} />);
    expect(screen.getByText(/complete all learning resources/i)).toBeInTheDocument();
  });

  it('shows Take Quiz button when all complete', () => {
    render(<QuizButton allComplete={true} onTakeQuiz={onTakeQuiz} />);
    expect(screen.getByText('Take Quiz')).toBeInTheDocument();
  });

  it('does not show Take Quiz when locked', () => {
    render(<QuizButton allComplete={false} onTakeQuiz={onTakeQuiz} />);
    expect(screen.queryByText('Take Quiz')).not.toBeInTheDocument();
  });

  it('calls onTakeQuiz when button is clicked', () => {
    render(<QuizButton allComplete={true} onTakeQuiz={onTakeQuiz} />);
    fireEvent.click(screen.getByText('Take Quiz'));
    expect(onTakeQuiz).toHaveBeenCalledOnce();
  });
});
