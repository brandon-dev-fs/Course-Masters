import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AssessmentResults from '../../../features/assessments/AssessmentResults.js';
import type { AttemptResult } from '../../../api/types.js';

const passedResult: AttemptResult = {
  score: 0.9,
  passed: true,
  correctCount: 9,
  totalQuestions: 10,
};

const failedResult: AttemptResult = {
  score: 0.5,
  passed: false,
  correctCount: 5,
  totalQuestions: 10,
};

describe('AssessmentResults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders passed state', () => {
    render(<AssessmentResults result={passedResult} onRetake={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText(/passed!/i)).toBeInTheDocument();
  });

  it('renders failed state', () => {
    render(<AssessmentResults result={failedResult} onRetake={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText(/not passed/i)).toBeInTheDocument();
  });

  it('shows correct count', () => {
    render(<AssessmentResults result={passedResult} onRetake={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByText(/9 \/ 10 correct/i)).toBeInTheDocument();
  });

  it('calls onRetake when Try Again clicked', () => {
    const onRetake = vi.fn();
    render(<AssessmentResults result={failedResult} onRetake={onRetake} onDismiss={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetake).toHaveBeenCalledOnce();
  });

  it('calls onDismiss when dismiss button clicked', () => {
    const onDismiss = vi.fn();
    render(<AssessmentResults result={passedResult} onRetake={vi.fn()} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
