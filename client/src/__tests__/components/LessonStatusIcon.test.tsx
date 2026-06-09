import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LessonStatusIcon from '../../components/LessonStatusIcon.js';

describe('LessonStatusIcon', () => {
  it('renders without crashing when no prog provided', () => {
    const { container } = render(<LessonStatusIcon />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders the default (not attempted) state', () => {
    const { container } = render(<LessonStatusIcon prog={undefined} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders attempted (not passed) state', () => {
    const { container } = render(
      <LessonStatusIcon prog={{ lessonId: 'l1', hasQuiz: true, attempted: true, quizPassed: false }} />,
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders quiz passed state', () => {
    const { container } = render(
      <LessonStatusIcon prog={{ lessonId: 'l1', hasQuiz: true, attempted: true, quizPassed: true }} />,
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});
