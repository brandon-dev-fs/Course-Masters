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

const { useAssessmentMock } = vi.hoisted(() => ({
  useAssessmentMock: vi.fn(),
}));
vi.mock('../../../hooks/useAssessment.js', () => ({
  default: (...args: unknown[]) => useAssessmentMock(...args),
}));

vi.mock('../../../features/assessments/AssessmentForm.js', () => ({
  default: () => <div data-testid="assessment-form" />,
  toQuestionDraft: (q: unknown) => q,
}));
vi.mock('../../../features/assessments/AssessmentTaker.js', () => ({
  default: () => <div data-testid="assessment-taker" />,
}));
vi.mock('../../../features/assessments/AssessmentResults.js', () => ({
  default: () => <div data-testid="assessment-results" />,
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExamCard from '../../../features/exams/ExamCard.js';

const mockExam = {
  id: 'exam-1',
  questions: [
    { id: 'q1', type: 'multiple_choice', order: 1, content: { question: 'Q1', choices: [], correctIndex: 0 } },
    { id: 'q2', type: 'true_false', order: 2, content: { question: 'Q2', correct: true } },
  ],
};

function makeAssessmentHook(overrides = {}) {
  return {
    assessment: null,
    loading: false,
    error: '',
    view: 'idle' as string,
    setView: vi.fn(),
    result: null,
    lastAttempt: null,
    handleCreate: vi.fn(),
    handleUpdate: vi.fn(),
    handleSubmit: vi.fn(),
    ...overrides,
  };
}

describe('ExamCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAssessmentMock.mockReturnValue(makeAssessmentHook());
  });

  it('renders without crashing', () => {
    render(
      <ExamCard courseId="c1" allUnitsMastered={false} progress={null} canEdit={false} />,
    );
    expect(screen.getByText('Final Exam')).toBeInTheDocument();
  });

  it('shows locked message when units not mastered and not editor', () => {
    render(
      <ExamCard courseId="c1" allUnitsMastered={false} progress={null} canEdit={false} />,
    );
    expect(screen.getByText(/complete all units to unlock/i)).toBeInTheDocument();
  });

  it('shows create exam button for teacher when unlocked and no exam', () => {
    render(
      <ExamCard courseId="c1" allUnitsMastered={true} progress={null} canEdit={true} />,
    );
    expect(screen.getByRole('button', { name: /create exam/i })).toBeInTheDocument();
  });

  it('shows no exam message for students when unlocked but no exam', () => {
    render(
      <ExamCard courseId="c1" allUnitsMastered={true} progress={null} canEdit={false} />,
    );
    expect(screen.getByText(/exam not yet available/i)).toBeInTheDocument();
  });

  it('shows question count when exam exists', () => {
    useAssessmentMock.mockReturnValue(makeAssessmentHook({ assessment: mockExam }));
    render(
      <ExamCard courseId="c1" allUnitsMastered={false} progress={null} canEdit={true} />,
    );
    expect(screen.getByText('2 questions')).toBeInTheDocument();
  });

  it('shows singular question label for 1 question', () => {
    const singleQuestionExam = { ...mockExam, questions: [mockExam.questions[0]] };
    useAssessmentMock.mockReturnValue(makeAssessmentHook({ assessment: singleQuestionExam }));
    render(
      <ExamCard courseId="c1" allUnitsMastered={false} progress={null} canEdit={true} />,
    );
    expect(screen.getByText('1 question')).toBeInTheDocument();
  });

  it('shows Edit button for teacher when exam exists', () => {
    useAssessmentMock.mockReturnValue(makeAssessmentHook({ assessment: mockExam }));
    render(
      <ExamCard courseId="c1" allUnitsMastered={true} progress={null} canEdit={true} />,
    );
    expect(screen.getByRole('button', { name: /^edit$/i })).toBeInTheDocument();
  });

  it('shows Take Exam button when allUnitsMastered and exam exists', () => {
    useAssessmentMock.mockReturnValue(makeAssessmentHook({ assessment: mockExam }));
    render(
      <ExamCard courseId="c1" allUnitsMastered={true} progress={null} canEdit={false} />,
    );
    expect(screen.getByRole('button', { name: /take exam/i })).toBeInTheDocument();
  });

  it('shows Retake button when lastAttempt exists', () => {
    useAssessmentMock.mockReturnValue(
      makeAssessmentHook({ assessment: mockExam, lastAttempt: { passed: false, score: 0.5 } }),
    );
    render(
      <ExamCard courseId="c1" allUnitsMastered={true} progress={null} canEdit={false} />,
    );
    expect(screen.getByRole('button', { name: /retake/i })).toBeInTheDocument();
  });

  it('displays score percentage for lastAttempt', () => {
    useAssessmentMock.mockReturnValue(
      makeAssessmentHook({ assessment: mockExam, lastAttempt: { passed: true, score: 0.85 } }),
    );
    render(
      <ExamCard courseId="c1" allUnitsMastered={true} progress={null} canEdit={false} />,
    );
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('calls setView with creating when Create Exam is clicked', () => {
    const setView = vi.fn();
    useAssessmentMock.mockReturnValue(makeAssessmentHook({ setView }));
    render(
      <ExamCard courseId="c1" allUnitsMastered={true} progress={null} canEdit={true} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /create exam/i }));
    expect(setView).toHaveBeenCalledWith('creating');
  });

  it('calls setView with taking when Take Exam is clicked', () => {
    const setView = vi.fn();
    useAssessmentMock.mockReturnValue(makeAssessmentHook({ assessment: mockExam, setView }));
    render(
      <ExamCard courseId="c1" allUnitsMastered={true} progress={null} canEdit={false} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /take exam/i }));
    expect(setView).toHaveBeenCalledWith('taking');
  });

  it('calls setView with creating when Edit is clicked (openEdit)', () => {
    const setView = vi.fn();
    useAssessmentMock.mockReturnValue(makeAssessmentHook({ assessment: mockExam, setView }));
    render(
      <ExamCard courseId="c1" allUnitsMastered={true} progress={null} canEdit={true} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /^edit$/i }));
    expect(setView).toHaveBeenCalledWith('creating');
  });

  it('renders assessment form modal when view is creating', () => {
    useAssessmentMock.mockReturnValue(makeAssessmentHook({ view: 'creating' }));
    render(
      <ExamCard courseId="c1" allUnitsMastered={true} progress={null} canEdit={true} />,
    );
    expect(screen.getByTestId('assessment-form')).toBeInTheDocument();
  });

  it('renders assessment taker modal when view is taking and exam exists', () => {
    useAssessmentMock.mockReturnValue(makeAssessmentHook({ assessment: mockExam, view: 'taking' }));
    render(
      <ExamCard courseId="c1" allUnitsMastered={true} progress={null} canEdit={false} />,
    );
    expect(screen.getByTestId('assessment-taker')).toBeInTheDocument();
  });

  it('renders assessment results when view is results and result exists', () => {
    useAssessmentMock.mockReturnValue(
      makeAssessmentHook({ view: 'results', result: { score: 0.9, passed: true, breakdown: [] } }),
    );
    render(
      <ExamCard courseId="c1" allUnitsMastered={true} progress={null} canEdit={false} />,
    );
    expect(screen.getByTestId('assessment-results')).toBeInTheDocument();
  });

  it('calls setView idle when creating modal is closed (closeModal)', () => {
    const setView = vi.fn();
    useAssessmentMock.mockReturnValue(makeAssessmentHook({ view: 'creating', setView }));
    render(<ExamCard courseId="c1" allUnitsMastered={true} progress={null} canEdit={true} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(setView).toHaveBeenCalledWith('idle');
  });

  it('calls setView idle when taking modal is closed via onClose arrow', () => {
    const setView = vi.fn();
    useAssessmentMock.mockReturnValue(makeAssessmentHook({ assessment: mockExam, view: 'taking', setView }));
    render(<ExamCard courseId="c1" allUnitsMastered={true} progress={null} canEdit={false} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(setView).toHaveBeenCalledWith('idle');
  });

  it('calls setView idle when results modal is closed via onClose arrow', () => {
    const setView = vi.fn();
    useAssessmentMock.mockReturnValue(
      makeAssessmentHook({ view: 'results', result: { score: 0.9, passed: true, breakdown: [] }, setView }),
    );
    render(<ExamCard courseId="c1" allUnitsMastered={true} progress={null} canEdit={false} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(setView).toHaveBeenCalledWith('idle');
  });
});
