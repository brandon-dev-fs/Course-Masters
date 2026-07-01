import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AssessmentRow from '../../../features/builder/AssessmentRow.js';
import type { BuilderAssessment } from '../../../api/types.js';

const mockAssessment: BuilderAssessment = {
  id: 'a1',
  type: 'lesson_quiz',
  questionCount: 5,
};

describe('AssessmentRow', () => {
  it('renders with role="treeitem"', () => {
    render(
      <AssessmentRow
        assessment={null}
        label="Lesson Quiz"
        level={3}
        indentClass="pl-8"
      />,
    );
    expect(screen.getByRole('treeitem')).toBeInTheDocument();
  });

  it('renders aria-label with "no questions yet" when assessment is null', () => {
    render(
      <AssessmentRow
        assessment={null}
        label="Lesson Quiz"
        level={3}
        indentClass="pl-8"
      />,
    );
    expect(screen.getByRole('treeitem')).toHaveAttribute(
      'aria-label',
      'Lesson Quiz — no questions yet',
    );
  });

  it('renders aria-label with question count when assessment is present', () => {
    render(
      <AssessmentRow
        assessment={mockAssessment}
        label="Lesson Quiz"
        level={3}
        indentClass="pl-8"
      />,
    );
    expect(screen.getByRole('treeitem')).toHaveAttribute(
      'aria-label',
      'Lesson Quiz — 5 questions',
    );
  });

  it('renders aria-level matching the level prop', () => {
    render(
      <AssessmentRow
        assessment={null}
        label="Unit Quiz"
        level={2}
        indentClass="pl-4"
      />,
    );
    expect(screen.getByRole('treeitem')).toHaveAttribute('aria-level', '2');
  });

  it('renders label text', () => {
    render(
      <AssessmentRow
        assessment={null}
        label="Course Exam"
        level={1}
        indentClass=""
      />,
    );
    expect(screen.getByText('Course Exam')).toBeInTheDocument();
  });

  it('renders "auto" badge', () => {
    render(
      <AssessmentRow
        assessment={null}
        label="Lesson Quiz"
        level={3}
        indentClass=""
      />,
    );
    expect(screen.getByText('auto')).toBeInTheDocument();
  });

  it('shows question count text when assessment is present with 1 question', () => {
    const singleQ: BuilderAssessment = { id: 'a2', type: 'lesson_quiz', questionCount: 1 };
    render(
      <AssessmentRow
        assessment={singleQ}
        label="Lesson Quiz"
        level={3}
        indentClass=""
      />,
    );
    expect(screen.getByText('1 question')).toBeInTheDocument();
  });

  it('shows plural question count when assessment has multiple questions', () => {
    render(
      <AssessmentRow
        assessment={mockAssessment}
        label="Lesson Quiz"
        level={3}
        indentClass=""
      />,
    );
    expect(screen.getByText('5 questions')).toBeInTheDocument();
  });

  it('does not render question count when assessment is null', () => {
    render(
      <AssessmentRow
        assessment={null}
        label="Lesson Quiz"
        level={3}
        indentClass=""
      />,
    );
    expect(screen.queryByText(/question/)).not.toBeInTheDocument();
  });
});
