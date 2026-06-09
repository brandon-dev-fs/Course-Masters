import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import useCanEdit from '../../hooks/useCanEdit.js';
import { AuthContext } from '../../context/AuthContext.js';
import {
  makeAuthContext,
  makeStudentUser,
  makeTeacherUser,
  makeAdminUser,
} from '../mocks/authContext.mock.js';

/**
 * Renders useCanEdit inside a controlled AuthContext.Provider.
 * Uses the direct provider pattern (not renderWithProviders) because
 * useCanEdit only needs a synchronous, predetermined auth state.
 */
function renderUseCanEdit(contextValue: ReturnType<typeof makeAuthContext>) {
  return renderHook(() => useCanEdit(), {
    wrapper: ({ children }) => (
      <AuthContext.Provider value={contextValue}>
        {children}
      </AuthContext.Provider>
    ),
  });
}

describe('useCanEdit', () => {
  it('returns false when user is null (unauthenticated)', () => {
    const { result } = renderUseCanEdit(makeAuthContext({ user: null }));
    expect(result.current).toBe(false);
  });

  it('returns false when user role is student', () => {
    const { result } = renderUseCanEdit(
      makeAuthContext({ user: makeStudentUser() }),
    );
    expect(result.current).toBe(false);
  });

  it('returns true when user role is teacher', () => {
    const { result } = renderUseCanEdit(
      makeAuthContext({ user: makeTeacherUser() }),
    );
    expect(result.current).toBe(true);
  });

  it('returns true when user role is admin', () => {
    const { result } = renderUseCanEdit(
      makeAuthContext({ user: makeAdminUser() }),
    );
    expect(result.current).toBe(true);
  });

  it('updates when user role changes from student to teacher', () => {
    let contextValue = makeAuthContext({ user: makeStudentUser() });
    const { result, rerender } = renderHook(() => useCanEdit(), {
      wrapper: ({ children }) => (
        <AuthContext.Provider value={contextValue}>
          {children}
        </AuthContext.Provider>
      ),
    });

    expect(result.current).toBe(false);

    contextValue = makeAuthContext({ user: makeTeacherUser() });
    rerender();
    expect(result.current).toBe(true);
  });

  it('updates when user role changes from teacher to student', () => {
    let contextValue = makeAuthContext({ user: makeTeacherUser() });
    const { result, rerender } = renderHook(() => useCanEdit(), {
      wrapper: ({ children }) => (
        <AuthContext.Provider value={contextValue}>
          {children}
        </AuthContext.Provider>
      ),
    });

    expect(result.current).toBe(true);

    contextValue = makeAuthContext({ user: makeStudentUser() });
    rerender();
    expect(result.current).toBe(false);
  });

  it('updates when user logs out (user becomes null)', () => {
    let contextValue = makeAuthContext({ user: makeTeacherUser() });
    const { result, rerender } = renderHook(() => useCanEdit(), {
      wrapper: ({ children }) => (
        <AuthContext.Provider value={contextValue}>
          {children}
        </AuthContext.Provider>
      ),
    });

    expect(result.current).toBe(true);

    contextValue = makeAuthContext({ user: null });
    rerender();
    expect(result.current).toBe(false);
  });
});
