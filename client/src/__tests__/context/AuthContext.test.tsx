import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authClientMock } from '../mocks/authClient.mock.js';
import { makeStudentUser, makeTeacherUser } from '../mocks/authContext.mock.js';

vi.mock('../../api/auth.js', () => ({ authClient: authClientMock }));

import { AuthProvider, useAuth } from '../../context/AuthContext.js';

function makeWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
  };
}

describe('AuthContext / AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no session
    authClientMock.getSession.mockResolvedValue({ data: null, error: null });
  });

  describe('session restore on mount', () => {
    it('calls authClient.getSession on mount', async () => {
      renderHook(() => useAuth(), { wrapper: makeWrapper() });
      await waitFor(() => expect(authClientMock.getSession).toHaveBeenCalledTimes(1));
    });

    it('sets user in state when session contains a user', async () => {
      const student = makeStudentUser();
      authClientMock.getSession.mockResolvedValueOnce({ data: { user: student }, error: null });

      const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });
      await waitFor(() => expect(result.current.user).toEqual(student));
    });

    it('isLoading is true initially, then false after session resolves', async () => {
      let resolveSession!: (value: { data: null; error: null }) => void;
      authClientMock.getSession.mockReturnValueOnce(
        new Promise(resolve => { resolveSession = resolve; }),
      );

      const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });
      expect(result.current.isLoading).toBe(true);

      act(() => { resolveSession({ data: null, error: null }); });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
    });

    it('user is null when session has no user', async () => {
      authClientMock.getSession.mockResolvedValueOnce({ data: null, error: null });

      const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.user).toBeNull();
    });
  });

  describe('login()', () => {
    it('calls authClient.signIn.email with correct credentials', async () => {
      const student = makeStudentUser();
      authClientMock.signIn.email.mockResolvedValueOnce({ data: { user: student }, error: null });

      const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.login('s@test.com', 'password123');
      });

      expect(authClientMock.signIn.email).toHaveBeenCalledWith({
        email: 's@test.com',
        password: 'password123',
      });
    });

    it('sets user in state after successful login', async () => {
      const student = makeStudentUser();
      authClientMock.signIn.email.mockResolvedValueOnce({ data: { user: student }, error: null });

      const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.login('s@test.com', 'password123');
      });

      expect(result.current.user).toEqual(student);
    });

    it('throws when signIn returns an error', async () => {
      authClientMock.signIn.email.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid credentials' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(
        act(async () => {
          await result.current.login('s@test.com', 'wrong');
        }),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register()', () => {
    it('calls authClient.signUp.email with correct data', async () => {
      const student = makeStudentUser();
      authClientMock.signUp.email.mockResolvedValueOnce({ data: { user: student }, error: null });

      const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.register({ name: 'Student', email: 's@test.com', password: 'pass' });
      });

      expect(authClientMock.signUp.email).toHaveBeenCalledWith({
        name: 'Student',
        email: 's@test.com',
        password: 'pass',
      });
    });

    it('sets user in state after successful registration', async () => {
      const student = makeStudentUser();
      authClientMock.signUp.email.mockResolvedValueOnce({ data: { user: student }, error: null });

      const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.register({ name: 'Student', email: 's@test.com', password: 'pass' });
      });

      expect(result.current.user).toEqual(student);
    });
  });

  describe('logout()', () => {
    it('calls authClient.signOut', async () => {
      const student = makeStudentUser();
      authClientMock.getSession.mockResolvedValueOnce({ data: { user: student }, error: null });

      const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });
      await waitFor(() => expect(result.current.user).toEqual(student));

      await act(async () => {
        await result.current.logout();
      });

      expect(authClientMock.signOut).toHaveBeenCalledTimes(1);
    });

    it('clears user in state after logout', async () => {
      const student = makeStudentUser();
      authClientMock.getSession.mockResolvedValueOnce({ data: { user: student }, error: null });

      const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });
      await waitFor(() => expect(result.current.user).toEqual(student));

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
    });

    it('clears user even when signOut throws', async () => {
      const student = makeStudentUser();
      authClientMock.getSession.mockResolvedValueOnce({ data: { user: student }, error: null });
      authClientMock.signOut.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });
      await waitFor(() => expect(result.current.user).toEqual(student));

      // logout() uses try/finally — it clears user but still re-throws the error
      await act(async () => {
        try {
          await result.current.logout();
        } catch {
          // expected — signOut threw, user cleared via finally
        }
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('refreshUser()', () => {
    it('re-fetches session and updates user', async () => {
      const teacher = makeTeacherUser();
      // First call: no session; second call (refreshUser): has user
      authClientMock.getSession
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: { user: teacher }, error: null });

      const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.user).toBeNull();

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(result.current.user).toEqual(teacher);
    });
  });

  describe('auth:unauthorized event', () => {
    it('clears user state when auth:unauthorized is dispatched on window', async () => {
      const student = makeStudentUser();
      authClientMock.getSession.mockResolvedValueOnce({ data: { user: student }, error: null });

      const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });
      await waitFor(() => expect(result.current.user).toEqual(student));

      act(() => {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      });

      await waitFor(() => expect(result.current.user).toBeNull());
    });

    it('removes auth:unauthorized event listener on unmount', async () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useAuth(), { wrapper: makeWrapper() });
      await waitFor(() => expect(authClientMock.getSession).toHaveBeenCalled());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('auth:unauthorized', expect.any(Function));
    });
  });

  describe('useAuth()', () => {
    it('returns context value with all expected fields', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current).toMatchObject({
        user: null,
        isLoading: false,
        login: expect.any(Function),
        register: expect.any(Function),
        logout: expect.any(Function),
        refreshUser: expect.any(Function),
      });
    });
  });
});
