// Subcomponents and hook mocked before any imports to avoid real API calls.
vi.mock('../../../features/builder/hooks/useBuilderOutline.js', () => ({
  useBuilderOutline: vi.fn(),
}));
vi.mock('../../../features/builder/OutlineTree.js', () => ({
  default: () => <div data-testid="outline-tree" />,
}));
vi.mock('../../../features/builder/BuilderTopBar.js', () => ({
  default: () => <div data-testid="builder-top-bar" />,
}));
vi.mock('../../../features/builder/BuilderSidebar.js', () => ({
  default: () => <div data-testid="builder-sidebar" />,
}));
vi.mock('../../../features/builder/ScreenReaderAnnouncer.js', () => ({
  default: () => null,
}));
vi.mock('../../../features/assignments/AssignmentFormModal.js', () => ({
  default: () => null,
}));
vi.mock('../../../features/courses/CourseForm.js', () => ({
  default: ({ onCancel }: { onCancel: () => void }) => (
    <div data-testid="course-form">
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));
vi.mock('../../../features/assessments/AssessmentSection.js', () => ({
  default: () => null,
}));
vi.mock('../../../components/RichTextEditor.js', () => ({
  default: () => null,
}));
vi.mock('../../../features/lessons/LessonPlanModal.js', () => ({
  default: () => null,
}));

const { authClientMock } = vi.hoisted(() => ({
  authClientMock: {
    getSession: vi.fn().mockResolvedValue({ data: null, error: null }),
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
    signOut: vi.fn(),
  },
}));
vi.mock('../../../api/auth.js', () => ({ authClient: authClientMock }));
vi.mock('../../../api/client.js', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  ApiClientError: class ApiClientError extends Error {},
  classifyError: (e: unknown) => String(e),
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../../context/AuthContext.js';
import CourseBuilderPage from '../../../features/builder/CourseBuilderPage.js';
import { useBuilderOutline } from '../../../features/builder/hooks/useBuilderOutline.js';

const mockUseBuilderOutline = vi.mocked(useBuilderOutline);

const mockOutlineFns = {
  setOutline: vi.fn(),
  addUnit: vi.fn().mockResolvedValue(undefined),
  editUnit: vi.fn().mockResolvedValue(undefined),
  addLesson: vi.fn().mockResolvedValue(undefined),
  addActivity: vi.fn().mockResolvedValue(undefined),
  renameUnit: vi.fn().mockResolvedValue(undefined),
  renameLesson: vi.fn().mockResolvedValue(undefined),
  deleteUnit: vi.fn().mockResolvedValue(undefined),
  deleteLesson: vi.fn().mockResolvedValue(undefined),
  deleteActivity: vi.fn().mockResolvedValue(undefined),
  reorderUnits: vi.fn().mockResolvedValue(undefined),
  reorderLessons: vi.fn().mockResolvedValue(undefined),
  reorderActivities: vi.fn().mockResolvedValue(undefined),
  reload: vi.fn(),
};

const mockOutline = {
  course: { id: 'c1', title: 'My Test Course', description: 'A great course' },
  units: [],
  courseAssessment: null,
};

function renderBuilder() {
  return render(
    <MemoryRouter initialEntries={['/courses/c1/builder']}>
      <AuthProvider>
        <Routes>
          <Route path="/courses/:courseId/builder" element={<CourseBuilderPage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('CourseBuilderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authClientMock.getSession.mockResolvedValue({ data: null, error: null });
  });

  it('shows loading spinner while outline is loading', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseBuilderOutline.mockReturnValue({ loading: true, error: '', outline: null, ...mockOutlineFns } as any);
    renderBuilder();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows error message when outline fails to load', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseBuilderOutline.mockReturnValue({ loading: false, error: 'Failed to fetch', outline: null, ...mockOutlineFns } as any);
    renderBuilder();
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
  });

  it('shows retry button on error', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseBuilderOutline.mockReturnValue({ loading: false, error: 'Oops', outline: null, ...mockOutlineFns } as any);
    renderBuilder();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('renders the course title after outline loads', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseBuilderOutline.mockReturnValue({ loading: false, error: '', outline: mockOutline, ...mockOutlineFns } as any);
    renderBuilder();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('My Test Course');
  });

  it('renders the course description', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseBuilderOutline.mockReturnValue({ loading: false, error: '', outline: mockOutline, ...mockOutlineFns } as any);
    renderBuilder();
    expect(screen.getByText('A great course')).toBeInTheDocument();
  });

  it('renders the edit course button', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseBuilderOutline.mockReturnValue({ loading: false, error: '', outline: mockOutline, ...mockOutlineFns } as any);
    renderBuilder();
    expect(screen.getByRole('button', { name: /edit course details/i })).toBeInTheDocument();
  });

  it('opens edit course modal when Edit button is clicked', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseBuilderOutline.mockReturnValue({ loading: false, error: '', outline: mockOutline, ...mockOutlineFns } as any);
    renderBuilder();
    fireEvent.click(screen.getByRole('button', { name: /edit course details/i }));
    expect(screen.getByTestId('course-form')).toBeInTheDocument();
  });

  it('renders the outline tree', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseBuilderOutline.mockReturnValue({ loading: false, error: '', outline: mockOutline, ...mockOutlineFns } as any);
    renderBuilder();
    expect(screen.getByTestId('outline-tree')).toBeInTheDocument();
  });

  it('shows "No description" when course description is empty', () => {
    const outlineNoDesc = { ...mockOutline, course: { ...mockOutline.course, description: '' } };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseBuilderOutline.mockReturnValue({ loading: false, error: '', outline: outlineNoDesc, ...mockOutlineFns } as any);
    renderBuilder();
    expect(screen.getByText('No description')).toBeInTheDocument();
  });
});
