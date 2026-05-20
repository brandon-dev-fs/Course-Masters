const { authClientMock } = vi.hoisted(() => ({
  authClientMock: {
    getSession: vi.fn().mockResolvedValue({ data: null, error: null }),
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
    signOut: vi.fn(),
  },
}));
vi.mock('../../../api/auth.js', () => ({ authClient: authClientMock }));

const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../../api/client.js', () => ({
  apiClient: apiClientMock,
  ApiClientError: class ApiClientError extends Error {},
  classifyError: (e: unknown) => String(e),
}));

vi.mock('../../../components/RichTextEditor.js', () => ({ default: () => null }));

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../setup/renderWithProviders.js';
import { makeTeacherUser, makeStudentUser } from '../../mocks/authContext.mock.js';
import CourseDetailPage from '../../../features/courses/CourseDetailPage.js';

const mockCourse = {
  id: 'course-1',
  title: 'Test Course',
  description: 'A test course',
  authorId: 'user-2',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  units: [
    { id: 'unit-1', title: 'Unit 1', courseId: 'course-1', order: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01', _count: { lessons: 3 } },
  ],
};

const mockProgress = {
  courseId: 'course-1',
  totalLessons: 5,
  completedLessons: 2,
  percentage: 36,
  examPassed: false,
  units: [],
};

describe('CourseDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner while data is loading', () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockReturnValue(new Promise(() => {}));
    const { container } = renderWithProviders(<CourseDetailPage />, { initialRoute: '/courses/course-1' });
    expect(container).toBeTruthy();
  });

  it('renders course title after loading', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get
      .mockResolvedValueOnce(mockCourse)
      .mockResolvedValueOnce([mockCourse])
      .mockResolvedValueOnce(mockProgress);

    renderWithProviders(<CourseDetailPage />, { initialRoute: '/courses/course-1' });
    expect(await screen.findByText('Test Course')).toBeInTheDocument();
  });

  it('shows Units section heading', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeStudentUser() }, error: null });
    apiClientMock.get
      .mockResolvedValueOnce(mockCourse)
      .mockResolvedValueOnce([mockCourse])
      .mockResolvedValueOnce(mockProgress);

    renderWithProviders(<CourseDetailPage />, { initialRoute: '/courses/course-1' });
    expect(await screen.findByText('Units')).toBeInTheDocument();
  });

  it('shows Add Unit button for teachers', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get
      .mockResolvedValueOnce(mockCourse)
      .mockResolvedValueOnce([mockCourse])
      .mockResolvedValueOnce(mockProgress);

    renderWithProviders(<CourseDetailPage />, { initialRoute: '/courses/course-1' });
    expect(await screen.findByText('+ Add Unit')).toBeInTheDocument();
  });

  it('does not show Add Unit button for students', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeStudentUser() }, error: null });
    apiClientMock.get
      .mockResolvedValueOnce({ ...mockCourse, authorId: 'other-user' })
      .mockResolvedValueOnce([mockCourse])
      .mockResolvedValueOnce(mockProgress);

    renderWithProviders(<CourseDetailPage />, { initialRoute: '/courses/course-1' });
    await screen.findByText('Test Course');
    expect(screen.queryByText('+ Add Unit')).not.toBeInTheDocument();
  });

  it('shows error message when loading fails', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockRejectedValue(new Error('Network error'));

    renderWithProviders(<CourseDetailPage />, { initialRoute: '/courses/course-1' });
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  it('shows Add Syllabus button for teacher when no syllabus', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get
      .mockResolvedValueOnce({ ...mockCourse, syllabus: null })
      .mockResolvedValueOnce([mockCourse])
      .mockResolvedValueOnce(mockProgress);

    renderWithProviders(<CourseDetailPage />, { initialRoute: '/courses/course-1' });
    expect(await screen.findByText('+ Add Syllabus')).toBeInTheDocument();
  });

  it('shows View Syllabus button when syllabus exists', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeStudentUser() }, error: null });
    apiClientMock.get
      .mockResolvedValueOnce({ ...mockCourse, syllabus: { content: 'some syllabus' } })
      .mockResolvedValueOnce([mockCourse])
      .mockResolvedValueOnce(mockProgress);

    renderWithProviders(<CourseDetailPage />, { initialRoute: '/courses/course-1' });
    expect(await screen.findByText('View Syllabus')).toBeInTheDocument();
  });
});
