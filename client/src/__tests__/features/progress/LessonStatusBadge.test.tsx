import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LessonStatusBadge from '../../../features/progress/LessonStatusBadge.js';

describe('LessonStatusBadge', () => {
  it('renders nothing when hasQuiz is false', () => {
    const { container } = render(<LessonStatusBadge quizPassed={false} hasQuiz={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows "Passed" when quiz is passed', () => {
    render(<LessonStatusBadge quizPassed={true} hasQuiz={true} />);
    expect(screen.getByText(/passed/i)).toBeInTheDocument();
  });

  it('shows "Not taken" when quiz not passed', () => {
    render(<LessonStatusBadge quizPassed={false} hasQuiz={true} />);
    expect(screen.getByText(/not taken/i)).toBeInTheDocument();
  });
});
