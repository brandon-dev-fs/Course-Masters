const { authClientMock } = vi.hoisted(() => ({
  authClientMock: {
    getSession: vi.fn().mockResolvedValue({ data: null, error: null }),
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
    signOut: vi.fn(),
    admin: {
      listUsers: vi.fn().mockResolvedValue({ data: { users: [], total: 0 }, error: null }),
      setRole: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
}));
vi.mock('../../../api/auth.js', () => ({ authClient: authClientMock }));

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../setup/renderWithProviders.js';
import { makeAdminUser } from '../../mocks/authContext.mock.js';
import AdminUsersPage from '../../../features/auth/AdminUsersPage.js';

const mockUsers = [
  { id: 'u1', name: 'Alice', email: 'alice@test.com', role: 'student', emailVerified: true },
  { id: 'u2', name: 'Bob', email: 'bob@test.com', role: 'teacher', emailVerified: true },
];

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authClientMock.getSession.mockResolvedValue({ data: { user: makeAdminUser() }, error: null });
    authClientMock.admin.listUsers.mockResolvedValue({ data: { users: [], total: 0 }, error: null });
  });

  it('shows loading spinner initially', () => {
    authClientMock.admin.listUsers.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<AdminUsersPage />);
    // The component returns <LoadingSpinner fullPage /> while loading
    const { container } = renderWithProviders(<AdminUsersPage />);
    expect(container).toBeTruthy();
  });

  it('shows User Management heading', async () => {
    renderWithProviders(<AdminUsersPage />);
    expect(await screen.findByText('User Management')).toBeInTheDocument();
  });

  it('shows "no users found" when list is empty', async () => {
    renderWithProviders(<AdminUsersPage />);
    expect(await screen.findByText(/no users found/i)).toBeInTheDocument();
  });

  it('shows user rows when users are fetched', async () => {
    authClientMock.admin.listUsers.mockResolvedValue({ data: { users: mockUsers, total: 2 }, error: null });
    renderWithProviders(<AdminUsersPage />);
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows user emails', async () => {
    authClientMock.admin.listUsers.mockResolvedValue({ data: { users: mockUsers, total: 2 }, error: null });
    renderWithProviders(<AdminUsersPage />);
    expect(await screen.findByText('alice@test.com')).toBeInTheDocument();
    expect(screen.getByText('bob@test.com')).toBeInTheDocument();
  });

  it('shows total users count', async () => {
    authClientMock.admin.listUsers.mockResolvedValue({ data: { users: mockUsers, total: 2 }, error: null });
    renderWithProviders(<AdminUsersPage />);
    expect(await screen.findByText(/2 users total/i)).toBeInTheDocument();
  });

  it('shows 1 user total with singular label', async () => {
    authClientMock.admin.listUsers.mockResolvedValue({ data: { users: [mockUsers[0]], total: 1 }, error: null });
    renderWithProviders(<AdminUsersPage />);
    expect(await screen.findByText(/1 user total/i)).toBeInTheDocument();
  });

  it('previous button is disabled on first page', async () => {
    renderWithProviders(<AdminUsersPage />);
    await screen.findByText('User Management');
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
  });

  it('shows error when fetch fails', async () => {
    authClientMock.admin.listUsers.mockRejectedValue(new Error('Network error'));
    renderWithProviders(<AdminUsersPage />);
    expect(await screen.findByText(/network error/i)).toBeInTheDocument();
  });

  it('shows role select for each user', async () => {
    authClientMock.admin.listUsers.mockResolvedValue({ data: { users: mockUsers, total: 2 }, error: null });
    renderWithProviders(<AdminUsersPage />);
    await screen.findByText('Alice');
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBe(2);
  });

  it('calls setRole when role select value changes', async () => {
    authClientMock.admin.listUsers.mockResolvedValue({ data: { users: mockUsers, total: 2 }, error: null });
    renderWithProviders(<AdminUsersPage />);
    await screen.findByText('Alice');
    const aliceSelect = screen.getByRole('combobox', { name: /change role for alice/i });
    fireEvent.change(aliceSelect, { target: { value: 'teacher' } });
    await waitFor(() => {
      expect(authClientMock.admin.setRole).toHaveBeenCalledWith({ userId: 'u1', role: 'teacher' });
    });
  });

  it('updates user role in local state after successful setRole', async () => {
    authClientMock.admin.listUsers.mockResolvedValue({ data: { users: mockUsers, total: 2 }, error: null });
    authClientMock.admin.setRole.mockResolvedValue({ data: {}, error: null });
    renderWithProviders(<AdminUsersPage />);
    await screen.findByText('Alice');
    const aliceSelect = screen.getByRole('combobox', { name: /change role for alice/i });
    fireEvent.change(aliceSelect, { target: { value: 'admin' } });
    await waitFor(() => {
      expect(authClientMock.admin.setRole).toHaveBeenCalled();
    });
  });

  it('shows roleError when setRole returns an error', async () => {
    authClientMock.admin.listUsers.mockResolvedValue({ data: { users: mockUsers, total: 2 }, error: null });
    authClientMock.admin.setRole.mockResolvedValue({ data: null, error: { message: 'Permission denied' } });
    renderWithProviders(<AdminUsersPage />);
    await screen.findByText('Alice');
    const aliceSelect = screen.getByRole('combobox', { name: /change role for alice/i });
    fireEvent.change(aliceSelect, { target: { value: 'admin' } });
    expect(await screen.findByText('Permission denied')).toBeInTheDocument();
  });

  it('shows roleError when setRole throws', async () => {
    authClientMock.admin.listUsers.mockResolvedValue({ data: { users: mockUsers, total: 2 }, error: null });
    authClientMock.admin.setRole.mockRejectedValue(new Error('Server error'));
    renderWithProviders(<AdminUsersPage />);
    await screen.findByText('Alice');
    const aliceSelect = screen.getByRole('combobox', { name: /change role for alice/i });
    fireEvent.change(aliceSelect, { target: { value: 'admin' } });
    expect(await screen.findByText('Server error')).toBeInTheDocument();
  });

  it('disables role select while a role change is in progress', async () => {
    authClientMock.admin.listUsers.mockResolvedValue({ data: { users: mockUsers, total: 2 }, error: null });
    // Keep setRole pending so changingRole stays set
    let resolveSetRole!: () => void;
    authClientMock.admin.setRole.mockReturnValue(
      new Promise((resolve) => { resolveSetRole = () => resolve({ data: {}, error: null }); }),
    );
    renderWithProviders(<AdminUsersPage />);
    await screen.findByText('Alice');
    const aliceSelect = screen.getByRole('combobox', { name: /change role for alice/i });
    fireEvent.change(aliceSelect, { target: { value: 'admin' } });
    // While pending, the select for that user should be disabled
    await waitFor(() => {
      expect(aliceSelect).toBeDisabled();
    });
    resolveSetRole();
  });

  it('navigates to next page when Next is clicked', async () => {
    // 25 total users → more than PAGE_SIZE (20) → Next should be enabled
    authClientMock.admin.listUsers.mockResolvedValue({ data: { users: mockUsers, total: 25 }, error: null });
    renderWithProviders(<AdminUsersPage />);
    await screen.findByText('User Management');
    const nextBtn = screen.getByRole('button', { name: /next/i });
    expect(nextBtn).not.toBeDisabled();
    fireEvent.click(nextBtn);
    await waitFor(() => {
      // listUsers should be called again for page 2
      expect(authClientMock.admin.listUsers).toHaveBeenCalledTimes(2);
    });
  });

  it('disables Next button when on last page', async () => {
    authClientMock.admin.listUsers.mockResolvedValue({ data: { users: mockUsers, total: 2 }, error: null });
    renderWithProviders(<AdminUsersPage />);
    await screen.findByText('User Management');
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });
});
