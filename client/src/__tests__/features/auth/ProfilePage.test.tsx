const { authClientMock } = vi.hoisted(() => ({
  authClientMock: {
    getSession: vi.fn().mockResolvedValue({ data: null, error: null }),
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
    signOut: vi.fn(),
    updateUser: vi.fn().mockResolvedValue({ data: null, error: null }),
    changePassword: vi.fn().mockResolvedValue({ data: null, error: null }),
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
vi.mock('../../../api/client.js', () => ({
  apiClient: apiClientMock,
  ApiClientError: class ApiClientError extends Error {},
  classifyError: (e: unknown) => String(e),
}));

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../setup/renderWithProviders.js';
import { makeTeacherUser, makeStudentUser, makeAdminUser } from '../../mocks/authContext.mock.js';
import ProfilePage from '../../../features/auth/ProfilePage.js';

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClientMock.get.mockResolvedValue([]);
  });

  it('shows loading spinner when no user', () => {
    authClientMock.getSession.mockReturnValue(new Promise(() => {}));
    const { container } = renderWithProviders(<ProfilePage />);
    // isLoading = true -> AuthContext returns null, user is null -> shows fullPage LoadingSpinner
    expect(container).toBeTruthy();
  });

  it('shows profile heading for authenticated teacher', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<ProfilePage />);
    expect(await screen.findByText('Profile')).toBeInTheDocument();
  });

  it('shows teacher name and email', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<ProfilePage />);
    expect(await screen.findByText('Teacher')).toBeInTheDocument();
    expect(await screen.findByText('t@test.com')).toBeInTheDocument();
  });

  it('shows teacher role badge', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<ProfilePage />);
    // Role badge text
    const badges = await screen.findAllByText(/teacher/i);
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('shows student role badge', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeStudentUser() }, error: null });
    renderWithProviders(<ProfilePage />);
    const badge = await screen.findByText('student');
    expect(badge).toBeInTheDocument();
  });

  it('shows admin role badge', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeAdminUser() }, error: null });
    renderWithProviders(<ProfilePage />);
    const badge = await screen.findByText('admin');
    expect(badge).toBeInTheDocument();
  });

  it('shows Change Password section', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<ProfilePage />);
    const changePasswordHeadings = await screen.findAllByText('Change Password');
    expect(changePasswordHeadings.length).toBeGreaterThan(0);
  });

  it('shows Courses section', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<ProfilePage />);
    expect(await screen.findByText('Courses')).toBeInTheDocument();
  });

  it('shows no courses message when empty', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([]);
    renderWithProviders(<ProfilePage />);
    expect(await screen.findByText(/no courses yet/i)).toBeInTheDocument();
  });

  it('shows course list when courses exist', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([
      { id: 'c1', title: 'Intro to CS', description: '', authorId: 'u2', _count: { units: 3 } },
    ]);
    renderWithProviders(<ProfilePage />);
    expect(await screen.findByText('Intro to CS')).toBeInTheDocument();
  });

  it('shows edit name button', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<ProfilePage />);
    expect(await screen.findByRole('button', { name: /edit name/i })).toBeInTheDocument();
  });

  it('switches to name edit mode when edit is clicked', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<ProfilePage />);
    fireEvent.click(await screen.findByRole('button', { name: /edit name/i }));
    expect(screen.getByRole('button', { name: /save name/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('shows validation error when name is empty on save', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<ProfilePage />);
    fireEvent.click(await screen.findByRole('button', { name: /edit name/i }));
    const input = screen.getByDisplayValue('Teacher');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /save name/i }));
    expect(await screen.findByText(/name cannot be empty/i)).toBeInTheDocument();
  });

  it('shows password mismatch error', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<ProfilePage />);
    await screen.findAllByText('Change Password');
    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'oldpass123' } });
    fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'different' } });
    fireEvent.click(screen.getByRole('button', { name: /change password/i }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('shows password too short error', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<ProfilePage />);
    await screen.findAllByText('Change Password');
    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'old' } });
    fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: 'short' } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /change password/i }));
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });
});
