const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock('../../../api/client.js', () => ({
  apiClient: apiClientMock,
  ApiClientError: class ApiClientError extends Error {},
  classifyError: (e: unknown) => String(e),
}));
vi.mock('../../../hooks/useAssessment.js', () => ({
  default: () => ({
    assessment: null,
    loading: false,
    error: '',
    view: 'idle',
    setView: vi.fn(),
    result: null,
    lastAttempt: null,
    handleCreate: vi.fn(),
    handleUpdate: vi.fn(),
    handleSubmit: vi.fn(),
  }),
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ExamCard from '../../../features/exams/ExamCard.js';

describe('ExamCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <ExamCard
        courseId="c1"
        allUnitsMastered={false}
        progress={null}
        canEdit={false}
      />,
    );
    expect(screen.getByText('Final Exam')).toBeInTheDocument();
  });

  it('shows locked message when units not mastered and not editor', () => {
    render(
      <ExamCard
        courseId="c1"
        allUnitsMastered={false}
        progress={null}
        canEdit={false}
      />,
    );
    expect(screen.getByText(/complete all units to unlock/i)).toBeInTheDocument();
  });

  it('shows create exam button for teacher when unlocked', () => {
    render(
      <ExamCard
        courseId="c1"
        allUnitsMastered={true}
        progress={null}
        canEdit={true}
      />,
    );
    expect(screen.getByRole('button', { name: /create exam/i })).toBeInTheDocument();
  });

  it('shows no exam message for students when unlocked but no exam', () => {
    render(
      <ExamCard
        courseId="c1"
        allUnitsMastered={true}
        progress={null}
        canEdit={false}
      />,
    );
    expect(screen.getByText(/exam not yet available/i)).toBeInTheDocument();
  });
});
