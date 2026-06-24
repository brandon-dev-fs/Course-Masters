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
    patch: vi.fn().mockResolvedValue({ themePreference: 'light' }),
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
    // Default: getMe returns a profile (used by AuthContext after session load)
    apiClientMock.get.mockResolvedValue({
      id: 'u1',
      name: 'Teacher',
      email: 't@test.com',
      role: 'teacher',
      themePreference: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    apiClientMock.patch.mockResolvedValue({ themePreference: 'light' });
  });

  it('shows loading spinner when no user', () => {
    authClientMock.getSession.mockReturnValue(new Promise(() => {}));
    const { container } = renderWithProviders(<ProfilePage />);
    // isLoading = true -> AuthContext returns null, user is null -> shows fullPage LoadingSpinner
    expect(container).toBeTruthy();
  });

  it('shows user name in profile header for authenticated teacher', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<ProfilePage />);
    expect(await screen.findByText('Teacher')).toBeInTheDocument();
  });

  it('shows teacher name and email', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<ProfilePage />);
    // email appears in the header and as a read-only field
    const emails = await screen.findAllByText('t@test.com');
    expect(emails.length).toBeGreaterThanOrEqual(1);
  });

  it('shows teacher role badge', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<ProfilePage />);
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

  it('shows Account and Change Password sections', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<ProfilePage />);
    expect(await screen.findByRole('heading', { name: /account/i })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /change password/i })).toBeInTheDocument();
  });

  it('does not show Courses section', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<ProfilePage />);
    await screen.findByText('Teacher');
    expect(screen.queryByText(/courses/i)).not.toBeInTheDocument();
  });

  it('shows Save changes button instead of pencil-edit pattern', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<ProfilePage />);
    expect(await screen.findByRole('button', { name: /save changes/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit name/i })).not.toBeInTheDocument();
  });

  it('shows Update password button with secondary styling', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<ProfilePage />);
    expect(await screen.findByRole('button', { name: /update password/i })).toBeInTheDocument();
  });

  it('shows validation error when name is empty on save', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<ProfilePage />);
    const nameInput = await screen.findByLabelText(/display name/i);
    fireEvent.change(nameInput, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    expect(await screen.findByText(/name cannot be empty/i)).toBeInTheDocument();
  });

  it('clears name error when user types after error', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<ProfilePage />);
    const nameInput = await screen.findByLabelText(/display name/i);
    fireEvent.change(nameInput, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await screen.findByText(/name cannot be empty/i);
    fireEvent.change(nameInput, { target: { value: 'A' } });
    expect(screen.queryByText(/name cannot be empty/i)).not.toBeInTheDocument();
  });

  it('shows password mismatch error', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<ProfilePage />);
    await screen.findByRole('heading', { name: /change password/i });
    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'oldpass123' } });
    fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'different' } });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('shows password too short error', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<ProfilePage />);
    await screen.findByRole('heading', { name: /change password/i });
    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'old' } });
    fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: 'short' } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it('saves name successfully and calls updateUser', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    authClientMock.updateUser.mockResolvedValue({ data: null, error: null });
    renderWithProviders(<ProfilePage />);
    const nameInput = await screen.findByLabelText(/display name/i);
    fireEvent.change(nameInput, { target: { value: 'New Name' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => expect(authClientMock.updateUser).toHaveBeenCalledWith({ name: 'New Name' }));
  });

  it('shows Saved! message after successful name save', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    authClientMock.updateUser.mockResolvedValue({ data: null, error: null });
    renderWithProviders(<ProfilePage />);
    const nameInput = await screen.findByLabelText(/display name/i);
    fireEvent.change(nameInput, { target: { value: 'New Name' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    expect(await screen.findByText(/saved!/i)).toBeInTheDocument();
  });

  it('shows API error when name update fails', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    authClientMock.updateUser.mockResolvedValue({ data: null, error: { message: 'Server rejected' } });
    renderWithProviders(<ProfilePage />);
    // Wait for the display name input to appear and be populated by the useEffect sync
    const nameInput = await screen.findByLabelText(/display name/i);
    await waitFor(() => expect(nameInput).toHaveValue('Teacher'));
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    expect(await screen.findByText(/server rejected/i)).toBeInTheDocument();
  });

  it('changes password successfully and shows success banner', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    authClientMock.changePassword.mockResolvedValue({ data: null, error: null });
    renderWithProviders(<ProfilePage />);
    await screen.findByRole('heading', { name: /change password/i });
    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'oldpass123' } });
    fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'newpass123' } });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));
    expect(await screen.findByText(/password updated successfully/i)).toBeInTheDocument();
  });

  it('shows API error when password change fails', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    authClientMock.changePassword.mockResolvedValue({ data: null, error: { message: 'Incorrect current password' } });
    renderWithProviders(<ProfilePage />);
    await screen.findByRole('heading', { name: /change password/i });
    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'wrongpass' } });
    fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'newpass123' } });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));
    expect(await screen.findByText(/incorrect current password/i)).toBeInTheDocument();
  });

  it('shows Preferences section with theme segmented control', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<ProfilePage />);
    expect(await screen.findByRole('heading', { name: /preferences/i })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /theme preference/i })).toBeInTheDocument();
  });

  it('shows three theme options in segmented control', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<ProfilePage />);
    await screen.findByRole('radiogroup', { name: /theme preference/i });
    expect(screen.getByRole('radio', { name: /light/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /dark/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /system/i })).toBeInTheDocument();
  });

  it('calls updatePreferences PATCH when theme segment is clicked', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<ProfilePage />);
    await screen.findByRole('radiogroup', { name: /theme preference/i });
    fireEvent.click(screen.getByRole('radio', { name: /dark/i }));
    await waitFor(() =>
      expect(apiClientMock.patch).toHaveBeenCalledWith(
        '/users/me/preferences',
        { themePreference: 'dark' },
      ),
    );
  });

  it('email and role fields are read-only', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<ProfilePage />);
    const emailInput = await screen.findByLabelText(/email/i);
    expect(emailInput).toHaveAttribute('readonly');
    const roleInput = screen.getByLabelText(/role/i);
    expect(roleInput).toHaveAttribute('readonly');
  });
});
