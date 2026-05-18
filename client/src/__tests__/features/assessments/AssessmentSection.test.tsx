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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AssessmentSection from '../../../features/assessments/AssessmentSection.js';

const mockApi = {
  get: vi.fn().mockResolvedValue(null),
  create: vi.fn(),
  update: vi.fn(),
  submitAttempt: vi.fn(),
  getAttempts: vi.fn().mockResolvedValue({ data: [] }),
};

describe('AssessmentSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.get.mockResolvedValue(null);
    mockApi.getAttempts.mockResolvedValue({ data: [] });
    apiClientMock.get.mockResolvedValue(null);
  });

  it('renders without crashing in inline mode (no assessment)', async () => {
    render(
      <AssessmentSection
        parentId="l1"
        api={mockApi}
        label="Lesson Quiz"
        createLabel="Create Quiz"
        takeLabel="Take Quiz"
        retakeLabel="Retake Quiz"
        modalTitle="Quiz"
        resultsTitle="Results"
        displayMode="inline"
        canEdit={false}
      />,
    );
    expect(await screen.findByText('Lesson Quiz')).toBeInTheDocument();
  });

  it('shows create button for teacher when no assessment', async () => {
    render(
      <AssessmentSection
        parentId="l1"
        api={mockApi}
        label="Lesson Quiz"
        createLabel="Create Quiz"
        takeLabel="Take Quiz"
        retakeLabel="Retake Quiz"
        modalTitle="Quiz"
        resultsTitle="Results"
        displayMode="inline"
        canEdit={true}
      />,
    );
    expect(await screen.findByRole('button', { name: /create quiz/i })).toBeInTheDocument();
  });

  it('renders nothing in modal-only mode when not open and idle', () => {
    const { container } = render(
      <AssessmentSection
        parentId="l1"
        api={mockApi}
        label="Lesson Quiz"
        createLabel="Create Quiz"
        takeLabel="Take Quiz"
        retakeLabel="Retake Quiz"
        modalTitle="Quiz"
        resultsTitle="Results"
        displayMode="modal-only"
        open={false}
        onClose={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });
});
