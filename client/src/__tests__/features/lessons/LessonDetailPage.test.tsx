const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../../api/client.js', () => ({
  apiClient: apiClientMock,
  ApiClientError: class ApiClientError extends Error {},
  classifyError: (e: unknown) => String(e),
}));

const { authClientMock } = vi.hoisted(() => ({
  authClientMock: {
    getSession: vi.fn(),
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
    signOut: vi.fn(),
  },
}));
vi.mock('../../../api/auth.js', () => ({ authClient: authClientMock }));

import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../../context/AuthContext.js';
import LessonDetailPage from '../../../features/lessons/LessonDetailPage.js';
import { makeTeacherUser, makeStudentUser } from '../../mocks/authContext.mock.js';
import type { Lesson, Unit, UnitProgress } from '../../../api/types.js';

// ─── Mock fixtures ────────────────────────────────────────────────────────────

const mockLesson: Lesson = {
  id: 'l1',
  title: 'Introduction to React',
  description: 'Learn the fundamentals of React.',
  unitId: 'u1',
  order: 1,
  objective: 'Understand React components and JSX.',
  planContent: {},
};

const mockUnit: Unit = {
  id: 'u1',
  title: 'Unit 1: Basics',
  description: 'Foundational concepts',
  order: 1,
  courseId: 'c1',
};

const mockCourse = {
  id: 'c1',
  title: 'React Fundamentals',
  description: 'A course about React',
  authorId: 'user-2',
};

const mockUnitProgress: UnitProgress = {
  totalLessons: 3,
  completedLessons: 0,
  testPassed: false,
  percentComplete: 0,
  lessons: [
    { lessonId: 'l1', hasQuiz: false, attempted: false, quizPassed: false },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Sets up 6 sequential GET mock responses for a full LessonDetailPage load:
 *   1. lessonsApi.getOne  (the lesson itself)
 *   2. unitsApi.getAll    (all units in the course)
 *   3. coursesApi.getOne  (course metadata for the title)
 *   4. lessonsApi.getAll  (sibling lessons in the unit)
 *   5. progressApi.getUnit (unit progress data)
 *   6. assignmentsApi.getAll (lesson assignments, always empty in these tests)
 */
function setupSuccessfulLoad() {
  apiClientMock.get
    .mockResolvedValueOnce(mockLesson)
    .mockResolvedValueOnce([mockUnit])
    .mockResolvedValueOnce(mockCourse)
    .mockResolvedValueOnce([mockLesson])
    .mockResolvedValueOnce(mockUnitProgress)
    .mockResolvedValueOnce([]);
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/courses/c1/units/u1/lessons/l1']}>
      <AuthProvider>
        <Routes>
          <Route
            path="/courses/:courseId/units/:unitId/lessons/:lessonId"
            element={<LessonDetailPage />}
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('LessonDetailPage', () => {
  beforeEach(() => {
    // Reset clears both call history AND mock implementations, preventing
    // resolved-value queues from leaking between tests.
    vi.resetAllMocks();
    authClientMock.getSession.mockResolvedValue({ data: null, error: null });
  });

  it('shows loading indicator while data is fetching', () => {
    apiClientMock.get.mockImplementation(() => new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('shows error message when fetch fails', async () => {
    apiClientMock.get.mockRejectedValue(new Error('Network error'));
    renderPage();
    await screen.findByText('Failed to load');
  });

  it('renders lesson title after data loads', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeStudentUser() }, error: null });
    setupSuccessfulLoad();
    renderPage();
    // Title appears in the sr-only h1 and the mobile h1 — use findAll
    const titles = await screen.findAllByText('Introduction to React');
    expect(titles.length).toBeGreaterThan(0);
  });

  it('shows teacher preview banner for teachers', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    setupSuccessfulLoad();
    renderPage();
    expect(await screen.findByText(/teacher preview/i)).toBeInTheDocument();
  });

  it('does not show teacher preview banner for students', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeStudentUser() }, error: null });
    setupSuccessfulLoad();
    renderPage();
    await screen.findAllByText('Introduction to React');
    expect(screen.queryByText(/teacher preview/i)).not.toBeInTheDocument();
  });

  it('shows "Back to Builder" link for teachers', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    setupSuccessfulLoad();
    renderPage();
    expect(await screen.findByRole('link', { name: /back to builder/i })).toBeInTheDocument();
  });

  it('does not show "Back to Builder" link for students', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeStudentUser() }, error: null });
    setupSuccessfulLoad();
    renderPage();
    await screen.findAllByText('Introduction to React');
    expect(screen.queryByRole('link', { name: /back to builder/i })).not.toBeInTheDocument();
  });

  it('renders a back navigation link for the course when data is loaded', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeStudentUser() }, error: null });
    setupSuccessfulLoad();
    renderPage();
    await screen.findAllByText('Introduction to React');
    // Back link shows the unit title; aria-label is "Back to Unit 1: Basics"
    const backLinks = screen.getAllByRole('link', { name: /back to/i });
    expect(backLinks.length).toBeGreaterThan(0);
  });

  it('shows lesson settings button for teachers', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    setupSuccessfulLoad();
    renderPage();
    const settingsButtons = await screen.findAllByRole('button', { name: /lesson settings/i });
    expect(settingsButtons.length).toBeGreaterThan(0);
  });

  it('does not show lesson settings button for students', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeStudentUser() }, error: null });
    setupSuccessfulLoad();
    renderPage();
    await screen.findAllByText('Introduction to React');
    expect(screen.queryByRole('button', { name: /lesson settings/i })).not.toBeInTheDocument();
  });

  it('renders the unit title in the sidebar after data loads', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeStudentUser() }, error: null });
    setupSuccessfulLoad();
    renderPage();
    const unitTitles = await screen.findAllByText('Unit 1: Basics');
    expect(unitTitles.length).toBeGreaterThan(0);
  });

  it('renders the course title as a navigation link after data loads', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeStudentUser() }, error: null });
    setupSuccessfulLoad();
    renderPage();
    await screen.findAllByText('Introduction to React');
    expect(screen.getByText('React Fundamentals')).toBeInTheDocument();
  });

  it('renders a mobile hamburger button for opening the drawer', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeStudentUser() }, error: null });
    setupSuccessfulLoad();
    renderPage();
    await screen.findAllByText('Introduction to React');
    const hamburgers = screen.getAllByRole('button', { name: /open lesson navigation/i });
    expect(hamburgers.length).toBeGreaterThan(0);
  });
});
