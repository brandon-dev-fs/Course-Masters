const { authClientMock } = vi.hoisted(() => ({
  authClientMock: {
    getSession: vi.fn().mockResolvedValue({ data: null, error: null }),
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
    signOut: vi.fn(),
  },
}));
const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../../api/auth.js', () => ({ authClient: authClientMock }));
vi.mock('../../../api/client.js', () => ({ apiClient: apiClientMock, ApiClientError: class ApiClientError extends Error {}, classifyError: (e: unknown) => String(e) }));

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../setup/renderWithProviders.js';
import HomePage from '../../../features/home/HomePage.js';

const TEACHER = { id: 'u1', name: 'T', email: 't@t.com', role: 'teacher', emailVerified: true };
const STUDENT = { id: 'u2', name: 'S', email: 's@s.com', role: 'student', emailVerified: true };

const SAMPLE_COURSES = [
  { id: 'c1', title: 'Algebra Essentials', description: 'Learn algebra.', _count: { units: 2 } },
  { id: 'c2', title: 'English Grammar Fundamentals', description: 'Learn grammar.', _count: { units: 3 } },
];

function sessionFor(user: typeof TEACHER) {
  return { data: { user, session: {} }, error: null };
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClientMock.get.mockResolvedValue([]);
  });

  // --- Guest view ---

  it('renders without crashing when no user (guest view)', async () => {
    authClientMock.getSession.mockResolvedValue({ data: null, error: null });
    renderWithProviders(<HomePage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('shows HowItWorksSection for guest users', async () => {
    authClientMock.getSession.mockResolvedValue({ data: null, error: null });
    renderWithProviders(<HomePage />);
    expect(await screen.findByText('How it works')).toBeInTheDocument();
  });

  it('does not show HowItWorksSection for logged-in users', async () => {
    authClientMock.getSession.mockResolvedValue(sessionFor(TEACHER));
    renderWithProviders(<HomePage />);
    await screen.findByText('My Courses');
    expect(screen.queryByText('How it works')).not.toBeInTheDocument();
  });

  // --- Authenticated views ---

  it('renders course list heading when logged in as teacher', async () => {
    authClientMock.getSession.mockResolvedValue(sessionFor(TEACHER));
    renderWithProviders(<HomePage />);
    expect(await screen.findByText('My Courses')).toBeInTheDocument();
  });

  it('shows New Course button for teacher', async () => {
    authClientMock.getSession.mockResolvedValue(sessionFor(TEACHER));
    renderWithProviders(<HomePage />);
    // Multiple "+ New Course" buttons may be present (header + empty state action)
    const buttons = await screen.findAllByText('+ New Course');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('does not show New Course button for student', async () => {
    authClientMock.getSession.mockResolvedValue(sessionFor(STUDENT));
    renderWithProviders(<HomePage />);
    await screen.findByText('My Courses');
    expect(screen.queryAllByText('+ New Course')).toHaveLength(0);
  });

  // --- Empty states ---

  it('shows teacher empty state message when no courses exist', async () => {
    authClientMock.getSession.mockResolvedValue(sessionFor(TEACHER));
    renderWithProviders(<HomePage />);
    expect(await screen.findByText('Create your first course to get started.')).toBeInTheDocument();
  });

  it('shows student empty state message when no courses exist', async () => {
    authClientMock.getSession.mockResolvedValue(sessionFor(STUDENT));
    renderWithProviders(<HomePage />);
    expect(await screen.findByText('No courses are available yet.')).toBeInTheDocument();
  });

  // --- Course grid with filters ---

  it('renders course cards when courses exist', async () => {
    authClientMock.getSession.mockResolvedValue(sessionFor(TEACHER));
    apiClientMock.get.mockResolvedValue(SAMPLE_COURSES);
    renderWithProviders(<HomePage />);
    expect(await screen.findByText('Algebra Essentials')).toBeInTheDocument();
    expect(screen.getByText('English Grammar Fundamentals')).toBeInTheDocument();
  });

  it('shows CourseFilters bar when courses exist', async () => {
    authClientMock.getSession.mockResolvedValue(sessionFor(TEACHER));
    apiClientMock.get.mockResolvedValue(SAMPLE_COURSES);
    renderWithProviders(<HomePage />);
    await screen.findByText('Algebra Essentials');
    expect(screen.getByRole('textbox', { name: /search courses/i })).toBeInTheDocument();
  });

  it('filters courses by search query', async () => {
    authClientMock.getSession.mockResolvedValue(sessionFor(TEACHER));
    apiClientMock.get.mockResolvedValue(SAMPLE_COURSES);
    renderWithProviders(<HomePage />);
    await screen.findByText('Algebra Essentials');
    fireEvent.change(screen.getByRole('textbox', { name: /search courses/i }), {
      target: { value: 'Algebra' },
    });
    await waitFor(() => {
      expect(screen.getByText('Algebra Essentials')).toBeInTheDocument();
      expect(screen.queryByText('English Grammar Fundamentals')).not.toBeInTheDocument();
    });
  });

  it('shows filtered empty state when no courses match filters', async () => {
    authClientMock.getSession.mockResolvedValue(sessionFor(TEACHER));
    apiClientMock.get.mockResolvedValue(SAMPLE_COURSES);
    renderWithProviders(<HomePage />);
    await screen.findByText('Algebra Essentials');
    fireEvent.change(screen.getByRole('textbox', { name: /search courses/i }), {
      target: { value: 'zzznomatch' },
    });
    await waitFor(() => {
      expect(screen.getByText('No courses match your filters')).toBeInTheDocument();
    });
  });

  // --- Error state ---

  it('shows error message when course fetch fails', async () => {
    authClientMock.getSession.mockResolvedValue(sessionFor(TEACHER));
    apiClientMock.get.mockRejectedValue(new Error('Network error'));
    renderWithProviders(<HomePage />);
    expect(await screen.findByText('Network error')).toBeInTheDocument();
  });
});
